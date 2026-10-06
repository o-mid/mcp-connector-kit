import type { z } from "zod";
import { ConnectorError, validateUpstream } from "@mck/core";
import type { MetricsRecorder } from "@mck/core";

const noopMetrics: MetricsRecorder = {
  increment: () => undefined,
  observe: () => undefined,
};

/**
 * Asserts upstream JSON matches schema; throws upstream_schema_changed on failure.
 */
export function expectUpstreamValid<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  meta: { sourceId: string; tool: string },
): T {
  return validateUpstream(schema, payload, {
    sourceId: meta.sourceId,
    tool: meta.tool,
    metrics: noopMetrics,
  }).data;
}

/**
 * Mutates a copy of a fixture for drift regression tests.
 */
export function withFieldRemoved<T extends Record<string, unknown>>(
  fixture: T,
  key: string,
): T {
  const { [key]: _removed, ...rest } = fixture;
  return rest as T;
}

export function expectSchemaDrift(
  schema: z.ZodType<unknown>,
  badPayload: unknown,
  meta: { sourceId: string; tool: string },
): void {
  try {
    expectUpstreamValid(schema, badPayload, meta);
    throw new Error("Expected upstream_schema_changed");
  } catch (err) {
    if (!(err instanceof ConnectorError) || err.code !== "upstream_schema_changed") {
      throw err;
    }
  }
}
