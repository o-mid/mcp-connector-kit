import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { exaSearch } from "./api.js";

const searchTool = defineTool({
  name: "search",
  description: "Exa neural web search for agent grounding (requires EXA_API_KEY).",
  input: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 180_000,
  async run({ input, ctx, signal }) {
    return exaSearch(ctx, input.query, input.limit ?? 5, signal);
  },
});

export const exaSource = defineSource({
  id: "exa",
  title: "Exa search (grounding)",
  baseUrls: ["https://api.exa.ai"],
  limits: { rps: 1, burst: 2, concurrency: 2, timeoutMs: 20_000 },
  cache: { defaultTtlMs: 180_000 },
  userAgent: "mck-exa/1.0 (+read-only search)",
  tools: [searchTool],
});
