#!/usr/bin/env node
/**
 * Curl production (or any) gateway health routes. Used in CI and after deploy.
 *
 * Env: MCK_GATEWAY_BASE_URL (default: registry/server.json remotes[0] host)
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

const base = (process.env.MCK_GATEWAY_BASE_URL ?? defaultBaseUrl()).replace(/\/$/, "");

async function get(pathname) {
  const res = await fetch(`${base}${pathname}`);
  const text = await res.text();
  if (!res.ok) throw new Error(`${pathname} ${res.status}: ${text}`);
  return JSON.parse(text);
}

const health = await get("/healthz");
if (health.status !== "ok") throw new Error(`healthz: ${JSON.stringify(health)}`);
if (health.sku !== "free" && health.sku !== "paid") {
  throw new Error(`healthz missing sku (got ${JSON.stringify(health)})`);
}

const ready = await get("/readyz");
const ids = Object.keys(ready.sources ?? {});
if (ids.length === 0) throw new Error("readyz has no sources");

console.log(`ok ${base} sku=${health.sku} sources=${ids.join(",")}`);
