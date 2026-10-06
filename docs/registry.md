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

## Demo remote

The official MCP Registry entry in [`registry/server.json`](../registry/server.json) points at `POST /mcp` (API key when `MCK_API_KEYS` is set). Marketing and the “Add to Cursor” demo use `POST /demo/mcp` when `MCK_PUBLIC_DEMO=true` — same host, no bearer token, free SKU only.

The 2025-09-29 server schema used here has a single `remotes` list. A second Streamable HTTP remote for `/demo/mcp` is allowed by the schema (another `{ "type": "streamable-http", "url": "..." }` object). We are not adding it yet: registry clients would treat demo as an equally official endpoint, and demo is rate-limited public traffic. Keep the registry URL on `/mcp`. Document `/demo/mcp` on the site and in this file instead.

Smoke the hosted demo with `MCK_SMOKE_DEMO=1 node scripts/smoke-production-gateway.mjs` (requires `GET /demo/healthz` 200). Without the flag, a 404 is ignored and a 200 is recorded as `demo=on`.

