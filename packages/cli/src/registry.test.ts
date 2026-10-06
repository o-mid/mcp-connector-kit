import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const script = path.join(root, "scripts/validate-registry.mjs");

describe("registry metadata", () => {
  it("matches trust tier sources and package names", () => {
    const out = execFileSync(process.execPath, [script], { encoding: "utf8" });
    expect(out).toContain("registry ok");
  });
});
