# Adding a source

1. `pnpm mck new source myapi` (scaffolds `sources/myapi` with a contract test stub).
2. Implement `defineSource` with `baseUrls`, limits, and `defineTool` handlers.
3. Add `sources/myapi/fixtures/*.contract.json` and run `pnpm mck check`.
4. Register the runtime id in `apps/gateway/src/sources.ts` and add `@mck/source-myapi` to `apps/gateway/package.json`.
5. Add the source to `packages/catalog/src/data.json` (`tier: "free"` or `"paid"`, tools, hosts, optional `demo` preset). Free vs paid SKU filtering is derived from that file (`apps/gateway/src/tier.ts` re-exports the ids). Do not edit a third copy in `tier.ts`.
6. Add `registry/sources/myapi.json` with the same `id`, `package`, `title`, `tier`, and `hosts`.
7. Run `pnpm catalog:generate` then `pnpm validate:registry`.
8. Enable with `MCK_SOURCES=myapi` or a profile (`MCK_SOURCE_PROFILE=default` for the free list, `trust` for paid). Named toolkits: `research`, `geo`, `daily`.

See [trust-tier.md](./trust-tier.md) for the verified connector checklist and [codebase-walkthrough.md](./codebase-walkthrough.md) for where each file fits.
