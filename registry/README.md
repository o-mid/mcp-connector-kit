# Registry metadata

Per-source entries describe npm packages for MCP Registry and marketplace listings. A source is **verified** when CI `mck check` passes for all fixtures listed.

| File | Package |
|------|---------|
| [sources/wikipedia.json](./sources/wikipedia.json) | `@mck/source-wikipedia` |
| [sources/github.json](./sources/github.json) | `@mck/source-github` |
| [sources/web-reader.json](./sources/web-reader.json) | `@mck/source-web-reader` |
| [sources/brave.json](./sources/brave.json) | `@mck/source-brave` |
| [sources/exa.json](./sources/exa.json) | `@mck/source-exa` |
| [sources/tavily.json](./sources/tavily.json) | `@mck/source-tavily` |
| [sources/fixture.json](./sources/fixture.json) | `@mck/source-fixture` |

Gateway bundle: [server.json](./server.json).

Publish with [MCP Registry tooling](https://github.com/modelcontextprotocol/registry) and npm via Changesets (see [docs/npm-publish.md](../docs/npm-publish.md)).
