# Trust tier sources

Verified read-only connectors shipped in this repo. Each tool has a `*.contract.json` replay test (`pnpm mck check`).

| Source | Tools | Live credentials |
|--------|-------|------------------|
| `fixture` | `echo`, `health` | none |
| `wikipedia` | `wiki_search`, `wiki_summary` | none |
| `github` | `search_repositories`, `search_issues` | optional `GITHUB_TOKEN` |
| `web-reader` | `fetch_page` | `MCK_WEB_READER_ALLOWLIST` (comma-separated HTTPS origins) |
| `brave` | `web_search` | `BRAVE_API_KEY` |
| `exa` | `search` | `EXA_API_KEY` |

Enable the full set:

```bash
MCK_SOURCE_PROFILE=trust MCK_SKU=paid MCK_LEGACY_TOOL_NAMES=true node apps/gateway/dist/cli.js
```

Free hosted tier (`MCK_SKU=free`) exposes **fixture + Wikipedia only**, even if the profile lists more.

Tavily can follow the same pattern as `exa` (POST + API key + contract mock).
