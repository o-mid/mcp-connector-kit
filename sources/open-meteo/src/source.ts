import { ConnectorError, defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { fetchForecast, geocodePlace, toForecast } from "./api.js";

const weatherForecast = defineTool({
  name: "weather_forecast",
  description:
    "Current conditions and a short daily forecast from Open-Meteo (no API key, CC BY 4.0). Pass a place name or latitude and longitude.",
  input: z.object({
    place: z.string().min(1).max(80).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    days: z.number().int().min(1).max(3).default(1),
  }),
  upstream: z.unknown(),
  output: z.object({
    place: z.string().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    timezone: z.string(),
    current: z.object({
      time: z.string(),
      temperatureC: z.number(),
      weatherCode: z.number(),
      condition: z.string(),
      windSpeedKmh: z.number(),
    }),
    daily: z.array(
      z.object({
        date: z.string(),
        tempMaxC: z.number(),
        tempMinC: z.number(),
        precipitationMm: z.number(),
      }),
    ),
  }),
  cacheTtlMs: 600_000,
  async run({ input, ctx, signal }) {
    const hasCoords = input.latitude !== undefined && input.longitude !== undefined;
    if (!hasCoords && !input.place) {
      throw new ConnectorError("invalid_input", "Provide place or latitude and longitude", {
        source: ctx.sourceId,
      });
    }
    let latitude = input.latitude;
    let longitude = input.longitude;
    let place: string | null = null;
    if (!hasCoords && input.place) {
      const hit = await geocodePlace(ctx, input.place, signal);
      latitude = hit.latitude;
      longitude = hit.longitude;
      place = hit.country ? `${hit.name}, ${hit.country}` : hit.name;
    }
    if (latitude === undefined || longitude === undefined) {
      throw new ConnectorError("invalid_input", "Provide place or latitude and longitude", {
        source: ctx.sourceId,
      });
    }
    const forecast = await fetchForecast(ctx, latitude, longitude, input.days ?? 1, signal);
    return toForecast(forecast, place);
  },
});

export const openMeteoSource = defineSource({
  id: "open-meteo",
  title: "Open-Meteo forecast (read-only, no API key)",
  baseUrls: ["https://api.open-meteo.com", "https://geocoding-api.open-meteo.com"],
  limits: { rps: 1, burst: 2, concurrency: 2, timeoutMs: 15_000 },
  cache: { defaultTtlMs: 600_000 },
  userAgent: "mck-open-meteo/1.0 (+https://github.com/o-mid/mcp-connector-kit; CC-BY-4.0)",
  tools: [weatherForecast],
});
