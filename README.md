# MCP Connector Kit

**Connect AI agents to real APIs through one MCP gateway—not a pile of one-off scripts.**

If you landed here without context: this repo is a **TypeScript monorepo** for building and running [Model Context Protocol](https://modelcontextprotocol.io) servers that wrap third-party HTTP APIs (Wikipedia, GitHub, search providers, and similar). You get shared rate limits, retries, caching, schema validation, metrics, and **offline contract replay** so CI catches upstream drift before production does.

<p align="center">
  <a href="https://mck-web-production.up.railway.app/">
    <img src="docs/assets/readme-hero.svg" alt="MCP Connector Kit: one gateway hub connected to Wikipedia, GitHub, search, web reader, fixture, and metrics" width="720" />
  </a>
</p>

<p align="center">
  <a href="https://mck-web-production.up.railway.app/">Marketing site</a> ·
  <a href="https://mck-web-production.up.railway.app/connect">Connect in Cursor</a> ·
  <a href="https://mck-web-production.up.railway.app/compare">Compare</a> ·
  <a href="https://mck-web-production.up.railway.app/pricing">Pricing</a> ·
  <a href="https://mck-web-production.up.railway.app/status">Status</a> ·
  <a href="https://mcp-connector-kit-production.up.railway.app/mcp">Live MCP endpoint</a> ·
  <a href="https://mcp-connector-kit-production.up.railway.app/healthz">Gateway health</a>
</p>

Social preview image: https://mck-web-production.up.railway.app/opengraph-image

---

## What problem does this solve?

MCP clients (Cursor, Claude Desktop, custom agents) need **tools**—search, fetch a page, query GitHub, and so on. Wiring each API yourself means repeating the same concerns: auth, timeouts, retries, rate limits, input/output validation, and “did the vendor change their JSON again?”

**MCP Connector Kit** centralizes that in:

1. **`@mck/core`** — HTTP client with allowlists, breaker, token bucket, cache, Zod validation, structured errors.
2. **`@mck/server`** — MCP over stdio or **Streamable HTTP** (`POST /mcp`), plus `/healthz`, `/readyz`, `/metrics`, optional OAuth metadata.
3. **`@mck/gateway`** — One process that loads many **sources** (connectors) and exposes them as MCP tools, with **free vs paid SKU** filtering.
4. **`sources/*`** — Thin adapters per upstream; each ships **`fixtures/*.contract.json`** replayed in CI via `@mck/testing`.

You add a new upstream by defining tools and recording fixtures—not by forking ad-hoc MCP servers.

## Who is this for?

| You are… | You might use… |
|----------|----------------|
| An agent builder | Point your MCP client at the hosted gateway or run `apps/gateway` locally. |
| A platform engineer | Deploy `@mck/gateway` on Railway (or your stack) with env-based source lists and API keys. |
| An open-source contributor | Add or harden a `@mck/source-*` package; `pnpm mck check` and contract fixtures gate merges. |

## How a request flows

```text
MCP client → stdio or HTTP → @mck/gateway → source registry → tool (Zod in/out) → allowlisted HTTP → upstream API
```

The same path runs in **production** and in **CI contract replay** (undici mocks + recorded fixtures)—see [Architecture](docs/architecture.md).

## Trust-tier sources (today)

| Source | Example tools | SKU |
|--------|----------------|-----|
| Fixture | `echo` (CI smoke) | free |
| Wikipedia | `wiki_search`, `wiki_summary` | free |
| GitHub | repo / issue search | paid |
| Brave / Exa / Tavily | web search variants | paid |
| Web reader | `fetch_page` (host allowlist) | paid |

Details: [Trust tier](docs/trust-tier.md) · [Hosted gateway SKU](docs/hosted-gateway.md)

---

## Quick start

**Prerequisites:** Node 20+, [pnpm](https://pnpm.io) 9+.

```bash
git clone https://github.com/o-mid/mcp-connector-kit.git
cd mcp-connector-kit
pnpm install
pnpm build
```

**Local gateway (stdio, free sources):**

```bash
MCK_SOURCES=fixture,wikipedia node apps/gateway/dist/cli.js
```

**Trust profile (paid SKU — needs upstream API keys in env):**

```bash
MCK_SOURCE_PROFILE=trust MCK_SKU=paid MCK_LEGACY_TOOL_NAMES=true node apps/gateway/dist/cli.js
```

**HTTP transport (Streamable MCP at `POST /mcp`):**

```bash
MCK_SOURCE_PROFILE=default MCK_TRANSPORT=http MCK_LEGACY_TOOL_NAMES=true PORT=8080 node apps/gateway/dist/cli.js
```

**Health checks:** `GET /healthz` · **Readiness:** `GET /readyz` · **Prometheus:** `GET /metrics`

**Public Wikipedia demo** (no API key; fixture + Wikipedia only):

```bash
MCK_PUBLIC_DEMO=true MCK_TRANSPORT=http PORT=8080 node apps/gateway/dist/cli.js
```

`POST /demo/mcp` · `GET /demo/healthz`. `/mcp` is unchanged and still requires `MCK_API_KEYS` when that variable is set.

`@mck/core`, `@mck/server`, `@mck/gateway`, and `@mck/cli` are the package names the release workflow publishes. They are not on the public npm registry yet. The clone above is the install that runs. Registry metadata for the hosted URL is [`registry/server.json`](registry/server.json); submit it with [`mcp-publisher`](https://github.com/modelcontextprotocol/registry).

### Cursor (Streamable HTTP)

Hosted gateway (bearer token required):

```json
{
  "mcpServers": {
    "mck": {
      "url": "https://mcp-connector-kit-production.up.railway.app/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_GATEWAY_KEY"
      }
    }
  }
}
```

Wikipedia demo, once `MCK_PUBLIC_DEMO=true` is set on the gateway:

```json
{
  "mcpServers": {
    "mck-wikipedia": {
      "url": "https://mcp-connector-kit-production.up.railway.app/demo/mcp"
    }
  }
}
```

One-click install and the Claude Desktop / LangChain snippets: [Connect](https://mck-web-production.up.railway.app/connect).

**Marketing site (Next.js):**

```bash
pnpm web:dev   # http://localhost:3000
```

Environment variables: see [`.env.example`](.env.example) (`MCK_SOURCES`, `MCK_SOURCE_PROFILE`, `MCK_SKU`, `MCK_TRANSPORT`, `MCK_LEGACY_TOOL_NAMES`, and upstream keys).

---

## Packages

| Package | Role |
|---------|------|
| `@mck/core` | HTTP client, cache, errors, `defineSource` / `defineTool` |
| `@mck/server` | MCP SDK server, stdio + Streamable HTTP, OAuth metadata |
| `@mck/gateway` | Deployable multi-source server (free/paid SKU) |
| `@mck/source-*` | Trust-tier connectors (Wikipedia, GitHub, …) |
| `@mck/cli` | `mck new source`, `mck check`, `mck record` |
| `@mck/testing` | Contract replay and drift helpers for CI |

---

## Documentation

| Topic | Link |
|-------|------|
| Add a connector | [Adding a source](docs/adding-a-source.md) |
| File-by-file tour | [Codebase walkthrough](docs/codebase-walkthrough.md) |
| Architecture | [architecture.md](docs/architecture.md) |
| Production deploy | [production.md](docs/production.md) · [Railway](docs/railway.md) |
| MCP Registry / npm | [registry.md](docs/registry.md) · [npm publish](docs/npm-publish.md) |
| OAuth | [oauth.md](docs/oauth.md) |
| Secrets & release ops | [secrets-one-time-ops.md](docs/secrets-one-time-ops.md) |
| Drift runbook | [drift-runbook.md](docs/drift-runbook.md) |
| Security & SBOM | [security.md](docs/security.md) · [supply-chain.md](docs/supply-chain.md) |
| SLOs / Grafana | [slo.md](docs/slo.md) |
| Private sources | [private-sources.md](docs/private-sources.md) |
| Web app | [apps/web/README.md](apps/web/README.md) |

---

## License

MIT · [o-mid/mcp-connector-kit](https://github.com/o-mid/mcp-connector-kit)
