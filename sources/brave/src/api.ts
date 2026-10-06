import { ConnectorError, validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const BraveWebSchema = z.object({
  web: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        description: z.string().optional(),
      }),
    ),
  }),
});

function braveHeaders(): Record<string, string | undefined> {
  const key = process.env.BRAVE_API_KEY;
  if (!key) {
    throw new ConnectorError("invalid_input", "Set BRAVE_API_KEY for Brave web search.", {
      source: "brave",
    });
  }
  return {
    accept: "application/json",
    "x-subscription-token": key,
  };
}

export async function braveWebSearch(ctx: ToolContext, query: string, limit: number, signal: AbortSignal) {
  const raw = await ctx.http.get<unknown>("/res/v1/web/search", {
    query: { q: query, count: limit },
    headers: braveHeaders(),
    signal,
  });
  const data = validateUpstream(BraveWebSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "web_search",
    metrics: ctx.metrics,
  }).data;
  return {
    query,
    results: data.web.results.slice(0, limit).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.description ?? null,
    })),
  };
}
