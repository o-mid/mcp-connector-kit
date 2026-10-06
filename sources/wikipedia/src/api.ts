import { validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const OpenSearchSchema = z.tuple([
  z.string(),
  z.array(z.string()),
  z.array(z.string()),
  z.array(z.string()),
]);

const QuerySchema = z.object({
  query: z.object({
    pages: z.record(
      z.string(),
      z.object({
        pageid: z.number().optional(),
        title: z.string().optional(),
        extract: z.string().optional(),
        fullurl: z.string().optional(),
      }),
    ),
  }),
});

export async function wikiSearch(ctx: ToolContext, query: string, limit: number, signal: AbortSignal) {
  const raw = await ctx.http.get<unknown>("/w/api.php", {
    query: {
      action: "opensearch",
      search: query,
      limit,
      namespace: 0,
      format: "json",
    },
    signal,
  });
  const data = validateUpstream(OpenSearchSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "wiki_search",
    metrics: ctx.metrics,
  }).data;
  const titles = data[1] ?? [];
  const descriptions = data[2] ?? [];
  const urls = data[3] ?? [];
  return {
    query: data[0] ?? query,
    results: titles.map((title, i) => ({
      title,
      description: descriptions[i] ?? null,
      url: urls[i] ?? null,
    })),
  };
}

export async function wikiSummary(ctx: ToolContext, title: string, signal: AbortSignal) {
  const raw = await ctx.http.get<unknown>("/w/api.php", {
    query: {
      action: "query",
      prop: "extracts|info",
      exintro: true,
      explaintext: true,
      inprop: "url",
      titles: title,
      format: "json",
    },
    signal,
  });
  const parsed = validateUpstream(QuerySchema, raw, {
    sourceId: ctx.sourceId,
    tool: "wiki_summary",
    metrics: ctx.metrics,
  }).data;
  const pages = parsed.query?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page?.title) throw new Error("Page not found");
  return {
    title: page.title,
    url: page.fullurl ?? null,
    extract: page.extract ?? null,
  };
}
