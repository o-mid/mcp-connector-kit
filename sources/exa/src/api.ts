import { ConnectorError, validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const ExaSearchSchema = z.object({
  results: z.array(
    z.object({
      title: z.string().nullable().optional(),
      url: z.string(),
      text: z.string().optional(),
    }),
  ),
});

function exaHeaders(): Record<string, string | undefined> {
  const key = process.env.EXA_API_KEY;
  if (!key) {
    throw new ConnectorError("invalid_input", "Set EXA_API_KEY for Exa search.", { source: "exa" });
  }
  return { "x-api-key": key };
}

export async function exaSearch(ctx: ToolContext, query: string, limit: number, signal: AbortSignal) {
  const raw = await ctx.http.post<unknown>(
    "/search",
    {
      query,
      numResults: limit,
      type: "auto",
      contents: { text: { maxCharacters: 500 } },
    },
    { headers: exaHeaders(), signal },
  );
  const data = validateUpstream(ExaSearchSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "exa_search",
    metrics: ctx.metrics,
  }).data;
  return {
    query,
    results: data.results.slice(0, limit).map((r) => ({
      title: r.title ?? r.url,
      url: r.url,
      snippet: r.text?.slice(0, 500) ?? null,
    })),
  };
}
