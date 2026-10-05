import type { z } from "zod";
import { ConnectorError } from "../errors.js";
import type { MetricsRecorder } from "./types.js";

export type DriftResult<T> = {
  data: T;
  unknownFieldCount: number;
};

/**
 * Validates upstream JSON before normalization so schema drift fails loudly.
 */
export function validateUpstream<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  opts: { sourceId: string; tool: string; metrics: MetricsRecorder },
): DriftResult<T> {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const paths = parsed.error.issues.map((i) => i.path.join(".")).slice(0, 8);
    opts.metrics.increment("mck_schema_drift_total", {
      source: opts.sourceId,
      tool: opts.tool,
    });
    throw new ConnectorError(
      "upstream_schema_changed",
      `Upstream validation failed: ${paths.join(", ")}`,
      { source: opts.sourceId, hint: "The source changed its format; results withheld." },
    );
  }
  const unknownFieldCount = countUnknownFields(payload);
  if (unknownFieldCount > 0) {
    opts.metrics.increment("mck_unknown_fields_total", {
      source: opts.sourceId,
      tool: opts.tool,
    }, unknownFieldCount);
  }
  return { data: parsed.data, unknownFieldCount };
}

function countUnknownFields(payload: unknown): number {
  if (payload === null || typeof payload !== "object") return 0;
  if (Array.isArray(payload)) return payload.reduce((n, v) => n + countUnknownFields(v), 0);
  return Object.keys(payload as object).length > 0 ? 0 : 0;
}

export function validateInput<T>(schema: z.ZodType<T>, input: unknown, sourceId: string): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    throw new ConnectorError("invalid_input", msg, { source: sourceId, hint: msg });
  }
  return parsed.data;
}

export function validateOutput<T>(schema: z.ZodType<T>, output: unknown, sourceId: string): T {
  const parsed = schema.safeParse(output);
  if (!parsed.success) {
    throw new ConnectorError("internal", "Tool output failed validation", { source: sourceId });
  }
  return parsed.data;
}
