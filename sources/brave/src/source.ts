import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { braveWebSearch } from "./api.js";

const webSearch = defineTool({
  name: "web_search",
  description: "Brave Search web results for agent grounding (requires BRAVE_API_KEY).",
  input: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    return braveWebSearch(ctx, input.query, input.limit ?? 5, signal);
  },
});

export const braveSource = defineSource({
  id: "brave",
  title: "Brave Search (grounding)",
  baseUrls: ["https://api.search.brave.com"],
  limits: { rps: 1, burst: 2, concurrency: 2, timeoutMs: 15_000 },
  cache: { defaultTtlMs: 180_000 },
  userAgent: "mck-brave/1.0 (+read-only search)",
  tools: [webSearch],
});
