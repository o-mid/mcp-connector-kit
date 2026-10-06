import { Counter, Gauge, Histogram, Registry } from "prom-client";

/** Shared Prometheus registry for gateway /metrics. */
export const metricsRegistry = new Registry();
import type { MetricsRecorder } from "@mck/core";

/**
 * Binds core metric events to Prometheus series exposed at /metrics.
 */
let cachedRecorder: MetricsRecorder | undefined;

export function createPrometheusRecorder(registry: Registry): MetricsRecorder {
  if (cachedRecorder) return cachedRecorder;

  const toolCalls = new Counter({
    name: "mck_tool_calls_total",
    help: "Tool invocations by outcome",
    labelNames: ["source", "tool", "outcome"],
    registers: [registry],
  });
  const toolDuration = new Histogram({
    name: "mck_tool_duration_seconds",
    help: "Tool execution duration in seconds",
    labelNames: ["source", "tool"],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 15],
    registers: [registry],
  });
  const cacheHits = new Counter({
    name: "mck_cache_hits_total",
    help: "Cache hits for tool calls",
    labelNames: ["source", "tool"],
    registers: [registry],
  });
  const schemaDrift = new Counter({
    name: "mck_schema_drift_total",
    help: "Upstream schema validation failures",
    labelNames: ["source", "tool"],
    registers: [registry],
  });
  const unknownFields = new Counter({
    name: "mck_unknown_fields_total",
    help: "Count of extra upstream fields observed",
    labelNames: ["source", "tool"],
    registers: [registry],
  });
  const breakerState = new Gauge({
    name: "mck_breaker_state",
    help: "Circuit breaker state (0 closed, 1 open, 2 half_open)",
    labelNames: ["source"],
    registers: [registry],
  });

  cachedRecorder = {
    increment(name, labels = {}, value = 1) {
      const L = labels;
      switch (name) {
        case "mck_tool_calls_total":
          toolCalls.inc({ source: L.source ?? "", tool: L.tool ?? "", outcome: L.outcome ?? "" }, value);
          break;
        case "mck_cache_hits_total":
          cacheHits.inc({ source: L.source ?? "", tool: L.tool ?? "" }, value);
          break;
        case "mck_schema_drift_total":
          schemaDrift.inc({ source: L.source ?? "", tool: L.tool ?? "" }, value);
          break;
        case "mck_unknown_fields_total":
          unknownFields.inc({ source: L.source ?? "", tool: L.tool ?? "" }, value);
          break;
        default:
          break;
      }
    },
    observe(name, value, labels = {}) {
      const L = labels;
      if (name === "mck_tool_duration_seconds") {
        toolDuration.observe({ source: L.source ?? "", tool: L.tool ?? "" }, value);
      }
      if (name === "mck_breaker_state") {
        breakerState.set({ source: L.source ?? "" }, value);
      }
    },
  };
  return cachedRecorder;
}
