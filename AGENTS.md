# Framedle — Agent Guide

> **Note**: This document describes the intended architecture. Update as implementation proceeds.

## Project Summary

Framedle is a multi-platform daily YouTube guessing game — Wordle meets YouTube. Players are shown progressively less-obscured frames (or clips, audio, fragments) from a YouTube video and must identify it in as few attempts as possible. New puzzles unlock daily across 12 game modes.

**Key facts**:
- 12 game modes (Daily Frame, Pixel Reveal, Clip Guesser, Sound Only, Fragment Match, Timeline, Multi-Frame, Channel Guess, Era Guess, Duel, Marathon, Streak)
- Anonymous play with optional account registration and anonymous→registered history merge
- Leaderboards (daily, weekly, all-time), XP, streaks, achievements
- Target: 1,000–5,000 DAU on a $8/mo VPS

---

## Architecture Overview

Framedle uses a **VPS-first hybrid architecture**: all backend services run on a single Hostinger KVM2 VPS managed by Coolify, with Cloudflare for CDN/DNS/DDoS and Cloudflare R2 for media storage.

```
CLIENT APPS
  Next.js 15 (SSR/SEO)  |  Tauri v2 Desktop  |  Tauri v2 Mobile
         └──────────────────────┬──────────────────────┘
                          HTTPS / WebSocket
                                │
             CLOUDFLARE (CDN + DNS + DDoS + SSL)
             R2: frame images, clips, audio, OG images
                                │ origin pull
        HOSTINGER KVM2 VPS — managed by Coolify (Traefik)
          ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
          │ Next.js  │  │  Hono    │  │  Logto   │  │  Umami   │
          │ :3000    │  │  API     │  │  Auth    │  │ Analytics│
          │          │  │  :4000   │  │  :3301   │  │  :3100   │
          └──────────┘  └──────────┘  └──────────┘  └──────────┘
          ┌─────────────────────┐  ┌────────────┐  ┌────────────┐
          │   PostgreSQL 16     │  │   Valkey   │  │ GlitchTip  │
          │   :5432             │  │   :6379    │  │  :8000     │
          └─────────────────────┘  └────────────┘  └────────────┘
                                │
                         GitHub Actions
                    Content pipeline (daily cron)
                    yt-dlp → ffmpeg → R2 upload
```

**Detailed diagrams**: see `docs/architecture/system-architecture.md` (ASCII) and `docs/architecture/vps-deployment.md` (ASCII).

### Technology Choices

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend framework | React 19 + TypeScript | Shared across all clients |
| Web app | Next.js 15 (App Router) | SSR, ISR, share page OG rendering |
| Desktop/Mobile | Tauri v2 | Rust backend, React frontend from packages/ |
| API | Hono (Node.js) | REST + WebSocket (duels via ws library) |
| Database | PostgreSQL 16 | Drizzle ORM, pg_trgm for fuzzy search |
| Cache / Leaderboard | Valkey 8 (Redis-compatible) | Sorted sets for leaderboards, SETNX daily locks |
| Auth | Logto (self-hosted) | Google/Discord/GitHub/Apple SSO, anonymous upgrade |
| Media storage | Cloudflare R2 | 10 GB free, $0 egress |
| Monorepo | Turborepo + pnpm | Shared packages, parallel builds |
| Deployment | Coolify on KVM2 VPS | Push-to-deploy, auto HTTPS, scheduled DB backups |
| Error tracking | GlitchTip | Sentry SDK-compatible, 400 MB vs Sentry's 16+ GB |
| Analytics | Umami | Privacy-first, <2 KB script, shares PostgreSQL |
| State machines | XState v5 | One machine per game mode in packages/game-engine |
| Testing | Vitest + Playwright | Unit, integration, E2E |
| Styling | Tailwind CSS + Framer Motion | Design system in packages/ui |

---

## Monorepo Structure

```
framedle/
├── apps/
│   ├── web/                    # Next.js 15 — SSR web frontend
│   │   ├── app/                # App Router pages and layouts
│   │   ├── components/         # Web-specific React components
│   │   ├── Dockerfile          # Multi-stage build, standalone output
│   │   └── next.config.ts
│   ├── api/                    # Hono API — REST + WebSocket backend
│   │   ├── src/
│   │   │   └── index.ts        # Entry point
│   │   └── Dockerfile
│   ├── desktop/                # Tauri v2 desktop (planned)
│   │   ├── src-tauri/          # Rust backend
│   │   └── src/                # React frontend (imports from packages/)
│   └── mobile/                 # Tauri v2 mobile (planned)
│       ├── src-tauri/
│       └── src/
├── packages/
│   ├── ui/                     # Shared React design system
│   │   ├── components/         # Button, Card, Modal, GameBoard, etc.
│   │   ├── hooks/              # useGame, useTimer, useShare, etc.
│   │   └── styles/             # Tailwind presets, animations
│   ├── game-engine/            # Pure TypeScript game logic (XState v5)
│   │   ├── modes/              # One state machine file per game mode
│   │   ├── scoring.ts          # Score calculations
│   │   ├── types.ts            # Shared types and Zod schemas
│   │   └── daily-seed.ts       # Deterministic daily seed logic
│   ├── api-client/             # Typed HTTP client (generated from OpenAPI)
│   └── shared/                 # Constants, utils, validators
├── pipeline/
│   ├── extract_frames.py       # Single-video frame extraction
│   ├── extract_batch.py        # Batch processor (run by GitHub Actions)
│   ├── curate.py               # Video list management (TODO)
│   ├── assign_games.py         # Assign videos to future dates (TODO)
│   ├── requirements.txt        # yt-dlp, ffmpeg, Pillow, boto3, psycopg2
│   └── videos.json             # Video pool (curated list)
├── docker/                     # Dockerfile fragments and compose helpers
├── docker-compose.yml          # Local development stack
├── docker-compose.coolify.yml  # Production compose (Coolify mode)
├── docs/                       # All project documentation
│   ├── project-overview.md
│   ├── architecture/           # System design, tech stack, DB schema, etc.
│   ├── game-design/            # Game modes and mechanics
│   ├── adr/                    # 9 Architectural Decision Records
│   ├── legal/                  # Privacy policy
│   └── project-management/     # Roadmap, Linear issues
├── .github/
│   └── workflows/
│       └── extract-frames.yml  # Daily content pipeline (GitHub Actions cron)
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

---

## Common Commands

```bash
# Install dependencies (from repo root)
pnpm install

