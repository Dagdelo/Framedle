# syntax=docker/dockerfile:1
# Multi-stage build for Nuxt 3 / Nitro standalone output

# Stage 1: Install dependencies
FROM node:22-alpine AS deps
RUN corepack enable pnpm
WORKDIR /repo

# Copy workspace manifests for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/game-engine/package.json ./packages/game-engine/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:22-alpine AS builder
RUN corepack enable pnpm
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/web/node_modules ./apps/web/node_modules
COPY . .

RUN pnpm --filter @framedle/shared build
RUN pnpm --filter @framedle/game-engine build
RUN pnpm --filter @framedle/ui build
RUN pnpm --filter @framedle/api-client build
RUN pnpm --filter @framedle/web build

# Stage 3: Production runner (Nitro standalone)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nuxtjs

COPY --from=builder --chown=nuxtjs:nodejs /repo/apps/web/.output ./

USER nuxtjs

EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "server/index.mjs"]
