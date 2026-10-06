import { defineSource, defineTool } from "@mck/core";
import { z } from "zod";
import { countryProfile } from "./api.js";

const countryProfileTool = defineTool({
  name: "country_profile",
  description: "World Bank country profile: name, capital, region, income group. No API key. ISO alpha-2 code.",
  input: z.object({
    code: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/)
      .transform((value) => value.toUpperCase()),
  }),
  upstream: z.unknown(),
  output: z.object({
    code: z.string(),
    name: z.string(),
    capital: z.string(),
    region: z.string(),
    income: z.string(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  cacheTtlMs: 86_400_000,
  async run({ input, ctx, signal }) {
    return countryProfile(ctx, input.code, signal);
  },
});

export const worldBankSource = defineSource({
  id: "worldbank",
  title: "World Bank country profiles (read-only, no API key)",
  baseUrls: ["https://api.worldbank.org"],
  limits: { rps: 1, burst: 2, concurrency: 2, timeoutMs: 15_000 },
  cache: { defaultTtlMs: 86_400_000 },
  userAgent: "mck-worldbank/1.0 (+https://github.com/o-mid/mcp-connector-kit; read-only)",
  tools: [countryProfileTool],
});
