import { validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const LatestSchema = z.object({
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
});

export async function latestRates(ctx: ToolContext, base: string, symbols: string[], signal: AbortSignal) {
  const raw = await ctx.http.get<unknown>("/v1/latest", {
    query: { base, symbols: symbols.join(",") },
    signal,
  });
  const data = validateUpstream(LatestSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "fx_latest",
    metrics: ctx.metrics,
  }).data;
  return {
    base: data.base,
    date: data.date,
    rates: symbols.map((currency) => ({
      currency,
      rate: data.rates[currency] ?? null,
    })),
  };
}
