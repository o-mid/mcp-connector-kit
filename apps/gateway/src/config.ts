import { z } from "zod";
import { resolveSourceIds } from "./profiles.js";

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
  MCK_SOURCE_PROFILE: z.enum(["default"]).optional(),
});

export type GatewayConfig = z.infer<typeof envSchema> & {
  sourceIds: string[];
  apiKeys: string[];
  corsOrigins: string[];
};

/** Validates process env once at boot so misconfig fails fast. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const parsed = envSchema.parse(env);
  const sourceIds = resolveSourceIds(parsed.MCK_SOURCE_PROFILE, parsed.MCK_SOURCES);
  const apiKeys = parsed.MCK_API_KEYS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const corsOrigins = parsed.MCK_CORS_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  return {
    ...parsed,
    sourceIds,
    apiKeys,
    corsOrigins,
  };
}
