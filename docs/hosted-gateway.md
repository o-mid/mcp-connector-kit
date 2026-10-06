# Hosted gateway SKU

Same Docker image as self-host; tier is controlled by environment.

| | **Free** | **Paid** |
|---|----------|----------|
| Env | `MCK_SKU=free` | `MCK_SKU=paid` |
| Sources | `fixture`, `wikipedia` | full trust tier |
| API keys | `MCK_API_KEYS` (recommended) | required for production |
| Audit | off | `MCK_AUDIT_LOG=true` |
| Tenant label | — | `MCK_TENANT_ID=...` (appears in audit JSON) |
| Rate limits | base per source | 2× token bucket headroom (see `tier.ts`) |

## Public demo

`MCK_PUBLIC_DEMO=true` adds `POST /demo/mcp` and `GET /demo/healthz`. That process loads only `fixture` and `wikipedia`, skips API keys, and rate-limits posts (30/minute per client IP). `/mcp` stays on the configured SKU and still requires `MCK_API_KEYS` when they are set.

The marketing site calls `/demo/mcp` for the live `wiki_search` box. With the flag off, that box calls the English Wikipedia opensearch API directly and labels the result as such.

## Audit export

When `MCK_AUDIT_LOG=true`, every tool call emits a structured log line with `"audit":true` (JSON via pino). Ship logs to your SIEM or object storage for compliance export.

## SLA framing (product)

- **Free:** best-effort, public demo, rate-limited.
- **Paid:** defined uptime target on `/healthz`, support channel, audit export, all trust sources.

Railway example:

```bash
MCK_TRANSPORT=http
MCK_SOURCE_PROFILE=trust
MCK_SKU=paid
MCK_API_KEYS=...
MCK_AUDIT_LOG=true
MCK_TENANT_ID=customer-123
BRAVE_API_KEY=...
GITHUB_TOKEN=...
MCK_WEB_READER_ALLOWLIST=https://example.com,https://docs.github.com
```
