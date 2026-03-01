# apps/web — Agent Guide

> **Note**: This document describes the intended architecture. Update as implementation proceeds.

## Purpose

The `apps/web` package is the **Nuxt 3 SSR web frontend** for Framedle. It handles:

- Server-side rendering for SEO (game hub, leaderboards, share pages)
- Daily game UI for all 12 modes
- Social sharing pages with dynamic Open Graph images
- Anonymous and authenticated user sessions via Logto

Live at: `https://framedle.wtf`

---

## Key Routes / Pages

```
pages/
├── index.vue                      # Home / game hub — lists all modes + today's status
├── compare.vue                    # Design variant comparison page
├── [mode]/
│   ├── index.vue                  # Game page — renders correct game board for mode
│   └── result.vue                 # Result screen (after completion)
├── leaderboard/
│   └── [mode].vue                 # Leaderboard — SSR top 100 + client rank highlight
├── share/
│   └── [gameId].vue               # Share page — SSR for OG metadata, result display
└── profile.vue                    # User profile, stats, achievement grid

layouts/
└── default.vue                    # Root layout: fonts, auth provider, analytics

server/
└── api/
    ├── health.get.ts              # Health check endpoint (GET /api/health)
    └── og/[gameId].get.ts         # OG image generation (planned)
```

Pages use **Vue 3 `<script setup>`** with Nuxt auto-imports. Server routes use **Nitro event handlers** (`defineEventHandler`).

---

## Package Dependencies

| Dependency | Purpose |
|-----------|---------|
| `packages/ui` | Shared Vue 3 design system — GameBoard, Button, Modal, etc. |
| `packages/game-engine` | XState v5 state machines — game logic for all modes |
| `packages/api-client` | Typed HTTP client — all requests to `api.framedle.wtf` |
| `packages/shared` | Constants, validators, utility functions |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NUXT_PUBLIC_API_URL` | Yes | Hono API base URL (e.g. `https://api.framedle.wtf`) |
| `NUXT_PUBLIC_LOGTO_ENDPOINT` | Yes | Logto auth server URL |
| `NUXT_PUBLIC_LOGTO_APP_ID` | Yes | Logto application ID |
| `NUXT_PUBLIC_SENTRY_DSN` | No | GlitchTip DSN for error tracking |
| `NUXT_PUBLIC_UMAMI_URL` | No | Umami analytics script URL |
| `NUXT_PUBLIC_UMAMI_WEBSITE_ID` | No | Umami website ID |

Nuxt 3 exposes `NUXT_PUBLIC_*` variables to the client via `useRuntimeConfig().public`. Server-only variables use `NUXT_*` (without `PUBLIC`).

Secrets are managed in Coolify's encrypted env var UI in production. Locally, copy `.env.template` to `.env`.

---

## Development Workflow

```bash
# From repo root
pnpm dev                          # Start all apps (Turborepo watches packages/)
# Or, to run web only:
pnpm --filter @framedle/web dev   # Start Nuxt dev server on :3000

# Build (Nitro standalone output for Docker)
pnpm --filter @framedle/web build

# Type-check
pnpm --filter @framedle/web typecheck

# Preview production build locally
pnpm --filter @framedle/web preview
```

The dev server runs on `http://localhost:3000`. It expects the Hono API running on `:4000` (set `NUXT_PUBLIC_API_URL=http://localhost:4000`). Start local services with `docker compose up -d` from the repo root.

---

## Dockerfile

`apps/web/Dockerfile` uses a **multi-stage build**:

1. **deps** stage — installs `node_modules` with `pnpm install --frozen-lockfile`
2. **builder** stage — runs `nuxt build` which produces a self-contained `.output/` directory via Nitro
3. **runner** stage — minimal `node:22-alpine` image, copies `.output/` only (contains `server/index.mjs` — no `node_modules` needed at runtime)

The Nitro standalone output keeps the runtime image small (~80–120 MB). Deployed via Coolify connected to the GitHub repo; every push to `main` triggers a rebuild.

Coolify setting: **Dockerfile path** → `apps/web/Dockerfile`, **Domain** → `framedle.wtf`.

---

## Design Variants

The app supports 5 visual design variants, switchable via `?variant=N` URL parameter:

| Variant | Name | Visual Identity |
|---------|------|----------------|
| 1 | Neon Cinema | Dark, neon accents, arcade feel |
| 2 | Paper Cut | Warm, handcrafted, analog nostalgia |
| 3 | Vapor Grid | Retro-futurism, gradients, synthwave |
| 4 | Brutal Mono | Brutalist, monospace, developer-chic |
| 5 | Soft Focus | Premium, calm, streaming-app quality |

Variant assets are stored in `apps/web/variants/v1/` through `apps/web/variants/v5/`. The `useDesignVariant()` composable manages variant selection.
