import { validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const RepoSearchSchema = z.object({
  items: z.array(
    z.object({
      full_name: z.string(),
      html_url: z.string(),
      description: z.string().nullable().optional(),
      stargazers_count: z.number().optional(),
    }),
  ),
});

const IssueSearchSchema = z.object({
  items: z.array(
    z.object({
      title: z.string(),
      html_url: z.string(),
      state: z.string(),
      repository_url: z.string().optional(),
    }),
  ),
});

function githubHeaders(): Record<string, string | undefined> {
  const token = process.env.GITHUB_TOKEN;
  return {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

export async function searchRepositories(
  ctx: ToolContext,
  query: string,
  limit: number,
  signal: AbortSignal,
) {
  const raw = await ctx.http.get<unknown>("/search/repositories", {
    query: { q: query, per_page: limit, sort: "stars", order: "desc" },
    headers: githubHeaders(),
    signal,
  });
  const data = validateUpstream(RepoSearchSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "search_repositories",
    metrics: ctx.metrics,
  }).data;
  return {
    query,
    repositories: data.items.map((r) => ({
      full_name: r.full_name,
      url: r.html_url,
      description: r.description ?? null,
      stars: r.stargazers_count ?? null,
    })),
  };
}

export async function searchIssues(ctx: ToolContext, query: string, limit: number, signal: AbortSignal) {
  const raw = await ctx.http.get<unknown>("/search/issues", {
    query: { q: query, per_page: limit, sort: "updated", order: "desc" },
    headers: githubHeaders(),
    signal,
  });
  const data = validateUpstream(IssueSearchSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "search_issues",
    metrics: ctx.metrics,
  }).data;
  return {
    query,
    issues: data.items.map((i) => ({
      title: i.title,
      url: i.html_url,
      state: i.state,
      repository_url: i.repository_url ?? null,
    })),
  };
}
