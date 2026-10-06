import { validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const WorksSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      display_name: z.string(),
      publication_year: z.number().nullable().optional(),
      cited_by_count: z.number().optional(),
      doi: z.string().nullable().optional(),
      open_access: z
        .object({
          is_oa: z.boolean().optional(),
          oa_url: z.string().nullable().optional(),
        })
        .optional(),
      authorships: z
        .array(
          z.object({
            author: z
              .object({
                display_name: z.string().nullable().optional(),
              })
              .optional(),
          }),
        )
        .optional(),
    }),
  ),
});

export async function searchWorks(ctx: ToolContext, query: string, limit: number, signal: AbortSignal) {
  const raw = await ctx.http.get<unknown>("/works", {
    query: {
      search: query,
      "per-page": limit,
      select: "id,display_name,publication_year,cited_by_count,doi,open_access,authorships",
    },
    signal,
  });
  const data = validateUpstream(WorksSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "paper_search",
    metrics: ctx.metrics,
  }).data;
  return {
    query,
    results: data.results.map((work) => ({
      title: work.display_name,
      year: work.publication_year ?? null,
      citedBy: work.cited_by_count ?? 0,
      url: work.id,
      doi: work.doi ?? null,
      openAccessUrl: work.open_access?.oa_url ?? null,
      authors: (work.authorships ?? [])
        .map((row) => row.author?.display_name)
        .filter((name): name is string => Boolean(name))
        .slice(0, 3),
    })),
  };
}
