import { validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const FeedSchema = z.object({
  features: z.array(
    z.object({
      properties: z.object({
        mag: z.number().nullable(),
        place: z.string().nullable(),
        time: z.number(),
        url: z.string(),
      }),
      geometry: z.object({
        coordinates: z.tuple([z.number(), z.number(), z.number()]),
      }),
    }),
  ),
});

export async function recentQuakes(ctx: ToolContext, limit: number, signal: AbortSignal) {
  const raw = await ctx.http.get<unknown>("/earthquakes/feed/v1.0/summary/significant_week.geojson", { signal });
  const data = validateUpstream(FeedSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "recent_quakes",
    metrics: ctx.metrics,
  }).data;
  const ranked = [...data.features].sort((a, b) => (b.properties.mag ?? 0) - (a.properties.mag ?? 0));
  return {
    window: "significant_week",
    quakes: ranked.slice(0, limit).map((feature) => {
      const [longitude, latitude] = feature.geometry.coordinates;
      return {
        magnitude: feature.properties.mag,
        place: feature.properties.place,
        time: new Date(feature.properties.time).toISOString(),
        latitude,
        longitude,
        url: feature.properties.url,
      };
    }),
  };
}
