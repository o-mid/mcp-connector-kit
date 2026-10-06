# npm publish

Packages are versioned with [Changesets](https://github.com/changesets/changesets). The root repo stays `private`; scoped packages publish to the public npm registry.

## Publishable packages

| Package | Path |
|---------|------|
| `@mck/core` | `packages/core` |
| `@mck/server` | `packages/server` |
| `@mck/gateway` | `apps/gateway` |
| `@mck/cli` | `packages/cli` |
| `@mck/testing` | `packages/testing` |
| `@mck/source-*` | `sources/*` |

Each includes `"publishConfig": { "access": "public" }` and a `repository.directory` field for npm provenance.

## Release steps

1. `pnpm changeset` — describe bump(s) per package.
2. Merge the Version Packages PR (or `pnpm version-packages` locally).
3. Set `NPM_TOKEN` in GitHub Actions secrets ([one-time ops](./secrets-one-time-ops.md) or `pnpm ops:apply` from `.env.secrets`).
4. Push to `main` — the `release` workflow runs `pnpm release` when Changesets detects a version bump.

Dry run locally:

```bash
pnpm build
pnpm changeset publish --dry-run
```

Release workflow sets `NPM_CONFIG_PROVENANCE=true` when `NPM_TOKEN` is present.

## MCP Registry

After npm publish, update `registry/server.json` version and submit via `mcp-publisher`. Per-source metadata lives under `registry/sources/`.
