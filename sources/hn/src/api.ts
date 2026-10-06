import { validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const SearchSchema = z.object({
  hits: z.array(
    z.object({
      title: z.string().nullable().optional(),
      url: z.string().nullable().optional(),
      author: z.string().nullable().optional(),
      points: z.number().nullable().optional(),
      num_comments: z.number().nullable().optional(),
      objectID: z.string(),
    }),
  ),
});

export async function searchStories(ctx: ToolContext, query: string, limit: number, signal: AbortSignal) {
  const raw = await ctx.http.get<unknown>("/api/v1/search", {
    query: { query, tags: "story", hitsPerPage: limit },
    signal,
  });
  const data = validateUpstream(SearchSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "hn_search",
    metrics: ctx.metrics,
  }).data;
  return {
    query,
    results: data.hits.map((hit) => ({
      title: hit.title ?? "(untitled)",
      url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
      author: hit.author ?? null,
      points: hit.points ?? 0,
      comments: hit.num_comments ?? 0,
    })),
  };
}
