# OAuth (P1)

MCP Streamable HTTP supports Bearer tokens. The gateway accepts:

1. **API keys** — `Authorization: Bearer <key>` when `MCK_API_KEYS` is set.
2. **OAuth JWT** — when `MCK_OAUTH_JWKS_URL` is set, JWTs are verified with [`jose`](https://github.com/panva/jose) against the remote JWKS.

## Environment

```bash
MCK_OAUTH_JWKS_URL=https://your-idp.example.com/.well-known/jwks.json
MCK_OAUTH_ISSUER=https://your-idp.example.com
MCK_OAUTH_AUDIENCE=mcp-gateway
MCK_OAUTH_TENANT_CLAIM=sub
MCK_API_KEYS=fallback-static-key   # optional parallel allowlist
MCK_AUDIT_LOG=true
```

## Tenant mapping

When a JWT verifies successfully, the claim named by `MCK_OAUTH_TENANT_CLAIM` (default `sub`) is attached to audit logs for that MCP request. Static `MCK_TENANT_ID` still applies when no JWT tenant is present.

Wire Auth0, Okta, or Google to issue JWTs with your `aud` and `iss`. Use a custom claim (e.g. `org_id`) by setting `MCK_OAUTH_TENANT_CLAIM=org_id`.

## Discovery

When OAuth is enabled, clients can read:

`GET /.well-known/oauth-protected-resource`

Response includes the MCP resource URL, `authorization_servers` (from `MCK_OAUTH_ISSUER`), and supported scopes (`mcp:tools`).
