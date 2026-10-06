# Railway deploy

1. Connect the GitHub repo; build uses root `Dockerfile`.
2. Set **HTTP** service port `8080` (matches `PORT` default).

## Free demo

```env
MCK_TRANSPORT=http
MCK_SOURCE_PROFILE=default
MCK_SKU=free
MCK_LEGACY_TOOL_NAMES=true
LOG_LEVEL=info
```

Exposes Wikipedia + fixture at `POST /mcp`. Verify: `GET /healthz` → `{"status":"ok","sku":"free"}`.

## Paid trust tier

```env
MCK_TRANSPORT=http
MCK_SOURCE_PROFILE=trust
MCK_SKU=paid
MCK_LEGACY_TOOL_NAMES=true
MCK_API_KEYS=<strong-secret>
MCK_AUDIT_LOG=true
MCK_TENANT_ID=<customer-id>
GITHUB_TOKEN=
BRAVE_API_KEY=
EXA_API_KEY=
TAVILY_API_KEY=
MCK_WEB_READER_ALLOWLIST=https://example.com,https://docs.github.com
```

Optional Redis for multi-instance: `MCK_CACHE=redis`, `REDIS_URL=${{Redis.REDIS_URL}}`.

## MCP client URL

Streamable HTTP endpoint: `https://<your-service>.up.railway.app/mcp`

Update [`registry/server.json`](../registry/server.json) `remotes[0].url` when the hostname changes.
