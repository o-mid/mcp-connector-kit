#!/usr/bin/env python3
"""Remove Cursor/AI attribution lines from git commit messages."""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

CO_AUTHOR_CURSOR = re.compile(r"^Co-authored-by:\s*Cursor\b", re.I)
CO_AUTHOR_BOT = re.compile(r"^Co-authored-by:\s*.*cursoragent@", re.I)
MADE_WITH = re.compile(r"^Made with(\s+\[Cursor\]|\s+Cursor)\b", re.I)
INLINE_CURSOR = re.compile(r"\[cursor\]|\[cowork\]|made by cursor|made with cursor", re.I)


def strip_message(text: str) -> str:
    lines = text.splitlines()
    kept: list[str] = []
    for line in lines:
        if CO_AUTHOR_CURSOR.match(line) or CO_AUTHOR_BOT.match(line):
            continue
        if MADE_WITH.match(line):
            continue
        if line.strip().startswith("Co-authored-by:") and "cursor" in line.lower():
            continue
        kept.append(line)
    while kept and kept[-1].strip() == "":
        kept.pop()
    if not kept:
        return text
    return "\n".join(kept) + "\n"


def check_message(text: str) -> list[str]:
    violations: list[str] = []
    for i, line in enumerate(text.splitlines(), start=1):
        if CO_AUTHOR_CURSOR.match(line) or CO_AUTHOR_BOT.match(line):
            violations.append(f"line {i}: Co-authored-by Cursor")
        elif MADE_WITH.match(line):
            violations.append(f"line {i}: Made with Cursor footer")
    return violations


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, help="Rewrite a commit message file in place")
    parser.add_argument("--check", action="store_true", help="Exit 1 if violations found on stdin")
    args = parser.parse_args()

    if args.file:
        raw = args.file.read_text(encoding="utf-8")
        cleaned = strip_message(raw)
        if cleaned != raw:
            args.file.write_text(cleaned, encoding="utf-8")
        return 0

    raw = sys.stdin.read()
    if args.check:
        violations = check_message(raw)
        if violations:
            for v in violations:
                print(v, file=sys.stderr)
            return 1
        return 0

    sys.stdout.write(strip_message(raw))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
