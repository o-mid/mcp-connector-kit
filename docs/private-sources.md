# Private sources (generator service)

Use the CLI to scaffold a new connector in minutes, then record live responses for offline CI.

```bash
pnpm build
pnpm mck new source acme
# implement sources/acme/src/source.ts
MCK_LIVE=1 pnpm mck record acme my_tool --input '{"id":"1"}'
pnpm mck check
```

Register `acme` in `apps/gateway/src/sources.ts` and add to a profile.

**Service offering:** “We wire your internal REST API to MCP in one week” — deliverable is a `@mck/source-*` package with contracts, gateway config, and a hosted `MCK_TENANT_ID` on paid SKU.

See [adding-a-source.md](./adding-a-source.md) and [trust-tier.md](./trust-tier.md).
