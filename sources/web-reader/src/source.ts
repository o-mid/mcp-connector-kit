import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { fetchPageAsMarkdown, parseAllowlist } from "./api.js";

export function createWebReaderSource(allowlist?: string[]) {
  const bases = allowlist ?? parseAllowlist(process.env.MCK_WEB_READER_ALLOWLIST);
  const fetchPage = defineTool({
    name: "fetch_page",
    description:
      "Fetch an allowlisted HTTPS page and return plain text (HTML stripped). Set MCK_WEB_READER_ALLOWLIST as comma-separated origins.",
    input: z.object({
      url: z.string().url(),
      max_chars: z.number().int().min(500).max(50_000).default(8000),
    }),
    upstream: z.string(),
    output: z.object({
      url: z.string(),
      title: z.string(),
      content: z.string(),
      truncated: z.boolean(),
    }),
    cacheTtlMs: 300_000,
    async run({ input, ctx, signal }) {
      return fetchPageAsMarkdown(ctx, input.url, input.max_chars ?? 8000, signal);
    },
  });

  return defineSource({
    id: "web-reader",
    title: "Allowlisted web reader",
    baseUrls: bases,
    limits: { rps: 1, burst: 2, concurrency: 2, timeoutMs: 20_000 },
    cache: { defaultTtlMs: 300_000 },
    userAgent: "mck-web-reader/1.0 (+read-only; allowlisted fetch)",
    tools: [fetchPage],
  });
}

export const webReaderSource = createWebReaderSource();
