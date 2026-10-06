import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { searchWorks } from "./api.js";

const paperSearch = defineTool({
  name: "paper_search",
  description: "Search OpenAlex works (papers and related records). No API key. Returns title, year, citations, and links.",
  input: z.object({
    query: z.string().min(1).max(200),
    limit: z.number().int().min(1).max(5).default(3),
  }),
  upstream: z.unknown(),
  output: z.object({
    query: z.string(),
    results: z.array(
      z.object({
        title: z.string(),
        year: z.number().nullable(),
        citedBy: z.number(),
        url: z.string(),
        doi: z.string().nullable(),
        openAccessUrl: z.string().nullable(),
        authors: z.array(z.string()),
      }),
    ),
  }),
  cacheTtlMs: 600_000,
  async run({ input, ctx, signal }) {
    return searchWorks(ctx, input.query, input.limit ?? 3, signal);
  },
});

export const openAlexSource = defineSource({
  id: "openalex",
  title: "OpenAlex works search (read-only, no API key)",
  baseUrls: ["https://api.openalex.org"],
  limits: { rps: 1, burst: 2, concurrency: 2, timeoutMs: 15_000 },
  cache: { defaultTtlMs: 600_000 },
  userAgent: "mck-openalex/1.0 (+https://github.com/o-mid/mcp-connector-kit; read-only)",
  tools: [paperSearch],
});
