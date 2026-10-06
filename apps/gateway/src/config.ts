import { z } from "zod";
import { parseAllowlist } from "@mck/source-web-reader";
import { resolveSourceIds } from "./profiles.js";
import { filterSourcesForSku, parseSku, type GatewaySku } from "./tier.js";

const envSchema = z.object({
  MCK_SOURCES: z.string().default("fixture,wikipedia"),
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
  MCK_CORS_ORIGINS: z.string().optional(),
  MCK_SOURCE_PROFILE: z.enum(["default", "trust"]).optional(),
  MCK_SKU: z.enum(["free", "paid"]).default("free"),
  MCK_AUDIT_LOG: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  MCK_TENANT_ID: z.string().optional(),
  MCK_WEB_READER_ALLOWLIST: z.string().optional(),
  MCK_OAUTH_JWKS_URL: z.string().url().optional(),
  MCK_OAUTH_AUDIENCE: z.string().optional(),
});

export type GatewayConfig = z.infer<typeof envSchema> & {
  sourceIds: string[];
  apiKeys: string[];
  corsOrigins: string[];
  sku: GatewaySku;
  webReaderAllowlist: string[];
};

/** Validates process env once at boot so misconfig fails fast. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const parsed = envSchema.parse(env);
  // Profile overrides MCK_SOURCES when set; SKU then trims the list (free = fixture + wikipedia).
  const profileIds = resolveSourceIds(parsed.MCK_SOURCE_PROFILE, parsed.MCK_SOURCES);
  const sku = parseSku(parsed.MCK_SKU);
  const sourceIds = filterSourcesForSku(profileIds, sku);
  const apiKeys = parsed.MCK_API_KEYS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const corsOrigins = parsed.MCK_CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const webReaderAllowlist = parseAllowlist(parsed.MCK_WEB_READER_ALLOWLIST);
  return {
    ...parsed,
    sourceIds,
    apiKeys,
    corsOrigins,
    sku,
    webReaderAllowlist,
  };
}
