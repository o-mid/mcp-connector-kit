import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkFixtureContracts } from "@mck/testing";
import { recordContract } from "./record.js";

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
    const source = rest[0];
    const tool = rest[1];
    const inputFlag = rest.indexOf("--input");
    const outFlag = rest.indexOf("--out");
    if (!source || !tool || inputFlag === -1) {
      console.error(
        "usage: mck record <source> <tool> --input '{\"query\":\"...\"}' [--out path] (requires MCK_LIVE=1)",
      );
      process.exitCode = 1;
      return;
    }
    const inputJson = rest[inputFlag + 1];
    if (!inputJson) {
      console.error("missing --input JSON");
      process.exitCode = 1;
      return;
    }
    const out = outFlag === -1 ? undefined : rest[outFlag + 1];
    const root = process.cwd();
    const file = await recordContract({
      root,
      source,
      tool,
      inputJson,
      ...(out ? { out } : {}),
    });
    console.log(`recorded ${file}`);
    console.error("Add mock block for offline CI replay, then run: pnpm mck check");
    return;
  }
  console.log("usage: mck new source <name> | mck check [repo-root] | mck record <source> <tool> --input '{}'");
}

async function scaffoldSource(name: string): Promise<void> {
  const root = path.join(process.cwd(), "sources", name);
  const src = path.join(root, "src");
  await mkdir(path.join(root, "fixtures"), { recursive: true });
  await mkdir(src, { recursive: true });
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
    devDependencies: { "@mck/testing": "workspace:*", tsup: "^8.4.0", vitest: "^3.2.4" },
  };
  await writeFile(path.join(root, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
  await writeFile(
    path.join(root, "tsconfig.json"),
    `${JSON.stringify({ extends: "../../tsconfig.base.json", compilerOptions: { outDir: "dist", rootDir: "src" }, include: ["src"] }, null, 2)}\n`,
  );
  await writeFile(
    path.join(root, "tsup.config.ts"),
    `import { defineConfig } from "tsup";\nexport default defineConfig({ entry: ["src/index.ts"], format: ["esm"], dts: true, clean: true, target: "node22" });\n`,
  );
  await writeFile(
    path.join(root, "vitest.config.ts"),
    `import { defineConfig } from "vitest/config";\nexport default defineConfig({ test: { environment: "node", setupFiles: ["../../scripts/vitest-network-guard.ts"] } });\n`,
  );
  await writeFile(
    path.join(src, "source.ts"),
    `import { defineSource, defineTool } from "@mck/core";\nimport { z } from "zod";\n\nconst example = defineTool({\n  name: "example",\n  description: "Replace with your tool.",\n  input: z.object({ query: z.string() }),\n  upstream: z.record(z.unknown()),\n  output: z.object({ query: z.string(), ok: z.boolean() }),\n  async run({ input }) {\n    return { query: input.query, ok: true };\n  },\n});\n\nexport const ${name.replace(/-/g, "")}Source = defineSource({\n  id: "${name}",\n  title: "${name}",\n  baseUrls: ["https://api.example.com"],\n  limits: { rps: 1, burst: 2, concurrency: 2, timeoutMs: 10_000 },\n  cache: { defaultTtlMs: 60_000 },\n  userAgent: "mck-${name}/1.0",\n  tools: [example],\n});\n`,
  );
  await writeFile(path.join(src, "index.ts"), `export { ${name.replace(/-/g, "")}Source } from "./source.js";\n`);
  await writeFile(
    path.join(src, "contract.test.ts"),
    `import path from "node:path";\nimport { fileURLToPath } from "node:url";\nimport { describeSourceContractReplay } from "@mck/testing/describe-contract-replay";\nimport { ${name.replace(/-/g, "")}Source } from "./source.js";\nconst dir = path.dirname(fileURLToPath(import.meta.url));\ndescribeSourceContractReplay("${name}", ${name.replace(/-/g, "")}Source, path.join(dir, "../fixtures"));\n`,
  );
  await writeFile(
    path.join(root, "fixtures", "example.contract.json"),
    `${JSON.stringify(
      {
        source: name,
        tool: "example",
        input: { query: "test" },
        mock: { origin: "https://api.example.com", pathPrefix: "/", body: {} },
        output: { query: "test", ok: true },
      },
      null,
      2,
    )}\n`,
  );
  console.log(`scaffolded sources/${name} — register in apps/gateway/src/sources.ts`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
