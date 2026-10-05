# Operations

## Metrics

Prometheus series at `/metrics`: `mck_tool_calls_total`, `mck_tool_duration_seconds`, `mck_cache_hits_total`, `mck_schema_drift_total`.

## Degraded source

Check `/readyz`. If a source is `degraded`, inspect logs for `upstream_schema_changed` or breaker events. Upstream format changes require a source package update and new fixtures.

## Railway

Deploy the Docker image as one service, set `MCK_TRANSPORT=http`, `PORT`, and `MCK_SOURCES`. Add Redis for shared cache if running multiple instances.
