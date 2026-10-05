# Adding a source

1. `pnpm mck new source myshop` (or copy `sources/fixture`).
2. Implement `defineSource` with `baseUrls`, limits, and `defineTool` handlers.
3. Add fixtures under `sources/myshop/fixtures/` and contract tests with `@mck/testing`.
4. Register the source id in `apps/gateway/src/sources.ts`.
5. Enable with `MCK_SOURCES=myshop`.
