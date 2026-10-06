import { ConnectorError, validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const GeocodeSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        country: z.string().optional(),
        timezone: z.string().optional(),
      }),
    )
    .optional(),
});

const ForecastSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_sum: z.array(z.number()),
  }),
});

const CONDITIONS: Record<number, string> = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with hail",
};

export type Forecast = {
  place: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperatureC: number;
    weatherCode: number;
    condition: string;
    windSpeedKmh: number;
  };
  daily: { date: string; tempMaxC: number; tempMinC: number; precipitationMm: number }[];
};

function condition(code: number): string {
  return CONDITIONS[code] ?? `WMO ${code}`;
}

export async function geocodePlace(ctx: ToolContext, place: string, signal: AbortSignal) {
  const raw = await ctx.http.getUrl<unknown>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`,
    { signal },
  );
  const data = validateUpstream(GeocodeSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "weather_forecast",
    metrics: ctx.metrics,
  }).data;
  const hit = data.results?.[0];
  if (!hit) {
    throw new ConnectorError("not_found", `No location named ${place}`, { source: ctx.sourceId });
  }
  return hit;
}

export async function fetchForecast(
  ctx: ToolContext,
  latitude: number,
  longitude: number,
  days: number,
  signal: AbortSignal,
) {
  const raw = await ctx.http.get<unknown>("/v1/forecast", {
    query: {
      latitude,
      longitude,
      current: "temperature_2m,weather_code,wind_speed_10m",
      daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
      timezone: "auto",
      forecast_days: days,
    },
    signal,
  });
  return validateUpstream(ForecastSchema, raw, {
    sourceId: ctx.sourceId,
    tool: "weather_forecast",
    metrics: ctx.metrics,
  }).data;
}

export function toForecast(
  data: z.infer<typeof ForecastSchema>,
  place: string | null,
): Forecast {
  return {
    place,
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    current: {
      time: data.current.time,
      temperatureC: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
      condition: condition(data.current.weather_code),
      windSpeedKmh: data.current.wind_speed_10m,
    },
    daily: data.daily.time.map((date, i) => ({
      date,
      tempMaxC: data.daily.temperature_2m_max[i] ?? data.current.temperature_2m,
      tempMinC: data.daily.temperature_2m_min[i] ?? data.current.temperature_2m,
      precipitationMm: data.daily.precipitation_sum[i] ?? 0,
    })),
  };
}
