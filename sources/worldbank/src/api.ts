import { ConnectorError, validateUpstream, type ToolContext } from "@mck/core";
import { z } from "zod";

const CountrySchema = z.tuple([
  z.object({ total: z.number() }),
  z.array(
    z.object({
      iso2Code: z.string(),
      name: z.string(),
      capitalCity: z.string(),
      longitude: z.string(),
      latitude: z.string(),
      region: z.object({ value: z.string() }),
      incomeLevel: z.object({ value: z.string() }),
    }),
  ),
]);

export async function countryProfile(ctx: ToolContext, code: string, signal: AbortSignal) {
  const raw = await ctx.http.get<unknown>(`/v2/country/${code}`, {
    query: { format: "json" },
    signal,
  });
  const data = validateUpstream(CountrySchema, raw, {
    sourceId: ctx.sourceId,
    tool: "country_profile",
    metrics: ctx.metrics,
  }).data;
  const country = data[1][0];
  if (!country || country.iso2Code === "") {
    throw new ConnectorError("not_found", `No World Bank country for ${code}`, { source: ctx.sourceId });
  }
  return {
    code: country.iso2Code,
    name: country.name,
    capital: country.capitalCity,
    region: country.region.value,
    income: country.incomeLevel.value,
    latitude: Number(country.latitude),
    longitude: Number(country.longitude),
  };
}
