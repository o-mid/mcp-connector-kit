# Architecture

Agents talk to one process: the **gateway** (`apps/gateway`). That process loads a fixed set of **sources** (`sources/*`), each exporting MCP tools built with **defineTool** / **defineSource** from `@mck/core`. The MCP SDK lives only in `@mck/server`.

```mermaid
flowchart TB
  subgraph clients [MCP clients]
    IDE[Cursor / Claude Desktop]
    HTTP[Remote agent over HTTPS]
  end

  subgraph apps [apps/gateway]
    CLI[cli.ts]
    CFG[config.ts profiles tier]
    CAT[sources.ts catalog]
    REG[createGatewayRegistry]
  end

  subgraph server [@mck/server]
    MCP[mcp-server.ts]
    APP[http-app.ts /metrics / oauth]
  end

  subgraph core [@mck/core]
    SR[createSourceRegistry]
    HTTPc[http client limiter breaker]
    VAL[Zod validate cache]
  end

  subgraph src [sources/*]
    T[defineTool.run]
    API[api.ts upstream]
  end

  IDE -->|stdio| MCP
  HTTP -->|POST /mcp| APP --> MCP
  CLI --> CFG --> CAT --> REG --> SR
  MCP --> SR
  SR --> VAL --> T --> API --> HTTPc
  API --> Upstream[(Third-party APIs)]
```

**Tool call order inside `createSourceRegistry`:** resolve tool by name → validate input → read cache (optional) → run tool → validate output → metrics, logs, audit, health.

**Offline quality gate:** each source keeps `fixtures/*.contract.json`; `@mck/testing` replays them with undici mocks. CI runs `pnpm check` and `mck check .`.

For a full file-by-file tour, see [codebase-walkthrough.md](./codebase-walkthrough.md).
