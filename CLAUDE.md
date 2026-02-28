# Framedle — Claude Code Project Instructions

## Project

Framedle is a multi-platform daily YouTube guessing game (Wordle meets YouTube). 12 game modes, leaderboards, social sharing, anonymous + registered auth.

## Architecture

VPS-first hybrid stack: all backend services on a single Hostinger KVM2 VPS managed by Coolify, with Cloudflare for CDN/DNS/DDoS and Cloudflare R2 for media storage.

- **Frontend**: React 19 + TypeScript + Tailwind CSS + Framer Motion
- **Web**: Next.js 15 (App Router, SSR)
- **Desktop/Mobile**: Tauri v2
- **API**: Hono (Node.js on VPS, port :4000)
- **Database**: PostgreSQL 16 (Drizzle ORM)
- **Cache**: Valkey 8 (Redis-compatible, sorted sets for leaderboards)
- **Auth**: Logto (self-hosted, anonymous → registered upgrade)
- **Storage**: Cloudflare R2 (10 GB free, $0 egress)
- **Monorepo**: Turborepo + pnpm
- **Deployment**: Coolify (self-hosted PaaS — push-to-deploy, auto HTTPS, scheduled DB backups)
- **Error tracking**: GlitchTip (Sentry SDK-compatible)
- **Analytics**: Umami (privacy-first, <2 KB script)

Diagrams (ASCII + Mermaid): `docs/architecture/system-architecture.md`, `docs/architecture/vps-deployment.md`, `docs/architecture/database-schema.md`.
Agent guides: `AGENTS.md` (root), `apps/web/AGENTS.md`, `apps/api/AGENTS.md`, `pipeline/AGENTS.md`, `docs/AGENTS.md`.

## Monorepo Structure

```
apps/web/             — Next.js 15 SSR frontend (framedle.wtf)
apps/api/             — Hono REST API + WebSocket server (port 4000)
packages/shared/      — @framedle/shared (types, constants, utilities)
packages/game-engine/ — @framedle/game-engine (XState v5 state machines)
packages/api-client/  — @framedle/api-client (typed HTTP client)
packages/ui/          — @framedle/ui (React components + Tailwind)
pipeline/             — Python content pipeline (yt-dlp + ffmpeg → R2)
docs/                 — Architecture, game design, ADRs, project management
```

## Key Documentation

- `docs/project-overview.md` — Vision, goals, target audience
- `docs/game-design/game-modes.md` — All 12 game modes
- `docs/game-design/game-mechanics.md` — Scoring, XP, streaks, achievements
- `docs/architecture/system-architecture.md` — System design, API endpoints (with ASCII diagrams)
- `docs/architecture/tech-stack.md` — Technology choices
- `docs/architecture/database-schema.md` — PostgreSQL schema
- `docs/architecture/cost-analysis.md` — Free tier ceilings, cost projections
- `docs/architecture/vps-deployment.md` — Hostinger KVM2 + Coolify setup, RAM budget (with ASCII diagrams)
- `docs/architecture/test-strategy.md` — Test layers: Vitest (unit+integration), Playwright (E2E)
- `docs/architecture/game-state-machines.md` — XState v5 state diagrams for all 12 modes
- `docs/adr/` — 9 Architectural Decision Records
- `docs/project-management/roadmap.md` — 28-week phased delivery
- `docs/project-management/linear-issues.md` — 50 issues, 226 story points
- `docs/project-management/linear-setup.md` — Linear workspace setup guide
- `docs/legal/privacy-policy.md` — Privacy policy
- `docs/AGENTS.md` — Documentation structure and navigation guide

## Conventions

- Use TypeScript strict mode everywhere
- Use pnpm as package manager
- Use Drizzle ORM for database access
- Game state machines use XState v5
- API responses follow consistent `{ data, error, meta }` shape
- Commit messages follow conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Git user: Dagdelo <henrique@hd5.dev>

## Deployment

- **Primary**: Hostinger KVM2 VPS managed by Coolify (push-to-deploy, auto HTTPS via Traefik, scheduled DB backups)
- **CDN**: Cloudflare free tier (DNS + proxy + DDoS)
- **Media**: Cloudflare R2 free tier (10 GB, $0 egress)
- **CI/CD**: GitHub Actions (public repo, free)
- **Pipeline**: GitHub Actions cron (yt-dlp + ffmpeg → R2)
- **Local dev**: `docker compose up -d` starts PostgreSQL 16 + Valkey (see `docker-compose.yml`)

## Environment

- `.envrc` auto-loads via direnv (git identity + NODE_ENV)
- `.envrc.local` holds secrets (gitignored, create from `.envrc.local.example`)
- `.env` holds Docker/app secrets (gitignored, create from `.env.template`)
