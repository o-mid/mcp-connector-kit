import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkFixtureContracts } from "@mck/testing";

const [, , cmd, ...rest] = process.argv;

async function main(): Promise<void> {
  if (cmd === "new" && rest[0] === "source") {
    const name = rest[1];
    if (!name) throw new Error("usage: mck new source <name>");
    await scaffoldSource(name);
    return;
  }
  if (cmd === "check") {
    const root = rest[0] ? path.resolve(rest[0]) : process.cwd();
    const results = await checkFixtureContracts(root);
    const failed = results.filter((r) => !r.ok);
    for (const r of results) {
      const rel = path.relative(root, r.file);
      if (r.ok) console.log(`ok ${rel}`);
      else console.error(`fail ${rel}: ${r.error}`);
    }
    if (failed.length) {
      process.exitCode = 1;
      console.error(`${failed.length} fixture contract(s) failed`);
    } else {
      console.log(`${results.length} fixture contract(s) valid`);
    }
    return;
  }
  if (cmd === "record") {
    console.error("record: point MCK_LIVE=1 and use saveFixture() from @mck/testing in a script.");
    return;
  }
  console.log("usage: mck new source <name> | mck check [repo-root] | mck record");
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
  await writeFile(
    path.join(root, "fixtures", "sample.contract.json"),
    `${JSON.stringify({ source: name, tool: "example", upstream: {} }, null, 2)}\n`,
  );
  console.log(`scaffolded sources/${name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
