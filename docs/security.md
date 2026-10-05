# Security

- Upstream hosts must match each source `baseUrls` (SSRF guard).
- Tools are read-only; no write operations are exposed.
- Optional `MCK_API_KEYS` bearer auth on HTTP `/mcp`.
- Logs must not include secrets; redact sensitive query parameters in production configs.
