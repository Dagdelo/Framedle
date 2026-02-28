# syntax=docker/dockerfile:1
# Multi-stage build for Next.js 15 standalone output

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

# Stage 3: Production runner (standalone)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /repo/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
