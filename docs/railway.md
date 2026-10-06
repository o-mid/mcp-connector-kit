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

## Marketing site (`mck-web`)

Next.js UI at **`apps/web`**. Deploy as a **separate** Railway service (do not replace the gateway Dockerfile on `mck-web`):

```bash
cp railway.web.toml railway.toml   # temporarily, or set Dockerfile path in dashboard: apps/web/Dockerfile
railway up -y --service mck-web
git checkout railway.toml          # restore gateway config
```

Set `PORT=3000`. Health: `GET /`.

Images under `apps/web/public/images/` were generated with Kling (`kling-image-v3_0`); see `ATTRIBUTION.md`.

## GitHub auto-deploy

In the Railway service **Settings → Source**:

- Repository: `o-mid/mcp-connector-kit`
- Branch: `main`
- Root directory: `/` (repo root; `railway.toml` points at `Dockerfile`)

Each push to `main` should build the Docker image and roll out. After deploy, confirm the running revision:

```bash
curl -sf "$MCK_GATEWAY_BASE_URL/healthz"   # expect "sku":"free" or "paid"
curl -sf "$MCK_GATEWAY_BASE_URL/readyz"    # expect fixture + wikipedia (free), not stale source ids
node scripts/smoke-production-gateway.mjs
```

If GitHub deploys but `/readyz` still lists old source ids, the service may be on a cached or wrong revision. From a fresh `main` checkout:

```bash
railway link   # once, if needed
railway up -y
node scripts/wait-railway-deploy.mjs
node scripts/smoke-production-gateway.mjs
```

Set variables with the CLI (survives redeploys):

```bash
railway variables set MCK_TRANSPORT=http MCK_SOURCE_PROFILE=default MCK_SKU=free MCK_LEGACY_TOOL_NAMES=true
```
