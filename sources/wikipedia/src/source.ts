import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { wikiSearch, wikiSummary } from "./api.js";

// Each defineTool block is one MCP tool: schemas + run() that calls api.ts.
const wikiSearchTool = defineTool({
  name: "wiki_search",
  description: "Search English Wikipedia titles and short descriptions (read-only).",
  input: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  upstream: z.tuple([z.string(), z.array(z.string()), z.array(z.string()), z.array(z.string())]),
  output: z.object({
    query: z.string(),
    results: z.array(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        url: z.string().nullable(),
      }),
    ),
  }),
  cacheTtlMs: 300_000,
  async run({ input, ctx, signal }) {
    return wikiSearch(ctx, input.query, input.limit ?? 5, signal);
  },
});

const wikiSummaryTool = defineTool({
  name: "wiki_summary",
  description: "Lead section extract for one English Wikipedia page title.",
  input: z.object({ title: z.string().min(1) }),
  upstream: z.record(z.unknown()),
  output: z.object({
    title: z.string(),
    url: z.string().nullable(),
    extract: z.string().nullable(),
  }),
  cacheTtlMs: 600_000,
  async run({ input, ctx, signal }) {
    return wikiSummary(ctx, input.title, signal);
  },
});

// defineSource sets upstream policy (baseUrls, limits) shared by all tools in this package.
export const wikipediaSource = defineSource({
  id: "wikipedia",
  title: "English Wikipedia (read-only)",
  baseUrls: ["https://en.wikipedia.org"],
  limits: { rps: 2, burst: 4, concurrency: 2, timeoutMs: 15_000 },
  cache: { defaultTtlMs: 300_000 },
  userAgent: "mck-wikipedia/1.0 (+https://github.com/o-mid/mcp-connector-kit; read-only)",
  tools: [wikiSearchTool, wikiSummaryTool],
});
