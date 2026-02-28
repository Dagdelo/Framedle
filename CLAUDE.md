# Framedle — Claude Code Project Instructions

## Project

Framedle is a multi-platform daily YouTube guessing game (Wordle meets YouTube). 12 game modes, leaderboards, social sharing, anonymous + registered auth.

## Architecture

- **Frontend**: React 19 + TypeScript + Tailwind CSS + Framer Motion
- **Web**: Next.js 15 (App Router, SSR)
- **Desktop/Mobile**: Tauri v2
- **API**: Hono (Node.js on VPS or Cloudflare Workers)
- **Database**: PostgreSQL 16
- **Cache**: Valkey (Redis-compatible)
- **Auth**: Logto (self-hosted) or Clerk (managed)
- **Storage**: Cloudflare R2 or Garage (self-hosted S3-compatible)
- **Monorepo**: Turborepo + pnpm

## Key Documentation

- `docs/project-overview.md` — Vision, goals, target audience
- `docs/game-design/game-modes.md` — All 12 game modes
- `docs/game-design/game-mechanics.md` — Scoring, XP, streaks, achievements
- `docs/architecture/system-architecture.md` — System design, API endpoints
- `docs/architecture/tech-stack.md` — Technology choices
- `docs/architecture/database-schema.md` — PostgreSQL schema
- `docs/architecture/cost-analysis.md` — Free tier ceilings, cost projections
- `docs/architecture/vps-deployment.md` — Hostinger KVM2 self-hosted stack
- `docs/adr/` — 9 Architectural Decision Records
- `docs/project-management/roadmap.md` — 28-week phased delivery
- `docs/project-management/linear-issues.md` — 50 issues, 226 story points

## Conventions

- Use TypeScript strict mode everywhere
- Use pnpm as package manager
- Use Drizzle ORM for database access
- Game state machines use XState v5
- API responses follow consistent `{ data, error, meta }` shape
- Commit messages follow conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Git user: Dagdelo <henrique@hd5.dev>

## Deployment

- **Primary**: Hostinger KVM2 VPS with Docker Compose
- **CDN**: Cloudflare free tier (DNS + proxy + DDoS)
- **Media**: Cloudflare R2 free tier (10 GB, $0 egress)
- **CI/CD**: GitHub Actions (public repo, free)
- **Pipeline**: GitHub Actions cron (yt-dlp + ffmpeg → R2)

## Environment

- `.envrc` auto-loads via direnv (git identity + NODE_ENV)
- `.envrc.local` holds secrets (gitignored, create from `.envrc.local.example`)
- `.env` holds Docker/app secrets (gitignored, create from `.env.template`)
