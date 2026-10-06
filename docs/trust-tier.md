# Trust tier sources

Verified read-only connectors shipped in this repo. Each tool has a `*.contract.json` replay test (`pnpm mck check`). The id list lives in [`packages/catalog/src/data.json`](../packages/catalog/src/data.json); gateway SKU filtering, registry validation, and the marketing site all read that file.

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
MCK_SOURCE_PROFILE=trust MCK_SKU=paid node apps/gateway/dist/cli.js
```

Free hosted tier (`MCK_SKU=free`) exposes the nine keyless sources above. None of those need an upstream API key.

## Tool names: canonical vs legacy

`createSourceRegistry` always registers `sourceId.toolName` (for example `wikipedia.wiki_search`). When `MCK_LEGACY_TOOL_NAMES=true`, it also registers the bare name (`wiki_search`) if that name is not already taken.

| Canonical | Legacy (when `MCK_LEGACY_TOOL_NAMES=true`) |
|-----------|--------------------------------------------|
| `fixture.echo` | `echo` |
| `wikipedia.wiki_search` | `wiki_search` |
| `wikipedia.wiki_summary` | `wiki_summary` |
| `open-meteo.weather_forecast` | `weather_forecast` |
| `frankfurter.fx_latest` | `fx_latest` |
| `openalex.paper_search` | `paper_search` |
| `openlibrary.book_search` | `book_search` |
| `hn.hn_search` | `hn_search` |
| `usgs.recent_quakes` | `recent_quakes` |
| `worldbank.country_profile` | `country_profile` |
| `github.search_repositories` | `search_repositories` |
| `github.search_issues` | `search_issues` |
| `web-reader.fetch_page` | `fetch_page` |
| `brave.web_search` | `web_search` |
| `exa.exa_search` | `exa_search` |
| `tavily.tavily_search` | `tavily_search` |

New self-host installs should leave `MCK_LEGACY_TOOL_NAMES` unset or `false` (see `.env.example`) and call canonical names. The Docker image and hosted Railway demo keep `MCK_LEGACY_TOOL_NAMES=true` so existing Cursor configs that call `wiki_search` keep working. To migrate a client: switch tools to `source.tool` and set `MCK_LEGACY_TOOL_NAMES=false`.

The public `/demo/mcp` path and the marketing live demo still send legacy names because hosted production currently has legacy names on.
