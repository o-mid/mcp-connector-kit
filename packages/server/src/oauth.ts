import type { IncomingMessage } from "node:http";

export type OAuthConfig = {
  jwksUrl?: string | undefined;
  audience?: string | undefined;
};

export type AuthConfig = {
  apiKeys?: string[] | undefined;
  oauth?: OAuthConfig | undefined;
};

/** MCP OAuth 2.0 protected resource metadata (draft). */
export function oauthProtectedResourceMetadata(baseUrl: string, oauth: OAuthConfig) {
  return {
    resource: `${baseUrl}/mcp`,
    authorization_servers: oauth.jwksUrl ? [oauth.jwksUrl.replace(/\/\.well-known\/.*$/, "")] : [],
    scopes_supported: ["mcp:tools"],
    bearer_methods_supported: ["header"],
  };
}

export function isOAuthEnabled(oauth?: OAuthConfig): boolean {
  return Boolean(oauth?.jwksUrl);
}

/**
 * Authorizes MCP HTTP requests via API key (Bearer) or OAuth JWT when JWKS is configured.
 * JWT signature verification is enforced when `jose` can load the JWKS URL.
 */
export async function authorizeMcpRequest(req: IncomingMessage, config: AuthConfig): Promise<boolean> {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return !config.apiKeys?.length;

  if (config.apiKeys?.includes(token)) return true;

  if (config.oauth?.jwksUrl) {
    try {
      const { jwtVerify, createRemoteJWKSet } = await import("jose");
      const jwks = createRemoteJWKSet(new URL(config.oauth.jwksUrl));
      const verifyOpts: Parameters<typeof jwtVerify>[2] = {};
      if (config.oauth.audience) verifyOpts.audience = config.oauth.audience;
      await jwtVerify(token, jwks, verifyOpts);
      return true;
    } catch {
      return false;
    }
  }

  return !config.apiKeys?.length;
}
