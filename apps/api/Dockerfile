# syntax=docker/dockerfile:1
# Production build for Hono API on Node.js

# Stage 1: Build all workspace packages
FROM node:22-slim AS builder
RUN corepack enable pnpm
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/game-engine/package.json ./packages/game-engine/
COPY packages/shared/package.json ./packages/shared/

# Coolify injects NODE_ENV=production as a build ARG which causes pnpm to
# skip devDependencies. Override to ensure build tools (tsup, tsc) install.
RUN NODE_ENV=development pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @framedle/shared build
RUN pnpm --filter @framedle/game-engine build
RUN pnpm --filter @framedle/api build

# pnpm deploy creates a self-contained directory with all deps resolved
RUN pnpm --filter @framedle/api deploy --prod /deploy

# Stage 2: Production runner
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 honojs

COPY --from=builder /deploy ./
COPY --from=builder /repo/apps/api/dist ./dist

USER honojs

EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/index.js"]
