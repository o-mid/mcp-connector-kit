# Production readiness

Use this checklist before calling a deployment “production.” Status reflects the repo as of the latest gateway release.

## Runtime

| Item | Status | Notes |
|------|--------|--------|
| Streamable HTTP + stdio | Done | Official MCP SDK |
| Health / ready / metrics | Done | `/healthz` includes `sku`; `/readyz`, `/metrics` |
| Config validation at boot | Done | `loadConfig` (Zod) |
| API keys on `/mcp` | Done | `MCK_API_KEYS` |
| Hosted SKU | Done | `MCK_SKU=free\|paid` filters sources + 2× limits on paid |
| Redis shared cache | Code done | Set `MCK_CACHE=redis` + `REDIS_URL` |
| Structured logging (JSON) | Done | pino via `LOG_LEVEL` |
| Audit export | Done | `MCK_AUDIT_LOG=true`; JWT tenant overrides per request |
| OpenTelemetry traces | Done | `OTEL_EXPORTER_OTLP_ENDPOINT` in gateway |
| OAuth JWT + discovery | Done | JWKS + issuer + tenant claim → audit |

## Reliability

| Item | Status | Notes |
|------|--------|--------|
| Per-source rate limits | Done | Token bucket + concurrency |
| Retries + circuit breaker | Done | `@mck/core` HTTP |
| SSRF allowlist | Done | `baseUrls` per source |
| Schema drift metrics | Done | `mck_schema_drift_total` |
| Source health in readyz | Done | `degraded` / `failing` |
| SLO dashboards | Done | [slo.md](./slo.md), [ops/grafana/](../ops/grafana/) |

## Testing

| Item | Status | Notes |
|------|--------|--------|
| Unit tests | Done | Core, server OAuth, sources |
| Contract replay | Done | Trust tier fixtures; CI `mck check` + registry validate |
| MCP SDK e2e (server) | Done | stdio + HTTP + auth metadata |
| Gateway MCP e2e | Done | default + trust tier (paid/free SKU) |
| Live upstream smoke | Done | nightly workflow + production smoke script |

## Supply chain

| Item | Status | Notes |
|------|--------|--------|
| Dockerfile | Done | `pnpm deploy --legacy` |
| Image healthcheck | Done | `GET /healthz` |
| MCP Registry metadata | Done | `registry/server.json` + `registry/sources/*` |
| SLO / Grafana | Done | [slo.md](./slo.md), `ops/grafana/` |
| SBOM | Done | [sbom.yml](../.github/workflows/sbom.yml) |
| Container cosign | Done | [container-release.yml](../.github/workflows/container-release.yml) on `v*` tags |
| semver npm publish | Ready | v1.0.1 on main; `NPM_TOKEN` via [secrets-one-time-ops.md](./secrets-one-time-ops.md) |

## Operations

| Item | Status | Notes |
|------|--------|--------|
| Operations guide | Done | [operations.md](./operations.md) |
| Hosted SKU guide | Done | [hosted-gateway.md](./hosted-gateway.md) |
| Drift runbook | Done | [drift-runbook.md](./drift-runbook.md), [ADR-0003](./adr/0003-upstream-schema-drift.md) |
| Secret rotation | Manual | API keys via env |
| Multi-instance | Needs Redis | Memory cache is single-node |
| Railway paid env | Done | `.env.paid.example`, `scripts/railway-set-paid-env.mjs` |

## Environment reference

```bash
MCK_SOURCE_PROFILE=trust
MCK_SKU=paid
MCK_SOURCES=fixture,wikipedia
MCK_TRANSPORT=http
MCK_LEGACY_TOOL_NAMES=true
MCK_API_KEYS=...
MCK_AUDIT_LOG=true
MCK_TENANT_ID=...
MCK_OAUTH_JWKS_URL=...
MCK_OAUTH_ISSUER=...
MCK_OAUTH_AUDIENCE=...
MCK_OAUTH_TENANT_CLAIM=sub
EXA_API_KEY=...
BRAVE_API_KEY=...
GITHUB_TOKEN=...
MCK_WEB_READER_ALLOWLIST=https://example.com
MCK_CACHE=redis
REDIS_URL=redis://...
OTEL_EXPORTER_OTLP_ENDPOINT=http://...
LOG_LEVEL=info
PORT=8080
```

## Source profiles

| Profile | Sources | Use case |
|---------|---------|----------|
| `default` | fixture, wikipedia | Docs, free tier demo |
| `trust` | full trust tier (7 sources) | Paid SKU / self-host bundle |

Set `MCK_SOURCE_PROFILE=trust` with `MCK_SKU=paid` for the full connector set.
