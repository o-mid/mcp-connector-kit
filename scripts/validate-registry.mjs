#!/usr/bin/env node
/** CI guard: registry/sources JSON must match sources/<id> packages and trust-tier ids. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryDir = path.join(root, "registry", "sources");
const trustPaid = [
  "fixture",
  "wikipedia",
  "open-meteo",
  "frankfurter",
  "openalex",
  "openlibrary",
  "hn",
  "usgs",
  "worldbank",
  "github",
  "web-reader",
  "brave",
  "exa",
  "tavily",
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
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
}

for (const id of trustPaid) {
  if (!ids.includes(id)) {
    console.error(`trust tier source ${id} missing from registry/sources`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  console.log(`registry ok (${files.length} sources)`);
}
