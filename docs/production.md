# Production readiness

Use this checklist before calling a deployment “production.” Status reflects the repo as of the latest gateway release.

## Runtime

| Item | Status | Notes |
|------|--------|--------|
| Streamable HTTP + stdio | Done | Official MCP SDK |
| Health / ready / metrics | Done | `/healthz`, `/readyz`, `/metrics` |
| Config validation at boot | Done | `loadConfig` (Zod) |
| API keys on `/mcp` | Done | `MCK_API_KEYS` |
| Redis shared cache | Code done | Set `MCK_CACHE=redis` + `REDIS_URL` |
| Structured logging (JSON) | Done | pino via `LOG_LEVEL` |
| OpenTelemetry traces | Optional | Set `OTEL_EXPORTER_OTLP_ENDPOINT` |
| OAuth 2.1 MCP auth | Planned | Use API keys + edge proxy until shipped |

## Reliability

| Item | Status | Notes |
|------|--------|--------|
| Per-source rate limits | Done | Token bucket + concurrency |
| Retries + circuit breaker | Done | `@mck/core` HTTP |
| SSRF allowlist | Done | `baseUrls` per source |
| Schema drift metrics | Done | `mck_schema_drift_total` |
| Source health in readyz | Done | `degraded` / `failing` |
| SLO dashboards | Planned | Grafana templates |

## Testing

| Item | Status | Notes |
|------|--------|--------|
| Unit tests | Partial | Core + sources |
| Contract replay | Partial | fixture + Wikipedia; add per new source |
| MCP SDK e2e (server) | Done | stdio + HTTP (`prepareMcpHttpE2eNetwork`) |
| Gateway MCP e2e | Done | stdio (`mck-gateway` CLI) + HTTP (mocked Wikipedia) |
| Live upstream smoke | Optional | `MCK_LIVE=1`, nightly workflow |

## Supply chain

| Item | Status | Notes |
|------|--------|--------|
| Dockerfile | Done | `pnpm deploy --legacy` |
| Image healthcheck | Done | `GET /healthz` |
| SBOM / cosign | Planned | GitHub Actions |
| semver npm publish | Planned | Changesets scaffold exists |

## Operations

| Item | Status | Notes |
|------|--------|--------|
| Operations guide | Done | [operations.md](./operations.md) |
| Drift runbook | Partial | See ADR-0003 |
| Secret rotation | Manual | API keys via env |
| Multi-instance | Needs Redis | Memory cache is single-node |

## Environment reference

```bash
MCK_SOURCES=fixture,wikipedia          # or MCK_SOURCE_PROFILE=default
MCK_TRANSPORT=http
MCK_LEGACY_TOOL_NAMES=true
MCK_API_KEYS=...
MCK_CACHE=redis
REDIS_URL=redis://...
LOG_LEVEL=info
OTEL_EXPORTER_OTLP_ENDPOINT=https://...
OTEL_SERVICE_NAME=mck-gateway
PORT=8080
```

## Source profiles

| Profile | Sources | Use case |
|---------|---------|----------|
| `default` | fixture, wikipedia | Docs, CI, hosted demo |

Set `MCK_SOURCE_PROFILE=default` or list sources explicitly in `MCK_SOURCES`.
