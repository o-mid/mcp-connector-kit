#!/usr/bin/env node
/** CI guard: registry/sources JSON must match sources/<id> packages and the shared catalog. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryDir = path.join(root, "registry", "sources");
const catalogPath = path.join(root, "packages/catalog/src/data.json");
const generatedPath = path.join(root, "apps/web/src/generated/catalog.ts");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const catalog = readJson(catalogPath);
const trustPaid = catalog.sources.map((s) => s.id);
const byId = new Map(catalog.sources.map((s) => [s.id, s]));

const generated = fs.readFileSync(generatedPath, "utf8");
const expectedBlob = JSON.stringify(catalog, null, 2);
if (!generated.includes(expectedBlob)) {
  console.error("apps/web/src/generated/catalog.ts is stale; run pnpm catalog:generate");
  process.exitCode = 1;
}

const files = fs.readdirSync(registryDir).filter((f) => f.endsWith(".json"));
const ids = [];
for (const file of files) {
  const doc = readJson(path.join(registryDir, file));
  if (!doc.id || !doc.package) {
    console.error(`invalid registry entry: ${file}`);
    process.exitCode = 1;
    continue;
  }
  ids.push(doc.id);
  const srcDir = path.join(root, "sources", doc.id);
  if (!fs.existsSync(srcDir)) {
    console.error(`missing sources/${doc.id} for ${file}`);
    process.exitCode = 1;
  }
  const pkgPath = path.join(srcDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = readJson(pkgPath);
    if (pkg.name !== doc.package) {
      console.error(`${file}: package ${doc.package} != ${pkg.name}`);
      process.exitCode = 1;
    }
  }
  const meta = byId.get(doc.id);
  if (meta) {
    if (doc.package !== meta.package) {
      console.error(`${file}: package ${doc.package} != catalog ${meta.package}`);
      process.exitCode = 1;
    }
    if (doc.title !== meta.title) {
      console.error(`${file}: title ${JSON.stringify(doc.title)} != catalog ${JSON.stringify(meta.title)}`);
      process.exitCode = 1;
    }
    if (doc.tier !== meta.tier) {
      console.error(`${file}: tier ${JSON.stringify(doc.tier)} != catalog ${JSON.stringify(meta.tier)}`);
      process.exitCode = 1;
    }
    const hosts = Array.isArray(doc.hosts) ? doc.hosts : null;
    if (!hosts || JSON.stringify(hosts) !== JSON.stringify(meta.hosts)) {
      console.error(`${file}: hosts ${JSON.stringify(doc.hosts)} != catalog ${JSON.stringify(meta.hosts)}`);
      process.exitCode = 1;
    }
  }
}

for (const id of trustPaid) {
  if (!ids.includes(id)) {
    console.error(`catalog source ${id} missing from registry/sources`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  console.log(`registry ok (${files.length} sources)`);
}
