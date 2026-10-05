import { z } from "zod";
import type { WooShop } from "@mck/source-woocommerce";

const envSchema = z.object({
  MCK_SOURCES: z.string().default("fixture"),
  MCK_TRANSPORT: z.enum(["stdio", "http"]).default("stdio"),
  MCK_LEGACY_TOOL_NAMES: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  MCK_LEGACY_ERRORS: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  MCK_CACHE: z.enum(["memory", "redis"]).default("memory"),
  REDIS_URL: z.string().optional(),
  PORT: z.coerce.number().default(8080),
  LOG_LEVEL: z.string().default("info"),
  MCK_API_KEYS: z.string().optional(),
  MCK_WOO_SHOPS: z.string().optional(),
  MCK_CORS_ORIGINS: z.string().optional(),
});

export type GatewayConfig = z.infer<typeof envSchema> & {
  sourceIds: string[];
  apiKeys: string[];
  corsOrigins: string[];
  wooShops?: WooShop[];
};

/** Validates process env once at boot so misconfig fails fast. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const parsed = envSchema.parse(env);
  const sourceIds = parsed.MCK_SOURCES.split(",").map((s) => s.trim()).filter(Boolean);
  const apiKeys = parsed.MCK_API_KEYS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const corsOrigins = parsed.MCK_CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  let wooShops: WooShop[] | undefined;
  if (parsed.MCK_WOO_SHOPS) {
    wooShops = JSON.parse(parsed.MCK_WOO_SHOPS) as WooShop[];
  }
  const config: GatewayConfig = {
    ...parsed,
    sourceIds,
    apiKeys,
    corsOrigins,
  };
  if (wooShops) config.wooShops = wooShops;
  return config;
}
