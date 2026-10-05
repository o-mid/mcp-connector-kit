#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const [, , cmd, ...rest] = process.argv;

async function main(): Promise<void> {
  if (cmd === "new" && rest[0] === "source") {
    const name = rest[1];
    if (!name) throw new Error("usage: mck new source <name>");
    await scaffoldSource(name);
    return;
  }
  if (cmd === "record") {
    console.error("record requires a running upstream capture pipeline; use fixture JSON in tests for now.");
    return;
  }
  if (cmd === "check") {
    console.log("fixture check: run pnpm test in each source package");
    return;
  }
  console.log("usage: mck new source <name> | mck record <source> <tool> | mck check");
}

async function scaffoldSource(name: string): Promise<void> {
  const root = path.join(process.cwd(), "sources", name);
  await mkdir(path.join(root, "src"), { recursive: true });
  await mkdir(path.join(root, "fixtures"), { recursive: true });
  const pkg = {
    name: `@mck/source-${name}`,
    version: "1.0.0",
    type: "module",
    exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" } },
    scripts: {
      build: "tsup",
      typecheck: "tsc -p tsconfig.json --noEmit",
      lint: "eslint src",
      test: "vitest run",
    },
    dependencies: { "@mck/core": "workspace:*", zod: "^3.24.3" },
    devDependencies: { tsup: "^8.4.0" },
  };
  await writeFile(path.join(root, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`scaffolded sources/${name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
