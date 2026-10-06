# MCP Registry and npm

## Verified connector badge

A source is **verified** when:

1. It lives under `sources/<id>/`
2. Every `*.contract.json` passes `pnpm mck check` in CI
3. Package name follows `@mck/source-<id>`

CI runs `pnpm check` on every push; failing contracts block merge.

## npm publish

Packages intended for publish (set `"publishConfig": { "access": "public" }` when ready):

- `@mck/core`
- `@mck/server`
- `@mck/gateway`
- `@mck/cli`
- `@mck/testing`
- `@mck/source-*`

Release flow: add a Changeset → merge version PR → set `NPM_TOKEN` in GitHub → `release` workflow runs `pnpm release`.

## MCP Registry metadata

Submit `registry/server.json` (and per-source entries as you add them) via [MCP Registry](https://github.com/modelcontextprotocol/registry) tooling (`mcp-publisher`).

Hosted demo URL (after deploy): configure `MCP_SERVER_URL` in registry entry to your Railway `/mcp` endpoint.
