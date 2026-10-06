FROM node:22-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY sources ./sources
COPY apps ./apps
RUN pnpm install --frozen-lockfile
RUN pnpm build --filter @mck/gateway...
RUN pnpm deploy --filter=@mck/gateway --prod /out --legacy

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
RUN adduser --system --uid 10001 mck
COPY --from=build /out /app
USER mck
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:8080/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENV MCK_TRANSPORT=http
ENV MCK_SOURCE_PROFILE=default
ENV MCK_LEGACY_TOOL_NAMES=true
CMD ["node", "dist/cli.js"]
