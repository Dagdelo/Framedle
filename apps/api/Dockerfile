# syntax=docker/dockerfile:1
# Production build for Hono API on Node.js

# Stage 1: Install dependencies
FROM node:22-slim AS deps
RUN corepack enable pnpm
WORKDIR /repo

# Copy workspace manifests for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/game-engine/package.json ./packages/game-engine/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod

# Stage 2: Build
FROM node:22-slim AS builder
RUN corepack enable pnpm
WORKDIR /repo

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/game-engine/package.json ./packages/game-engine/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @framedle/shared build
RUN pnpm --filter @framedle/game-engine build
RUN pnpm --filter @framedle/api build

# Stage 3: Production runner
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 honojs

COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=deps /repo/node_modules ./node_modules

USER honojs

EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/index.js"]
