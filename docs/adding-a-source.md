# Adding a source

1. `pnpm mck new source myapi` (scaffolds `sources/myapi` with contract test stub).
2. Implement `defineSource` with `baseUrls`, limits, and `defineTool` handlers.
3. Add `sources/myapi/fixtures/*.contract.json` and run `pnpm mck check`.
4. Register the id in `apps/gateway/src/sources.ts` and optionally add to `trust` profile in `profiles.ts`.
5. Enable with `MCK_SOURCES=myapi` or `MCK_SOURCE_PROFILE=trust` (paid SKU if trust-listed).

See [trust-tier.md](./trust-tier.md) for the verified connector checklist and [codebase-walkthrough.md](./codebase-walkthrough.md) for where each file fits.
