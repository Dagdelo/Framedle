# apps/web — Agent Guide

> **Note**: This document describes the intended architecture. Update as implementation proceeds.

## Purpose

The `apps/web` package is the **Next.js 15 SSR web frontend** for Framedle. It handles:

- Server-side rendering for SEO (game hub, leaderboards, share pages)
- Daily game UI for all 12 modes
- Social sharing pages with dynamic Open Graph images
- Anonymous and authenticated user sessions via Logto

Live at: `https://framedle.wtf`

---

## Key Routes / Pages

```
app/
├── page.tsx                        # Home / game hub — lists all modes + today's status
├── layout.tsx                      # Root layout: fonts, Logto provider, analytics
├── (game)/
│   └── [mode]/
│       ├── page.tsx                # Game page — renders correct game board for mode
│       └── result/page.tsx         # Result screen (after completion)
├── leaderboard/
│   └── [mode]/page.tsx             # Leaderboard — SSR top 100 + client rank highlight
├── share/
│   └── [gameId]/page.tsx           # Share page — SSR for OG metadata, result display
├── profile/
│   └── page.tsx                    # User profile, stats, achievement grid
└── api/
    └── og/route.ts                 # OG image generation (satori/resvg)
```

Pages use **React Server Components** by default. Client components (`"use client"`) are used only for interactive game boards and real-time UI.

---

## Package Dependencies

| Dependency | Purpose |
|-----------|---------|
| `packages/ui` | Shared design system — GameBoard, Button, Modal, etc. |
| `packages/game-engine` | XState v5 state machines — game logic for all modes |
| `packages/api-client` | Typed HTTP client — all requests to `api.framedle.wtf` |
| `packages/shared` | Constants, validators, utility functions |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Hono API base URL (e.g. `https://api.framedle.wtf`) |
| `NEXT_PUBLIC_LOGTO_ENDPOINT` | Yes | Logto auth server URL |
| `NEXT_PUBLIC_LOGTO_APP_ID` | Yes | Logto application ID |
| `NEXT_PUBLIC_SENTRY_DSN` | No | GlitchTip DSN for error tracking |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | No | Umami analytics script URL |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | No | Umami website ID |
| `DATABASE_URL` | No | Direct DB access (only for server-side data fetching if bypassing API) |

Secrets are managed in Coolify's encrypted env var UI in production. Locally, copy `.env.template` to `.env`.

---

## Development Workflow

```bash
# From repo root
pnpm dev                          # Start all apps (Turborepo watches packages/)
# Or, to run web only:
cd apps/web && pnpm dev           # Start Next.js dev server on :3000

# Build (standalone output for Docker)
pnpm build

# Type-check
pnpm typecheck

# Lint
pnpm lint
```

The dev server runs on `http://localhost:3000`. It expects the Hono API running on `:4000` (set `NEXT_PUBLIC_API_URL=http://localhost:4000`). Start local services with `docker compose up -d` from the repo root.

---

## Dockerfile

`apps/web/Dockerfile` uses a **multi-stage build**:

1. **deps** stage — installs `node_modules` with `pnpm install --frozen-lockfile`
2. **builder** stage — runs `next build` with `output: "standalone"` (self-contained Node.js server, no node_modules needed at runtime)
3. **runner** stage — minimal `node:22-alpine` image, copies `.next/standalone` and `.next/static`

The standalone output keeps the runtime image small (~150–200 MB vs ~800 MB for a full install). Deployed via Coolify connected to the GitHub repo; every push to `main` triggers a rebuild.

Coolify setting: **Dockerfile path** → `apps/web/Dockerfile`, **Domain** → `framedle.wtf`.
