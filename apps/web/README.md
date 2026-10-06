# @mck/web

Next.js marketing site for the repo: hero, animated architecture diagram, trust-tier overview.

Visual style follows dark developer-SaaS patterns (Vercel / Mintlify / shadcn-style tokens). Hero and architecture art generated with **Kling** (`kling-image-v3_0`), stored under `public/images/`.

## Dev

```bash
pnpm install
pnpm web:dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Railway)

From repo root, link a **second** Railway service (keep `mcp-connector-kit` as the MCP gateway):

```bash
railway link
railway up -y --path-as-root apps/web
```

Or set the service Dockerfile to `apps/web/Dockerfile` in the dashboard. Health check: `GET /`.
