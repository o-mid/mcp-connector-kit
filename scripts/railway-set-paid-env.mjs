#!/usr/bin/env node
/**
 * Sets Railway variables for paid trust-tier gateway (no API key values — set those in dashboard).
 * Requires linked Railway project: railway link
 */
import { execSync } from "node:child_process";

const pairs = {
  MCK_TRANSPORT: "http",
  MCK_SOURCE_PROFILE: "trust",
  MCK_SKU: "paid",
  MCK_LEGACY_TOOL_NAMES: "true",
  MCK_AUDIT_LOG: "true",
  LOG_LEVEL: "info",
  PORT: "8080",
  MCK_CACHE: "memory",
};

for (const [key, value] of Object.entries(pairs)) {
  execSync(`railway variables set ${key}=${value}`, { stdio: "inherit" });
}

console.error(
  "Set paid profile variables. Add secrets in Railway: MCK_API_KEYS, GITHUB_TOKEN, BRAVE_API_KEY, EXA_API_KEY, TAVILY_API_KEY, MCK_WEB_READER_ALLOWLIST, optional MCK_OAUTH_* and REDIS_URL.",
);
