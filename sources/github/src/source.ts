import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { searchIssues, searchRepositories } from "./api.js";

const searchRepos = defineTool({
  name: "search_repositories",
  description: "Search public GitHub repositories (read-only). Optional GITHUB_TOKEN for higher rate limits.",
  input: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(20).default(5),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 120_000,
  async run({ input, ctx, signal }) {
    return searchRepositories(ctx, input.query, input.limit ?? 5, signal);
  },
});

const searchIssuesTool = defineTool({
  name: "search_issues",
  description: "Search GitHub issues and pull requests (read-only).",
  input: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(20).default(5),
  }),
  upstream: z.record(z.unknown()),
  output: z.record(z.unknown()),
  cacheTtlMs: 120_000,
  async run({ input, ctx, signal }) {
    return searchIssues(ctx, input.query, input.limit ?? 5, signal);
  },
});

export const githubSource = defineSource({
  id: "github",
  title: "GitHub (read-only search)",
  baseUrls: ["https://api.github.com"],
  limits: { rps: 1, burst: 3, concurrency: 2, timeoutMs: 15_000 },
  cache: { defaultTtlMs: 120_000 },
  userAgent: "mck-github/1.0 (+https://github.com/o-mid/mcp-connector-kit; read-only)",
  tools: [searchRepos, searchIssuesTool],
});
