# Operations

## Metrics and dashboards

Prometheus series at `/metrics`:

- `mck_tool_calls_total{source,tool,outcome}`
- `mck_tool_duration_seconds_bucket`
- `mck_cache_hits_total`
- `mck_schema_drift_total`
- `mck_breaker_state`

Import [`ops/grafana/mck-gateway-dashboard.json`](../ops/grafana/mck-gateway-dashboard.json). Alert rules: [`ops/prometheus/mck-alerts.yml`](../ops/prometheus/mck-alerts.yml). SLO targets: [slo.md](./slo.md).

## Health

| Route | Purpose |
|-------|---------|
| `GET /healthz` | Liveness; includes `sku` (`free` / `paid`) |
| `GET /readyz` | Per-source health map |
| `GET /metrics` | Prometheus scrape |

## Degraded source

If `/readyz` shows `degraded`, inspect logs for `upstream_schema_changed` or breaker events. Refresh fixtures with `MCK_LIVE=1 pnpm mck record …` and ship a source update.

## Audit logs

With `MCK_AUDIT_LOG=true`, ship JSON logs (pino) to your SIEM. Filter `audit=true` for tool call export per [hosted-gateway.md](./hosted-gateway.md).

## Railway / Docker

See [railway.md](./railway.md) and [hosted-gateway.md](./hosted-gateway.md). Docker image defaults: `MCK_SKU=free`, `MCK_SOURCE_PROFILE=default`.

## Secret rotation

Rotate `MCK_API_KEYS` and upstream API keys via Railway/env reload. OAuth: rotate IdP signing keys; JWKS URL picks up new keys automatically.
