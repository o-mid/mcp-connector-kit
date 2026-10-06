# SLOs and alerting

Targets for a **paid** hosted gateway (`MCK_SKU=paid`). Tune windows and thresholds for your traffic.

## Service level objectives

| SLI | Target (30d) | PromQL (sketch) |
|-----|----------------|-----------------|
| Availability | 99.5% | `sum(rate(mck_tool_calls_total{outcome="ok"}[5m])) / sum(rate(mck_tool_calls_total[5m]))` |
| Latency p95 | < 2s | `histogram_quantile(0.95, sum(rate(mck_tool_duration_seconds_bucket[5m])) by (le))` |
| Error rate | < 2% | `sum(rate(mck_tool_calls_total{outcome="error"}[5m])) / sum(rate(mck_tool_calls_total[5m]))` |
| Schema drift | 0 sustained | `increase(mck_schema_drift_total[1h]) == 0` |

`/healthz` must return 200 with expected `sku` for synthetic uptime checks.

## Alert rules (Prometheus)

```yaml
groups:
  - name: mck-gateway
    rules:
      - alert: MckHighErrorRate
        expr: |
          sum(rate(mck_tool_calls_total{outcome="error"}[5m]))
          / sum(rate(mck_tool_calls_total[5m])) > 0.05
        for: 10m
        labels:
          severity: page
        annotations:
          summary: MCP gateway tool error rate above 5%

      - alert: MckSchemaDrift
        expr: increase(mck_schema_drift_total[15m]) > 0
        for: 0m
        labels:
          severity: ticket
        annotations:
          summary: Upstream schema drift detected — refresh contracts

      - alert: MckLatencyP95High
        expr: |
          histogram_quantile(0.95,
            sum(rate(mck_tool_duration_seconds_bucket[5m])) by (le)
          ) > 5
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: Tool p95 latency above 5s
```

## Grafana

Import [`ops/grafana/mck-gateway-dashboard.json`](../ops/grafana/mck-gateway-dashboard.json). Prometheus rules file: [`ops/prometheus/mck-alerts.yml`](../ops/prometheus/mck-alerts.yml).

Panels cover: request rate by outcome, p95 latency by source, cache hit ratio, schema drift, and breaker state.
