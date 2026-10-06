# OAuth (P1)

MCP Streamable HTTP supports Bearer tokens. The gateway accepts:

1. **API keys** — `Authorization: Bearer <key>` when `MCK_API_KEYS` is set.
2. **OAuth JWT** — when `MCK_OAUTH_JWKS_URL` is set, JWTs are verified with [`jose`](https://github.com/panva/jose) against the remote JWKS.

## Environment

```bash
MCK_OAUTH_JWKS_URL=https://your-idp.example.com/.well-known/jwks.json
MCK_OAUTH_AUDIENCE=mcp-gateway
MCK_API_KEYS=fallback-static-key   # optional parallel allowlist
```

## Discovery

When OAuth is enabled, clients can read:

`GET /.well-known/oauth-protected-resource`

Response includes the MCP resource URL and supported scopes (`mcp:tools`).

## Enterprise note

Wire your IdP (Auth0, Okta, Google) to issue JWTs with the configured audience. Map `sub` to `MCK_TENANT_ID` at the edge or via future tenant middleware.