# Development (all apps and packages in parallel via Turborepo)
pnpm dev

# Build all packages and apps
pnpm build

# Run all tests
pnpm test

# Run tests for a specific package
pnpm turbo run test --filter=packages/game-engine

# Type-check without emitting
pnpm turbo run typecheck

# Lint
pnpm turbo run lint

# Local Docker development stack (PostgreSQL + Valkey)
docker compose up -d

# Run the content pipeline locally (requires yt-dlp, ffmpeg in PATH)
cd pipeline
pip install -r requirements.txt
python extract_frames.py --video-id <VIDEO_ID>
```

---

## Key Conventions

- **TypeScript strict mode** everywhere — `"strict": true` in all `tsconfig.json`
- **pnpm** as package manager — never use npm or yarn
- **Drizzle ORM** for all database access — no raw SQL outside of migrations
- **XState v5** for game state machines — one machine per mode in `packages/game-engine/modes/`
- **Hono** for all API routes — typed RPC, middleware-first design
- **API response shape**: always `{ data, error, meta }` — never naked payloads
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- **Single source of truth**: docs are authoritative — do not duplicate architecture decisions in code comments
- **Git user**: Dagdelo `<henrique@hd5.dev>`

---

## Deployment

- **Platform**: Hostinger KVM2 VPS (2 vCPU / 8 GB / 100 GB NVMe, ~$8/mo)
- **PaaS**: [Coolify](https://coolify.io) — push-to-deploy, auto HTTPS via Traefik, scheduled DB backups
- **CDN**: Cloudflare free tier — DNS, DDoS protection, edge caching
- **Media**: Cloudflare R2 — frame images, clips, audio (10 GB free, $0 egress)
- **CI/CD**: GitHub Actions — tests on PRs, daily content pipeline cron
- **Local dev**: `docker compose up -d` starts PostgreSQL 16 + Valkey

Production domains:
- `framedle.wtf` → Next.js app
- `api.framedle.wtf` → Hono API
- `auth.framedle.wtf` → Logto
- `analytics.framedle.wtf` → Umami
- `errors.framedle.wtf` → GlitchTip

---

## Key Documentation

| Topic | File |
|-------|------|
| Project vision and goals | `docs/project-overview.md` |
| All 12 game modes | `docs/game-design/game-modes.md` |
| Scoring, XP, streaks, achievements | `docs/game-design/game-mechanics.md` |
| System architecture and API endpoints | `docs/architecture/system-architecture.md` |
| Technology choices and rationale | `docs/architecture/tech-stack.md` |
| PostgreSQL schema | `docs/architecture/database-schema.md` |
| VPS deployment and Coolify setup | `docs/architecture/vps-deployment.md` |
| Cost analysis and free tier ceilings | `docs/architecture/cost-analysis.md` |
| Test strategy (Vitest + Playwright) | `docs/architecture/test-strategy.md` |
| Architectural Decision Records | `docs/adr/` (9 ADRs) |
| 28-week delivery roadmap | `docs/project-management/roadmap.md` |
| 50 Linear issues, 226 story points | `docs/project-management/linear-issues.md` |
| Privacy policy | `docs/legal/privacy-policy.md` |
| Docs navigation guide | `docs/AGENTS.md` |
| Web app guide | `apps/web/AGENTS.md` |
| API guide | `apps/api/AGENTS.md` |
| Pipeline guide | `pipeline/AGENTS.md` |

---

## Before You Start

- [ ] Copy `.env.template` to `.env` and fill in secrets
- [ ] Copy `.envrc.local.example` to `.envrc.local` and configure (requires [direnv](https://direnv.net/))
- [ ] Run `pnpm install` from repo root
- [ ] Run `docker compose up -d` to start local PostgreSQL and Valkey
- [ ] Run `pnpm dev` to start all apps in development mode
- [ ] Read `docs/architecture/system-architecture.md` for the full architecture picture
- [ ] Read `docs/game-design/game-modes.md` to understand what you're building
