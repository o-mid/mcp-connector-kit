import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { searchBooks } from "./api.js";

const bookSearch = defineTool({
  name: "book_search",
  description: "Search Open Library works by title or author. No API key.",
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
        authors: z.array(z.string()),
        year: z.number().nullable(),
        url: z.string(),
      }),
    ),
  }),
  cacheTtlMs: 600_000,
  async run({ input, ctx, signal }) {
    return searchBooks(ctx, input.query, input.limit ?? 3, signal);
  },
});

export const openLibrarySource = defineSource({
  id: "openlibrary",
  title: "Open Library search (read-only, no API key)",
  baseUrls: ["https://openlibrary.org"],
  limits: { rps: 1, burst: 2, concurrency: 2, timeoutMs: 15_000 },
  cache: { defaultTtlMs: 600_000 },
  userAgent: "mck-openlibrary/1.0 (+https://github.com/o-mid/mcp-connector-kit; read-only)",
  tools: [bookSearch],
});
