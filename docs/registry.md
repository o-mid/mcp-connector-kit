# MCP Registry and npm

## Verified connector badge

A source is **verified** when:

1. It lives under `sources/<id>/`
2. Every `*.contract.json` passes `pnpm mck check` in CI
3. Package name follows `@mck/source-<id>`

Per-source Registry JSON: [`registry/sources/`](../registry/sources/). See [`registry/README.md`](../registry/README.md).

## npm publish

All publishable packages include `"publishConfig": { "access": "public" }`. See [npm-publish.md](./npm-publish.md) for the Changesets workflow.

## MCP Registry metadata

- Gateway: [`registry/server.json`](../registry/server.json)
- Sources: [`registry/sources/*.json`](../registry/sources/)

Submit via [MCP Registry](https://github.com/modelcontextprotocol/registry) (`mcp-publisher`).

## Observability

- SLOs and alert rules: [slo.md](./slo.md)
- Grafana dashboard: [`ops/grafana/mck-gateway-dashboard.json`](../ops/grafana/mck-gateway-dashboard.json)
