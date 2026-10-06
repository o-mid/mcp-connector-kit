#!/usr/bin/env node
/**
 * Applies one-time ops from `.env.secrets` (gitignored):
 * - gh secret set NPM_TOKEN
 * - railway variables for paid tier + upstream API keys
 *
 * Usage: cp .env.secrets.example .env.secrets && edit && pnpm ops:apply
 */
import { execSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const secretsPath = path.join(root, ".env.secrets");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${file} — copy from .env.secrets.example and fill values.`);
    process.exit(1);
  }
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function sh(cmd, opts = {}) {
  execSync(cmd, { stdio: "inherit", ...opts });
}

const env = loadEnvFile(secretsPath);

if (env.NPM_TOKEN) {
  console.log("Setting GitHub secret NPM_TOKEN…");
  execSync("gh secret set NPM_TOKEN --body-file -", {
    cwd: root,
    stdio: ["pipe", "inherit", "inherit"],
    input: env.NPM_TOKEN,
  });
} else {
  console.warn("Skip NPM_TOKEN (empty in .env.secrets).");
}

if (!env.MCK_API_KEYS) {
  env.MCK_API_KEYS = `mck_${crypto.randomBytes(24).toString("hex")}`;
  console.log("Generated MCK_API_KEYS for Railway (save this for MCP clients):");
  console.log(env.MCK_API_KEYS);
}

console.log("Applying Railway paid profile + secrets…");
sh("node scripts/railway-set-paid-env.mjs", { cwd: root });

const allowlist =
  "https://docs.github.com,https://en.wikipedia.org,https://www.wikipedia.org,https://raw.githubusercontent.com";

const railwayVars = {
  MCK_WEB_READER_ALLOWLIST: allowlist,
  MCK_API_KEYS: env.MCK_API_KEYS,
  ...(env.GITHUB_TOKEN ? { GITHUB_TOKEN: env.GITHUB_TOKEN } : {}),
  ...(env.BRAVE_API_KEY ? { BRAVE_API_KEY: env.BRAVE_API_KEY } : {}),
  ...(env.EXA_API_KEY ? { EXA_API_KEY: env.EXA_API_KEY } : {}),
  ...(env.TAVILY_API_KEY ? { TAVILY_API_KEY: env.TAVILY_API_KEY } : {}),
};

for (const [key, value] of Object.entries(railwayVars)) {
  if (!value) continue;
  sh(`railway variables set ${key}=${shellQuote(value)}`, { cwd: root });
}

console.log("Done. Verify: pnpm smoke:production (free URL may differ if service is now paid).");
console.log("After merge to main with NPM_TOKEN set, release workflow publishes to npm.");
console.log("Tag container release: git tag v1.0.1 && git push origin v1.0.1");

function shellQuote(value) {
  if (/^[A-Za-z0-9_.,:/+-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
