import { validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const SearchSchema = z.object({
  docs: z.array(
    z.object({
      title: z.string(),
      author_name: z.array(z.string()).optional(),
      first_publish_year: z.number().optional(),
      key: z.string(),
    }),
  ),
});

export async function searchBooks(ctx: ToolContext, query: string, limit: number, signal: AbortSignal) {
  const raw = await ctx.http.get<unknown>("/search.json", {
    query: { q: query, limit },
    signal,
  });
  const data = validateUpstream(SearchSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "book_search",
    metrics: ctx.metrics,
  }).data;
  return {
    query,
    results: data.docs.map((doc) => ({
      title: doc.title,
      authors: (doc.author_name ?? []).slice(0, 3),
      year: doc.first_publish_year ?? null,
      url: `https://openlibrary.org${doc.key}`,
    })),
  };
}
