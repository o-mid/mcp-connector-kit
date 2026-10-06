import { ConnectorError, validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const TavilySearchSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      content: z.string().optional(),
    }),
  ),
});

function tavilyApiKey(): string {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    throw new ConnectorError("invalid_input", "Set TAVILY_API_KEY for Tavily search.", {
      source: "tavily",
    });
  }
  return key;
}

export async function tavilySearch(ctx: ToolContext, query: string, limit: number, signal: AbortSignal) {
  const raw = await ctx.http.post<unknown>(
    "/search",
    {
      api_key: tavilyApiKey(),
      query,
      max_results: limit,
      include_answer: false,
    },
    { signal },
  );
  const data = validateUpstream(TavilySearchSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "tavily_search",
    metrics: ctx.metrics,
  }).data;
  return {
    query,
    results: data.results.slice(0, limit).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 500) ?? null,
    })),
  };
}
