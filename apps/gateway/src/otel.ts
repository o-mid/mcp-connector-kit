/**
 * Registers OpenTelemetry when OTEL_EXPORTER_OTLP_ENDPOINT is set (gateway boot only).
 */
export async function initOtelIfConfigured(env: NodeJS.ProcessEnv = process.env): Promise<void> {
  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) return;

  const [{ NodeSDK }, { OTLPTraceExporter }] = await Promise.all([
    import("@opentelemetry/sdk-node"),
    import("@opentelemetry/exporter-trace-otlp-http"),
  ]);

  const sdk = new NodeSDK({
    serviceName: env.OTEL_SERVICE_NAME ?? "mck-gateway",
    traceExporter: new OTLPTraceExporter({
      url: env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
  });

  sdk.start();
  process.on("SIGTERM", () => void sdk.shutdown());
}
