import { SpanStatusCode, trace } from "@opentelemetry/api";

const TRACER_NAME = "mck";

/** Runs fn inside an OpenTelemetry span when a SDK is registered; otherwise runs fn directly. */
export async function withToolSpan<T>(
  name: string,
  attrs: Record<string, string>,
  fn: () => Promise<T>,
): Promise<T> {
  const tracer = trace.getTracer(TRACER_NAME);
  return tracer.startActiveSpan(name, { attributes: attrs }, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      if (err instanceof Error) span.recordException(err);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : "error",
      });
      throw err;
    } finally {
      span.end();
    }
  });
}
