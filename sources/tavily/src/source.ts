import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { tavilySearch } from "./api.js";

const tavilySearchTool = defineTool({
  name: "tavily_search",
  description: "Tavily web search for agent grounding (requires TAVILY_API_KEY).",
  input: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    return tavilySearch(ctx, input.query, input.limit ?? 5, signal);
  },
});

export const tavilySource = defineSource({
  id: "tavily",
  title: "Tavily search (grounding)",
  baseUrls: ["https://api.tavily.com"],
  limits: { rps: 1, burst: 2, concurrency: 2, timeoutMs: 20_000 },
  cache: { defaultTtlMs: 180_000 },
  userAgent: "mck-tavily/1.0 (+read-only search)",
  tools: [tavilySearchTool],
});
