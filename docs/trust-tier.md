# Trust tier sources

Verified read-only connectors shipped in this repo. Each tool has a `*.contract.json` replay test (`pnpm mck check`).

| Source | Tools | Live credentials |
|--------|-------|------------------|
| `fixture` | `echo`, `health` | none |
| `wikipedia` | `wiki_search`, `wiki_summary` | none |
| `open-meteo` | `weather_forecast` | none (CC BY 4.0) |
| `frankfurter` | `fx_latest` | none |
| `openalex` | `paper_search` | none |
| `openlibrary` | `book_search` | none |
| `hn` | `hn_search` | none (Algolia HN index) |
| `usgs` | `recent_quakes` | none (public-domain feed) |
| `worldbank` | `country_profile` | none |
| `github` | `search_repositories`, `search_issues` | optional `GITHUB_TOKEN` |
| `web-reader` | `fetch_page` | `MCK_WEB_READER_ALLOWLIST` |
| `brave` | `web_search` | `BRAVE_API_KEY` |
| `exa` | `exa_search` | `EXA_API_KEY` |
| `tavily` | `tavily_search` | `TAVILY_API_KEY` |

Registry metadata: [`registry/sources/`](../registry/sources/).

Enable the full set:

```bash
MCK_SOURCE_PROFILE=trust MCK_SKU=paid MCK_LEGACY_TOOL_NAMES=true node apps/gateway/dist/cli.js
```

Free hosted tier (`MCK_SKU=free`) exposes fixture, Wikipedia, Open-Meteo, Frankfurter, OpenAlex, Open Library, Hacker News, USGS earthquakes, and World Bank country profiles. None of those need an upstream API key.
