# Competitive analysis and how MCK wins

MCK is a **framework + gateway** for read-only MCP tools backed by HTTP APIs. Competitors optimize for **discovery**, **managed auth**, or **breadth**. MCK wins on **connector engineering**: drift detection, offline contracts, shared reliability policy, and composable sources.

## Competitor matrix (what they have that MCK did not fully match)

| Capability | Smithery | Composio | Official MCP Registry | Docker MCP Catalog | mcp-production-kit | **MCK (target)** |
|------------|----------|----------|----------------------|--------------------|--------------------|------------------|
| Hosted remote MCP URL | Yes | Yes | No (metadata only) | Images only | DIY | Yes (Railway/Docker) |
| OAuth / credential vault | Yes | Yes | No | No | OAuth 2.1 RS | API keys today; OAuth roadmap |
| Tool discovery / SEO | Strong | Strong | Canonical names | Curated images | None | Registry + docs (in progress) |
| Pre-built integrations | Many listings | 500+ apps | Pointers to packages | Curated set | Template | **Plugins** (`@mck/source-*`) |
| Schema drift detection | Rare | Opaque | N/A | N/A | Tests | **`validateUpstream` + metrics** |
| Offline contract replay | Rare | No | N/A | N/A | Some | **`*.contract.json` + MockAgent** |
| Multi-source gateway | Meta-server | Session MCP | N/A | Per container | Single app | **`MCK_SOURCES` / profiles** |
| Prometheus metrics | Varies | Managed | N/A | N/A | Planned | **`/metrics` + mck_* ** |
| OpenTelemetry | Varies | Managed | N/A | N/A | Planned | **OTLP when env set** |
| Append-only audit | No | Platform | N/A | N/A | Yes | **Structured logs; audit roadmap** |
| Per-tool RBAC | Platform | Yes | N/A | N/A | Yes | **Read-only default; scopes roadmap** |

References: [Smithery](https://smithery.ai/), [Composio MCP sessions](https://docs.composio.dev/docs/sessions-via-mcp), [MCP Registry vs Smithery (2026)](https://faun.dev/toolbox/mcp-registry-vs-smithery/), [AWS MCP strategies (PDF)](https://docs.aws.amazon.com/pdfs/prescriptive-guidance/latest/mcp-strategies/mcp-strategies.pdf), [mcp-production-kit](https://github.com/Lumina-AI-studio/mcp-production-kit).

## How to win (strategy)

### 1. Own the “connector author” persona

- **Message:** “Build and ship read-only MCP sources like microservices—not one-off scripts.”
- **Proof:** `@mck/core` + contract tests + `@mck/source-wikipedia` as the reference adapter.
- **Ship:** a small catalog of high-trust global sources (see product direction below), not a long tail of unmaintained scrapers.

### 2. Beat random GitHub MCPs on trust

- Every tool: **input schema, upstream schema, output schema, contract replay**.
- CI blocks network; **`MCK_LIVE=1`** for optional live record.
- Publish **signed Docker** + **MCP Registry** metadata (npm + image + URL).

### 3. Beat Composio on depth, not count

- Composio wins **breadth + OAuth**. MCK wins **transparent normalization**, **drift alarms**, and **self-host** without per-seat tax.
- Document when to pick each: Composio for Slack/Notion OAuth; MCK for custom APIs and operators who need auditable connectors.

### 4. Beat Smithery on maintainability

- Smithery wins **instant hosted connect**. MCK wins **forkable source packages**, **versioned contracts**, and **gateway composition** for teams who outgrow a single server repo.

### 5. Distribution checklist

1. Official MCP Registry entry (`mcp-publisher`).
2. npm packages `@mck/core`, `@mck/server`, `@mck/cli`, `@mck/gateway`.
3. Hosted demo gateway (read-only, rate-limited): Wikipedia + fixture today.
4. “Adding a source in 30 minutes” doc + worked example.
5. Optional paid tier: hosted gateway + SLA + private sources.

## Priority backlog (maps to implementation)

| P | Item | Closes gap vs |
|---|------|----------------|
| P0 | OTel + structured logs + audit fields in logs | Composio / production-kit |
| P0 | `mck record` + contract matrix per shipped source | Trust / CI |
| P0 | 3–5 global reference sources | Discovery narrative |
| P1 | OAuth 2.1 resource server | Smithery / enterprise |
| P1 | npm publish + Registry | Discovery |
| P1 | Dynamic `import()` source plugins | Composio breadth model |
| P2 | Append-only audit store | production-kit |
| P2 | Tool-selection evals | Agent quality |

See [production.md](./production.md) for the operational checklist.

## Product direction (value)

**Do not compete on “another MCP that wraps one website.”** Compete on:

1. **Connector platform** — one gateway, many `@mck/source-*` packages, same reliability and test story.
2. **Trust for agents** — contracts, drift metrics, predictable JSON; agents fail safely when upstream changes.
3. **Operator control** — self-host, API keys, Redis cache, metrics; no black-box middleware.
4. **Curated source catalog** — each source is documented, contracted, and maintained; quality over quantity.

**Sources worth adding next (global, API-friendly, agent-useful):**

| Source | Why | Monetization angle |
|--------|-----|-------------------|
| **Web fetch / reader** (e.g. Jina, Firecrawl, or self-hosted) | Agents need clean page text with allowlists | Usage-based hosted fetch proxy |
| **GitHub** (issues, PRs, search) | Devs and support agents | Enterprise self-host |
| **ArXiv / Semantic Scholar** | Research workflows | Free tier + hosted |
| **OpenWeather / aviation weather** | Ops and travel agents | API key pass-through + margin |
| **Exa / Tavily / Brave search** | Grounding without building search | Partner rev share or bundled keys |
| **Official docs** (MDN, npm registry metadata) | Low drift, high trust | SEO + “trusted connectors” brand |

**Business models that fit:**

- **Open core:** framework + fixture + Wikipedia OSS; charge for hosted gateway, SSO, audit export, and premium connectors.
- **Services:** “We build and maintain your MCP source” for companies with private APIs.
- **Marketplace (later):** verified `@mck/source-*` listings with contract CI badge—take a listing fee, not per MCP call if self-hosted.

**Positioning one-liner:** *Production MCP connectors with offline contracts and a composable gateway—not a scraper zoo.*
