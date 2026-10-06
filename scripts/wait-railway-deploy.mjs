#!/usr/bin/env node
/**
 * Poll `railway deployment list --json` until the latest (or given) deployment
 * reaches SUCCESS or FAILED. Exits 0 only on SUCCESS.
 *
 * Usage: node scripts/wait-railway-deploy.mjs [deployment-id]
 * Env: MCK_WAIT_TIMEOUT_MS (default 600000), MCK_WAIT_INTERVAL_MS (default 15000)
 */
import { execSync } from "node:child_process";

const targetId = process.argv[2];
const timeoutMs = Number(process.env.MCK_WAIT_TIMEOUT_MS ?? 600_000);
const intervalMs = Number(process.env.MCK_WAIT_INTERVAL_MS ?? 15_000);
const started = Date.now();

function listDeployments() {
  const raw = execSync("railway deployment list --json --limit 10", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  return JSON.parse(raw);
}

function pick(deployments) {
  if (targetId) {
    const found = deployments.find((d) => d.id === targetId);
    if (!found) throw new Error(`deployment ${targetId} not in recent list`);
    return found;
  }
  const latest = deployments[0];
  if (!latest) throw new Error("no deployments returned");
  return latest;
}

const terminal = new Set(["SUCCESS", "FAILED", "CRASHED", "REMOVED"]);

while (true) {
  const deployment = pick(listDeployments());
  const { id, status } = deployment;
  console.log(`${new Date().toISOString()} ${id} ${status}`);
  if (status === "SUCCESS") process.exit(0);
  if (terminal.has(status) && status !== "SUCCESS") {
    console.error(`deployment ended with ${status}`);
    process.exit(1);
  }
  if (Date.now() - started > timeoutMs) {
    console.error("timed out waiting for SUCCESS");
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, intervalMs));
}
