# Errors

| code | meaning |
|------|---------|
| `invalid_input` | Tool arguments failed validation |
| `upstream_rate_limited` | HTTP 429 after retries |
| `upstream_unavailable` | 5xx, network, or breaker open |
| `upstream_timeout` | Request timed out |
| `upstream_schema_changed` | Upstream JSON failed Zod validation |
| `not_found` | HTTP 404 or missing entity |
| `blocked_host` | SSRF allowlist rejected the host |
| `internal` | Unexpected bug |

MCP tool results use `isError: true` with JSON `{ code, message, hint, retryable }` unless `MCK_LEGACY_ERRORS=true`.
