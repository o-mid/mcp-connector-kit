import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { latestRates } from "./api.js";

const code = z
  .string()
  .trim()
  .regex(/^[A-Za-z]{3}$/)
  .transform((s) => s.toUpperCase());

const fxLatest = defineTool({
  name: "fx_latest",
  description:
    "Latest daily reference exchange rates from Frankfurter (ECB and other central banks). No API key. Not for live trading.",
  input: z.object({
    base: code.default("USD"),
    symbols: z.array(code).min(1).max(8),
  }),
  upstream: z.unknown(),
  output: z.object({
    base: z.string(),
    date: z.string(),
    rates: z.array(z.object({ currency: z.string(), rate: z.number().nullable() })),
  }),
  cacheTtlMs: 3_600_000,
  async run({ input, ctx, signal }) {
    return latestRates(ctx, input.base ?? "USD", input.symbols, signal);
  },
});

export const frankfurterSource = defineSource({
  id: "frankfurter",
  title: "Frankfurter exchange rates (read-only, no API key)",
  baseUrls: ["https://api.frankfurter.dev"],
  limits: { rps: 1, burst: 2, concurrency: 2, timeoutMs: 15_000 },
  cache: { defaultTtlMs: 3_600_000 },
  userAgent: "mck-frankfurter/1.0 (+https://github.com/o-mid/mcp-connector-kit; read-only)",
  tools: [fxLatest],
});
