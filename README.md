# mcp-connector-kit

**Adding a source is one file and one fixture.**

Production-grade framework for exposing third-party data sources as [Model Context Protocol](https://modelcontextprotocol.io) servers. Shared HTTP, rate limits, retries, caching, validation, and observability; thin adapters per upstream.

## Quick start

```bash
pnpm install
pnpm build
MCK_SOURCES=fixture node apps/gateway/dist/cli.js
```

Hosted HTTP (Streamable MCP at `POST /mcp`):

```bash
MCK_SOURCE_PROFILE=global-demo MCK_TRANSPORT=http MCK_LEGACY_TOOL_NAMES=true PORT=8080 node apps/gateway/dist/cli.js
```

Iran commerce pack: `MCK_SOURCE_PROFILE=commerce-ir`. Legacy cosmetic composite: `MCK_SOURCE_PROFILE=cosmetic`.

Health: `GET /healthz`, readiness: `GET /readyz`, metrics: `GET /metrics`.

## Packages

| Package | Role |
|---------|------|
| `@mck/core` | HTTP client, cache, errors, `defineSource` / `defineTool` |
| `@mck/server` | MCP SDK server, stdio + Streamable HTTP |
| `@mck/gateway` | Deployable multi-source server |
| `@mck/source-*` | Torob, Khanoumi, WooCommerce, Wikipedia, fixture |

## Environment

See [`.env.example`](.env.example). Key variables: `MCK_SOURCES`, `MCK_SOURCE_PROFILE`, `MCK_TRANSPORT`, `MCK_LEGACY_TOOL_NAMES`, `MCK_WOO_SHOPS`.

## Docs

- [Architecture](docs/architecture.md)
- [Production checklist](docs/production.md)
- [Competitive analysis](docs/competitive-analysis.md)
- [Adding a source](docs/adding-a-source.md)
- [Errors](docs/errors.md)
- [Operations](docs/operations.md)
- [Security](docs/security.md)

## License

MIT
