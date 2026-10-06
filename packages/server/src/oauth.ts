import type { IncomingMessage } from "node:http";

export type OAuthConfig = {
  jwksUrl?: string | undefined;
  /** Expected JWT `aud` claim when set. */
  audience?: string | undefined;
  /** Issuer URL advertised in oauth-protected-resource metadata. */
  issuer?: string | undefined;
  /** JWT claim mapped to audit `tenant` (default `sub`). */
  tenantClaim?: string | undefined;
};

export type AuthConfig = {
  apiKeys?: string[] | undefined;
  oauth?: OAuthConfig | undefined;
};

export type McpAuthResult =
  | { ok: true; method: "open" | "api_key" | "jwt"; tenantId?: string | undefined }
  | { ok: false };

/** MCP OAuth 2.0 protected resource metadata (draft). */
export function oauthProtectedResourceMetadata(baseUrl: string, oauth: OAuthConfig) {
  const authServer =
    oauth.issuer ??
    (oauth.jwksUrl ? oauth.jwksUrl.replace(/\/\.well-known\/.*$/, "") : undefined);
  return {
    resource: `${baseUrl}/mcp`,
    authorization_servers: authServer ? [authServer] : [],
    scopes_supported: ["mcp:tools"],
    bearer_methods_supported: ["header"],
  };
}

export function isOAuthEnabled(oauth?: OAuthConfig): boolean {
  return Boolean(oauth?.jwksUrl);
}

/**
 * Validates Bearer token (API key or OAuth JWT). Returns tenant id from JWT when configured.
 */
export async function authenticateMcpRequest(
  req: IncomingMessage,
  config: AuthConfig,
): Promise<McpAuthResult> {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const keysRequired = (config.apiKeys?.length ?? 0) > 0;
  const oauthRequired = Boolean(config.oauth?.jwksUrl);

  if (!token) {
    if (keysRequired || oauthRequired) return { ok: false };
    return { ok: true, method: "open" };
  }

  if (config.apiKeys?.includes(token)) {
    return { ok: true, method: "api_key" };
  }

  if (config.oauth?.jwksUrl) {
    try {
      const { jwtVerify, createRemoteJWKSet } = await import("jose");
      const jwks = createRemoteJWKSet(new URL(config.oauth.jwksUrl));
      const verifyOpts: Parameters<typeof jwtVerify>[2] = {};
      if (config.oauth.audience) verifyOpts.audience = config.oauth.audience;
      if (config.oauth.issuer) verifyOpts.issuer = config.oauth.issuer;
      const verified = await jwtVerify(token, jwks, verifyOpts);
      const claim = config.oauth.tenantClaim ?? "sub";
      const raw = verified.payload[claim];
      const tenantId = typeof raw === "string" && raw.length > 0 ? raw : undefined;
      return { ok: true, method: "jwt", tenantId };
    } catch {
      return { ok: false };
    }
  }

  if (keysRequired) return { ok: false };
  return { ok: true, method: "open" };
}

/** @deprecated Use authenticateMcpRequest */
export async function authorizeMcpRequest(req: IncomingMessage, config: AuthConfig): Promise<boolean> {
  const result = await authenticateMcpRequest(req, config);
  return result.ok;
}
