import { ConnectorError, htmlToText, validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const HtmlSchema = z.string();

export function parseAllowlist(raw: string | undefined): string[] {
  const fallback = ["https://example.com"];
  if (!raw?.trim()) return fallback;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function fetchPageAsMarkdown(
  ctx: ToolContext,
  url: string,
  maxChars: number,
  signal: AbortSignal,
) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ConnectorError("invalid_input", "Invalid URL", { source: ctx.sourceId });
  }
  const html = await ctx.http.getUrl<string>(parsed.toString(), {
    signal,
    json: false,
    headers: { accept: "text/html,application/xhtml+xml" },
  });
  validateUpstream(HtmlSchema, html, {
    sourceId: ctx.sourceId,
    tool: "fetch_page",
    metrics: ctx.metrics,
  });
  const text = htmlToText(html, maxChars);
  return {
    url: parsed.toString(),
    title: parsed.hostname,
    content: text,
    truncated: text.length >= maxChars,
  };
}
