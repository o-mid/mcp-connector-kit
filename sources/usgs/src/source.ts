import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { recentQuakes } from "./api.js";

const recentQuakesTool = defineTool({
  name: "recent_quakes",
  description: "Significant earthquakes from the past week (USGS). No API key. Public-domain feed.",
  input: z.object({
    limit: z.number().int().min(1).max(5).default(3),
  }),
  upstream: z.unknown(),
  output: z.object({
    window: z.literal("significant_week"),
    quakes: z.array(
      z.object({
        magnitude: z.number().nullable(),
        place: z.string().nullable(),
        time: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        url: z.string(),
      }),
    ),
  }),
  cacheTtlMs: 300_000,
  async run({ input, ctx, signal }) {
    return recentQuakes(ctx, input.limit ?? 3, signal);
  },
});

export const usgsSource = defineSource({
  id: "usgs",
  title: "USGS earthquakes (read-only, no API key)",
  baseUrls: ["https://earthquake.usgs.gov"],
  limits: { rps: 1, burst: 2, concurrency: 2, timeoutMs: 15_000 },
  cache: { defaultTtlMs: 300_000 },
  userAgent: "mck-usgs/1.0 (+https://github.com/o-mid/mcp-connector-kit; read-only)",
  tools: [recentQuakesTool],
});
