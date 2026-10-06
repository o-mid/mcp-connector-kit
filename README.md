# mcp-connector-kit

**Adding a source is one file and one fixture.**

Production-grade framework for exposing third-party data sources as [Model Context Protocol](https://modelcontextprotocol.io) servers. Shared HTTP, rate limits, retries, caching, validation, and observability; thin adapters per upstream.

## Quick start

```bash
pnpm install
pnpm build
MCK_SOURCES=fixture,wikipedia node apps/gateway/dist/cli.js
```

Trust tier (paid SKU — GitHub, web reader, Brave search):

```bash
MCK_SOURCE_PROFILE=trust MCK_SKU=paid MCK_LEGACY_TOOL_NAMES=true node apps/gateway/dist/cli.js
```

Hosted HTTP (Streamable MCP at `POST /mcp`):

```bash
MCK_SOURCE_PROFILE=default MCK_TRANSPORT=http MCK_LEGACY_TOOL_NAMES=true PORT=8080 node apps/gateway/dist/cli.js
```

Health: `GET /healthz`, readiness: `GET /readyz`, metrics: `GET /metrics`.

## Packages

| Package | Role |
|---------|------|
| `@mck/core` | HTTP client, cache, errors, `defineSource` / `defineTool` |
| `@mck/server` | MCP SDK server, stdio + Streamable HTTP, OAuth metadata |
| `@mck/gateway` | Deployable multi-source server (free/paid SKU) |
| `@mck/source-*` | Trust tier connectors (Wikipedia, GitHub, …) |
| `@mck/cli` | `mck new source`, `mck check`, `mck record` |

## Environment

See [`.env.example`](.env.example). Key variables: `MCK_SOURCES`, `MCK_SOURCE_PROFILE`, `MCK_SKU`, `MCK_TRANSPORT`, `MCK_LEGACY_TOOL_NAMES`.

## Docs

- [Trust tier sources](docs/trust-tier.md)
- [Hosted gateway SKU](docs/hosted-gateway.md)
- [OAuth](docs/oauth.md)
- [MCP Registry / npm](docs/registry.md)
- [npm publish](docs/npm-publish.md)
- [Railway deploy](docs/railway.md)
- [Supply chain / SBOM](docs/supply-chain.md)
- [SLOs and Grafana](docs/slo.md)
- [Private sources](docs/private-sources.md)
- [Architecture](docs/architecture.md)
- [Codebase walkthrough (file by file)](docs/codebase-walkthrough.md)
- [Production checklist](docs/production.md)
- [Drift runbook](docs/drift-runbook.md)
- [Adding a source](docs/adding-a-source.md)

## License

MIT
