import { AsyncLocalStorage } from "node:async_hooks";

export type AuditContext = {
  tenantId?: string | undefined;
};

const storage = new AsyncLocalStorage<AuditContext>();

/** Runs MCP tool handling with per-request audit fields (e.g. JWT tenant). */
export function runWithAuditContext<T>(ctx: AuditContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function runWithAuditContextAsync<T>(ctx: AuditContext, fn: () => Promise<T>): Promise<T> {
  return storage.run(ctx, fn);
}

export function getAuditContext(): AuditContext | undefined {
  return storage.getStore();
}
