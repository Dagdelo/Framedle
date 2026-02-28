# apps/api — Agent Guide

> **Note**: This document describes the intended architecture. Update as implementation proceeds.

## Purpose

The `apps/api` package is the **Hono REST API + WebSocket server** for Framedle. It handles:

- Server-authoritative game state and guess validation for all 12 modes
- User authentication and session management via Logto (JWT + HMAC tokens)
- Real-time multiplayer duel matches via WebSocket
- Leaderboard rankings and aggregation (Valkey sorted sets)
- Dynamic OG image generation for share pages
- Cache warming and invalidation via Valkey

Live at: `https://api.framedle.wtf` (port 4000 on VPS)

---

## Key Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/v1/games/:mode/daily` | GET | Fetch today's challenge for a mode (server picks frame, seed) |
| `/api/v1/games/:mode/guess` | POST | Submit guess; validate against frame; return score, streak |
| `/api/v1/games/:mode/stats` | GET | User stats for mode (attempts, best score, streak) |
| `/api/v1/leaderboards/:mode` | GET | Top 100 players + user's current rank (Valkey sorted sets) |
| `/api/v1/users/profile` | GET | User profile, total XP, achievements, session info |
| `/api/v1/users/profile` | PATCH | Update user profile (displayName, avatar) |
| `/api/v1/auth/session` | GET | Validate HMAC token, return user context |
| `/api/v1/share/:gameId` | GET | Game result metadata (for OG image generation) |
| `/ws/duel/:matchId` | WS | Real-time duel match state (guesses, timer, winner) |

---

## Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Node.js (tsx, tsc) | TypeScript-first development |
| **Framework** | Hono v4 | Lightweight REST + WS routing |
| **Server** | @hono/node-server | Native Node.js HTTP/WS binding |
| **Database** | PostgreSQL 16 + Drizzle ORM | Persistent user, game, stats storage |
| **Cache** | Valkey (Redis-compatible) | Leaderboards, session tokens, frame preload |
| **Auth** | Logto (self-hosted JWT) | SSO, anonymous → registered upgrade |

---

## Key Patterns

### Server-Authoritative Game Logic

- Client submits guess; **server validates** against stored frame metadata
- Server computes score, streak, XP gain; returns to client
- All game state stored in PostgreSQL (immutable game records)
- Prevents client-side cheating (fake scores, altered timer)

### HMAC Session Tokens

- Logto provides JWT; API wraps in HMAC-signed session token
- Token includes user ID, exp, signature (prevents tampering)
- Valkey caches token validation (sub-millisecond auth checks)

### Valkey Caching

- **Leaderboard**: sorted set per mode (key: `leaderboard:{mode}`, score: XP)
- **Session cache**: token → user context (TTL: 24h)
- **Frame preload**: pre-computed frame metadata (immutable, long TTL)
- Cache invalidation: on guess submission, profile update, season reset

---

## Development Workflow

```bash
# From repo root
pnpm dev                          # Start all apps (Turborepo watches packages/)
# Or, to run API only:
cd apps/api && pnpm dev           # Start Hono dev server on :4000

# Build (ESM distribution)
pnpm build

# Type-check
pnpm typecheck

# Lint
pnpm lint
```

The dev server runs on `http://localhost:4000`. It expects:
- PostgreSQL on `localhost:5432` (or `DATABASE_URL`)
- Valkey on `localhost:6379` (or `REDIS_URL`)
- Logto on `http://localhost:3001` (or `LOGTO_ENDPOINT`)

Start local services with `docker compose up -d` from the repo root.

---

## Package Dependencies

| Dependency | Purpose |
|-----------|---------|
| `packages/game-engine` | XState v5 state machines — game mode logic, scoring |
| `packages/shared` | Types, validators, constants, utility functions |
| `@hono/node-server` | Node.js HTTP/WS adapter for Hono |
| `hono` | Lightweight REST/RPC framework |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 4000) |
| `NODE_ENV` | No | `development` or `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Valkey connection string |
| `LOGTO_ENDPOINT` | Yes | Logto auth server URL |
| `LOGTO_APP_ID` | Yes | Logto application ID |
| `LOGTO_APP_SECRET` | Yes | Logto application secret |
| `HMAC_SECRET` | Yes | Secret key for session token signing |
| `CF_R2_BUCKET` | No | Cloudflare R2 bucket name (for OG images) |
| `CF_R2_ENDPOINT` | No | R2 API endpoint |

Secrets managed in Coolify's encrypted env var UI in production. Locally, copy `.env.template` to `.env`.

---

## Docker Deployment

`apps/api/Dockerfile` uses a **multi-stage build**:

1. **deps** stage — installs `node_modules` with `pnpm install --frozen-lockfile`
2. **builder** stage — runs `tsc` (compiles TypeScript → `dist/`)
3. **runtime** stage — minimal `node:22-alpine`, copies `dist/` and `node_modules`

Runtime image runs `node dist/index.js` on port 4000. Deployed via Coolify connected to GitHub; every push to `main` triggers a rebuild.

Coolify settings:
- **Dockerfile path** → `apps/api/Dockerfile`
- **Domain** → `api.framedle.wtf`
- **Reverse proxy** → Traefik (auto-managed by Coolify)
- **Restart policy** → always

---

## Key Files

| Path | Purpose |
|------|---------|
| `src/index.ts` | Hono app definition, server bootstrap |
| `src/routes/` | Endpoint handlers (games, leaderboards, auth, share, duel) |
| `src/services/` | Business logic (game validation, scoring, cache ops) |
| `src/db/` | Drizzle schema, migrations, queries |
| `src/middleware/` | Auth, logging, error handling, rate limiting |
| `src/types.ts` | API request/response shapes |
| `tsconfig.json` | TypeScript strict mode, ESM config |

---

## Deployment Checklist

- [ ] PostgreSQL migrations applied (`pnpm db:migrate`)
- [ ] Valkey instance healthy (`redis-cli PING`)
- [ ] Logto user pool and app created; secrets in `.env`
- [ ] HMAC_SECRET generated (32-byte random string)
- [ ] Docker image built and pushed to Coolify
- [ ] Domain DNS points to Coolify reverse proxy
- [ ] Health check passing (`GET /health` → 200)
- [ ] Leaderboards pre-warmed in Valkey cache
