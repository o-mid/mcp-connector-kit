# One-time secrets and release ops

Do this once per environment. Values live in **`.env.secrets`** (gitignored), not in the repo.

## 1. Create `.env.secrets`

```bash
cp .env.secrets.example .env.secrets
```

Fill in:

| Variable | Where it goes |
|----------|----------------|
| `NPM_TOKEN` | GitHub → **Settings → Secrets → Actions** (`NPM_TOKEN`) |
| `GITHUB_TOKEN` | Railway service variable (repo read or fine-grained PAT) |
| `BRAVE_API_KEY` | Railway |
| `EXA_API_KEY` | Railway |
| `TAVILY_API_KEY` | Railway |
| `MCK_API_KEYS` | Optional; script generates one if empty (MCP client Bearer) |

Create an npm token: [npmjs.com](https://www.npmjs.com/) → Access Tokens → **Automation** (publish `@mck/*`).

## 2. Apply everything

```bash
pnpm ops:apply
```

This runs `gh secret set NPM_TOKEN`, sets Railway to **paid trust** profile (`MCK_SOURCE_PROFILE=trust`, `MCK_SKU=paid`), and pushes API keys + allowlist.

## 3. npm publish

After `NPM_TOKEN` is on GitHub, push to `main`. The [release workflow](../.github/workflows/release.yml) opens or merges version bumps and runs `changeset publish` with provenance.

Local dry run:

```bash
pnpm build && pnpm changeset publish --dry-run
```

## 4. Container image + cosign

When packages are at **1.0.1** on `main`:

```bash
git tag v1.0.1
git push origin v1.0.1
```

Triggers [container-release.yml](../.github/workflows/container-release.yml) → `ghcr.io/o-mid/mcp-connector-kit` + cosign signature.

## 5. Verify

```bash
pnpm smoke:production
curl -sf https://mcp-connector-kit-production.up.railway.app/healthz   # expect sku=paid
curl -sf https://mcp-connector-kit-production.up.railway.app/readyz
```

MCP URL: `https://mcp-connector-kit-production.up.railway.app/mcp` with `Authorization: Bearer <MCK_API_KEYS>`.

See also [.env.paid.example](../.env.paid.example) and [railway.md](./railway.md).
