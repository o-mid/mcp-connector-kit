# ADR-0003: Upstream schema drift

## Status

Accepted

## Context

Each tool validates upstream JSON with a Zod schema before mapping to MCP output. When an API changes shape, validation fails with `upstream_schema_changed`, increments `mck_schema_drift_total`, and marks the source `degraded` in `/readyz`.

## Decision

Treat drift as a **contract failure**, not a silent parse:

1. Fail the tool call with a structured error.
2. Record metrics and health state.
3. Fix forward by updating the source schema and refreshing fixtures (`mck record` + mocks).

## Runbook

See [drift-runbook.md](../drift-runbook.md).
