import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { searchStories } from "./api.js";

const hnSearch = defineTool({
  name: "hn_search",
  description: "Search Hacker News stories. No API key. Uses the public Algolia index.",
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
        url: z.string(),
        author: z.string().nullable(),
        points: z.number(),
        comments: z.number(),
      }),
    ),
  }),
  cacheTtlMs: 300_000,
  async run({ input, ctx, signal }) {
    return searchStories(ctx, input.query, input.limit ?? 3, signal);
  },
});

export const hnSource = defineSource({
  id: "hn",
  title: "Hacker News search (read-only, no API key)",
  baseUrls: ["https://hn.algolia.com"],
  limits: { rps: 1, burst: 2, concurrency: 2, timeoutMs: 15_000 },
  cache: { defaultTtlMs: 300_000 },
  userAgent: "mck-hn/1.0 (+https://github.com/o-mid/mcp-connector-kit; read-only)",
  tools: [hnSearch],
});
