# Framedle — Claude Code Project Instructions

## Project

Framedle is a multi-platform daily YouTube guessing game (Wordle meets YouTube). 12 game modes, leaderboards, social sharing, anonymous + registered auth.

## Architecture

VPS-first hybrid stack: all backend services on a single Hostinger KVM2 VPS managed by Coolify, with Cloudflare for CDN/DNS/DDoS and Cloudflare R2 for media storage.

- **Frontend**: Vue 3 + TypeScript + Tailwind CSS + motion.dev
- **Web**: Nuxt 3 (SSR, file-based routing)
- **Desktop/Mobile**: Tauri v2
- **API**: Hono (Node.js on VPS, port :4000)
- **Database**: PostgreSQL 16 (Drizzle ORM)
- **Cache**: Valkey 8 (Redis-compatible, sorted sets for leaderboards)
- **Auth**: Logto (self-hosted, anonymous → registered upgrade)
  - Web: `openid-client` OIDC flow, H3 encrypted cookie sessions (`useAuth()` composable)
  - API: `jose` JWT verification via JWKS (stateless, no DB call)
  - Admin: JWT `admin` role claim via `requireAdmin` middleware
- **Storage**: Cloudflare R2 (10 GB free, $0 egress)
- **Monorepo**: Turborepo + pnpm
- **Deployment**: Coolify (self-hosted PaaS — push-to-deploy, auto HTTPS, scheduled DB backups)
- **Error tracking**: GlitchTip (Sentry SDK-compatible)
- **Analytics**: Umami (privacy-first, <2 KB script)

Diagrams (ASCII + Mermaid): `docs/architecture/system-architecture.md`, `docs/architecture/vps-deployment.md`, `docs/architecture/database-schema.md`.
Agent guides: `AGENTS.md` (root), `apps/web/AGENTS.md`, `apps/api/AGENTS.md`, `pipeline/AGENTS.md`, `docs/AGENTS.md`.

## Monorepo Structure

```
apps/web/             — Nuxt 3 SSR frontend (framedle.wtf)
apps/api/             — Hono REST API + WebSocket server (port 4000)
packages/shared/      — @framedle/shared (types, constants, utilities)
packages/game-engine/ — @framedle/game-engine (pure function game logic)
packages/api-client/  — @framedle/api-client (typed HTTP client)
packages/ui/          — @framedle/ui (Vue 3 components + Tailwind)
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
- Game logic uses pure functions (not XState for MVP)
- API responses follow consistent `{ data, error, meta }` shape
- Commit messages follow conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `perf:`, `ci:`
- Scopes match monorepo packages: `(api)`, `(web)`, `(shared)`, `(game-engine)`, `(api-client)`, `(ui)`, `(pipeline)`, `(deps)`
- Git user: Dagdelo <henrique@hd5.dev>

## Git Workflow

**Branch flow**: `development` → PR → `main` (production). Never push directly to `main`.

- `main` — Production branch. Only receives merged PRs. Deployed to framedle.wtf via Coolify.
- `development` — Integration branch. All feature work lands here first.
- Always commit after a successful iteration of work. Do not batch unrelated changes.
- Use `/commit` skill for conventional commit formatting.
- Use `/pr` skill to open PRs from development to main.
- Run `pnpm test` before pushing. All tests must pass.

## Versioning

This project follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR** — Breaking changes to game modes, API contracts, or DB schema
- **MINOR** — New features, game modes, admin dashboard capabilities
- **PATCH** — Bug fixes, performance improvements, docs updates

Current version is tracked in the root `package.json` `"version"` field. All workspace packages share the same version.

Bump version in root `package.json` when preparing a release PR to main.

## Deployment

- **Primary**: Hostinger KVM2 VPS managed by Coolify (push-to-deploy, auto HTTPS via Traefik, scheduled DB backups)
- **CDN**: Cloudflare free tier (DNS + proxy + DDoS)
- **Media**: Cloudflare R2 free tier (10 GB, $0 egress)
- **CI/CD**: GitHub Actions (public repo, free)
- **Pipeline**: GitHub Actions cron (yt-dlp + ffmpeg → R2)
- **Local dev**: `docker compose up -d` starts PostgreSQL 16 + Valkey (see `docker-compose.yml`)

### Auth Environment Variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `LOGTO_ENDPOINT` | API, Nuxt | Base Logto instance URL |
| `LOGTO_API_RESOURCE` | API | JWT audience for JWKS verification |
| `LOGTO_WEBHOOK_SECRET` | API | Verify Logto webhook signatures |
| `LOGTO_M2M_APP_ID` | API | Management API client (user invites, roles) |
| `LOGTO_M2M_APP_SECRET` | API | Management API secret |
| `NUXT_LOGTO_APP_ID` | Nuxt | OIDC client ID for web app |
| `NUXT_LOGTO_APP_SECRET` | Nuxt | OIDC client secret for web app |
| `NUXT_LOGTO_API_RESOURCE` | Nuxt | API resource for access token audience |
| `NUXT_LOGTO_COOKIE_SECRET` | Nuxt | AES-256 session cookie encryption key |

See `docs/auth-setup-guide.md` for OAuth provider configuration (Google, GitHub, Twitter, Instagram, Facebook).

## Environment

- `.envrc` auto-loads via direnv (git identity + NODE_ENV)
- `.envrc.local` holds secrets (gitignored, create from `.envrc.local.example`)
- `.env` holds Docker/app secrets (gitignored, create from `.env.template`)
