#!/usr/bin/env node
/**
 * Curl production (or any) gateway health routes. Used in CI and after deploy.
 *
 * Env:
 *   MCK_GATEWAY_BASE_URL  default: registry/server.json remotes[0] host
 *   MCK_SMOKE_DEMO=1      require GET /demo/healthz to be 200 (otherwise 200 is noted, 404 is skipped)
 *
 * Also checks GET /demo/healthz when it returns 200, and when sku=free asserts
 * readyz.sources includes the catalog free-tier ids.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function defaultBaseUrl() {
  const reg = JSON.parse(fs.readFileSync(path.join(root, "registry", "server.json"), "utf8"));
  const url = reg.remotes?.[0]?.url;
  if (!url || typeof url !== "string") throw new Error("registry/server.json missing remotes[0].url");
  return new URL(url).origin;
}

function catalogFreeIds() {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, "packages/catalog/src/data.json"), "utf8"));
  return catalog.sources.filter((s) => s.tier === "free").map((s) => s.id);
}

const base = (process.env.MCK_GATEWAY_BASE_URL ?? defaultBaseUrl()).replace(/\/$/, "");
const requireDemo = process.env.MCK_SMOKE_DEMO === "1" || process.env.MCK_SMOKE_DEMO === "true";

async function get(pathname) {
  const res = await fetch(`${base}${pathname}`);
  const text = await res.text();
  if (!res.ok) throw new Error(`${pathname} ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function getOptional(pathname) {
  const res = await fetch(`${base}${pathname}`);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

const health = await get("/healthz");
if (health.status !== "ok") throw new Error(`healthz: ${JSON.stringify(health)}`);
if (health.sku !== "free" && health.sku !== "paid") {
  throw new Error(`healthz missing sku (got ${JSON.stringify(health)})`);
}

const ready = await get("/readyz");
const ids = Object.keys(ready.sources ?? {});
if (ids.length === 0) throw new Error("readyz has no sources");

if (health.sku === "free") {
  const missing = catalogFreeIds().filter((id) => !ids.includes(id));
  if (missing.length) {
    throw new Error(`readyz missing free-tier sources: ${missing.join(",")}`);
  }
}

const demo = await getOptional("/demo/healthz");
if (requireDemo && demo.status !== 200) {
  throw new Error(`/demo/healthz ${demo.status} (MCK_SMOKE_DEMO=1 requires 200)`);
}
if (demo.status === 200 && demo.body?.demo !== true) {
  throw new Error(`demo/healthz unexpected body: ${JSON.stringify(demo.body)}`);
}

const demoNote = demo.status === 200 ? "demo=on" : demo.status === 404 ? "demo=off" : `demo=${demo.status}`;
console.log(`ok ${base} sku=${health.sku} sources=${ids.join(",")} ${demoNote}`);
