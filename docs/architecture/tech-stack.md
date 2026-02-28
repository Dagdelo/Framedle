# Tech Stack

## Overview

Framedle uses a **VPS-first hybrid architecture** optimized for predictable low cost, full data ownership, and multi-platform delivery. The primary deployment runs on a Hostinger KVM2 VPS with open-source self-hosted services. Cloud-managed alternatives are documented for each component as a migration path when VPS capacity is exceeded.

## Stack Diagram

### Primary: VPS-First Hybrid

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION                               │
│                                                                     │
│  Web: Next.js 15 (App Router, SSR, SEO)                            │
│  Desktop: Tauri v2 (Win/Mac/Linux — native webview)                │
│  Mobile: Tauri v2 (iOS/Android — WKWebView/WebView)               │
│  Shared: React 19 + TypeScript + Tailwind CSS + Framer Motion      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                            HTTPS / WS
                                 │
┌────────────────────────────────┴────────────────────────────────────┐
│                    CLOUDFLARE (CDN / PROXY LAYER)                   │
│                                                                     │
│  DNS + CDN proxy + DDoS protection + SSL (free tier)               │
│  R2: frame images, clips, audio, OG images (10 GB free, $0 egress) │
│  Cache: static assets, frame images, API responses                  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ Origin pull
┌────────────────────────────────┴────────────────────────────────────┐
│                    VPS LAYER (Hostinger KVM2)                       │
│                    2 vCPU / 8 GB RAM / 100 GB NVMe                  │
│                                                                     │
│  API: Hono on Node.js (:4000)                                      │
│  App: Next.js 15 standalone (:3000)                                │
│  Auth: Logto self-hosted (:3301)                                   │
│  Realtime: ws library embedded in Hono (Duels WebSocket)           │
│  OG Images: Satori + Resvg in Node.js process                      │
│  Proxy: Traefik via Coolify (auto HTTPS, reverse proxy)            │
└──────┬─────────────────┬─────────────────┬─────────────────────────┘
       │                 │                 │
┌──────┴──────┐  ┌───────┴───────┐  ┌──────┴──────┐
│  DATABASE   │  │    CACHE      │  │   STORAGE   │
│             │  │               │  │             │
│ PostgreSQL  │  │  Valkey       │  │  Cloudflare │
│ 16 (VPS)   │  │  (VPS)        │  │  R2         │
│             │  │  (leaderb.    │  │  (frames,   │
│ Drizzle     │  │   + session   │  │   clips,    │
│ ORM         │  │   + cache)    │  │   audio,    │
│             │  │               │  │   OG imgs)  │
└─────────────┘  └───────────────┘  └─────────────┘
       │
┌──────┴──────────────────────────────────────────────────────────────┐
│                        CONTENT PIPELINE                              │
│                                                                     │
│  Orchestrator: GitHub Actions (daily cron, 6h limit)               │
│  Extraction: yt-dlp (metadata + heatmap, no video download)        │
│  Processing: ffmpeg (frames, crops, pixelation, clips, audio)      │
│  Upload: boto3 (S3-compatible API → R2)                            │
│  Catalog: psycopg2 (metadata → PostgreSQL)                         │
└─────────────────────────────────────────────────────────────────────┘
```

> **Legacy diagram (cloud-only reference)**: The original edge-first serverless diagram (Cloudflare Workers + Neon + Upstash + Clerk) remains valid as the cloud migration target. See the [Cloud Migration Cost Model](#cloud-migration-cost-model) section and [vps-deployment.md](vps-deployment.md) for the migration path.

## Component Details

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| UI Framework | React | 19 | Component rendering, hooks |
| Language | TypeScript | 5.x | Type safety across all packages |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Animations | Framer Motion | 11.x | Game transitions, reveals, celebrations |
| State (local) | Zustand | 5.x | Lightweight global state (UI, preferences) |
| State (game) | XState | 5.x | Finite state machines per game mode |
| Variant styling | class-variance-authority | — | Component variant management |
| Component docs | Storybook | 8.x | Visual component catalog |
| Icons | Lucide React | — | Consistent icon set |

### Web App

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Next.js 15 | App Router, SSR, SEO, share pages |
| Hosting | VPS via Coolify | Push-to-deploy, preview environments |
| Analytics | Umami (self-hosted) | Privacy-first analytics, no cookie banner |
| Error tracking | GlitchTip (self-hosted) | Sentry SDK compatible, error capture |

### Desktop & Mobile

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Tauri v2 | Native webview wrapper (6 platforms) |
| Backend | Rust | Native plugins (caching, notifications) |
| Local DB | SQLite (Tauri plugin) | Offline cache, anonymous results |
| Notifications | Tauri notification plugin | Streak reminders, duel invites |
| Updates | Tauri updater plugin | Auto-update (desktop) |
| Build | GitHub Actions | CI builds for Win/Mac/Linux/iOS/Android |

### API

| Component | Technology | Primary (VPS) | Migration (Cloud) |
|-----------|-----------|--------------|------------------|
| Framework | Hono | Hono on Node.js (VPS :4000) | Hono on Cloudflare Workers |
| Runtime | Node.js | Long-running process, ~200 MB RAM | <1ms cold start, 300+ edge PoPs |
| Validation | Zod | Request/response schema validation | Same |
| Client generation | hono/client | Type-safe API client for frontend | Same |
| OpenAPI | @hono/zod-openapi | Auto-generated API documentation | Same |

### Authentication

| Component | Technology | Primary (VPS) | Migration (Cloud) |
|-----------|-----------|--------------|------------------|
| Provider | Auth server | Logto (self-hosted, :3301) | Clerk |
| SSO | Social providers | Google, Discord, GitHub, Apple + 20 more | Google, Discord, Apple, GitHub, X |
| Fallback | Email/password | Email + password, Magic links | Same |
| Verification | JWT | Standard JWT (verify anywhere) | @clerk/backend (edge JWT) |
| Anonymous | Device fingerprint | Hash-based anonymous identity | Same |
| Webhooks | Lifecycle sync | Logto webhooks → PostgreSQL | Clerk webhooks → Neon |
| Cost | — | **$0 forever** (no user limits) | Free to 50K MRU, then $0.02/MRU |

### Database

| Component | Technology | Primary (VPS) | Migration (Cloud) |
|-----------|-----------|--------------|------------------|
| Engine | PostgreSQL 16 | VPS (shared_buffers=384 MB) | Neon (serverless, scale-to-zero) |
| Provider | — | Self-hosted via Coolify | Neon |
| ORM | Drizzle | TypeScript-first, works anywhere | Same |
| Search | pg_trgm extension | Fuzzy video title search | Same |
| Migrations | Drizzle Kit | Schema migrations | Same |
| Cost | — | **$0** (included in VPS) | Free to 0.5 GB, then ~$21+/mo |

### Cache & Leaderboards

| Component | Technology | Primary (VPS) | Migration (Cloud) |
|-----------|-----------|--------------|------------------|
| Provider | Redis-compatible | Valkey (self-hosted, :6379) | Upstash Redis |
| Leaderboards | Sorted sets | ZADD/ZREVRANGE, O(log N) | Same |
| Session lock | SETNX | One-play-per-day enforcement | Same |
| Query cache | Key-value | Hot query caching (search, frames) | Same |
| Rate limiting | Sliding window | Per-IP and per-user throttling | Same |
| Cost | — | **$0** (included in VPS), no command limits | Free to 500K cmds/mo, then $0.20/100K |

### Object Storage

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Provider | Cloudflare R2 | S3-compatible, $0 egress |
| Format | WebP | 30-50% smaller than JPEG |
| Access | Signed URLs (1h TTL) | Anti-hotlinking, anti-cheat |
| CDN | Cloudflare (built-in) | Edge-cached globally |
| Upload | boto3 (S3 API) | Pipeline → R2 |

> **Strategy B alternative**: Garage (self-hosted S3, Rust) can replace R2 for full self-hosting. See [vps-deployment.md](vps-deployment.md) for the Garage setup and trade-offs.

### Content Pipeline

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Orchestrator | GitHub Actions | Daily cron, 6h execution limit |
| Video metadata | yt-dlp | Heatmap, title, channel, dates |
| Frame extraction | ffmpeg | Capture frames at timestamps |
| Image processing | ffmpeg + Pillow | Crops, pixelation, desat, fragments |
| Audio extraction | ffmpeg | .opus clips for Sound Only mode |
| Upload | boto3 | WebP files → R2 |
| Catalog | psycopg2 | Metadata → PostgreSQL |

### Monorepo & DX

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Monorepo | Turborepo | Task orchestration, caching |
| Package manager | pnpm | Fast, disk-efficient |
| Linting | ESLint + Prettier | Code quality |
| Testing | Vitest | Unit + integration tests |
| E2E Testing | Playwright | Cross-browser end-to-end |
| CI/CD | GitHub Actions | Lint, test, build, deploy |

## Cost Model

> Full analysis with per-game resource consumption, free tier ceilings, and migration triggers: **[Cost Analysis](cost-analysis.md)**
>
> For detailed VPS fixed costs, RAM budgets, and bandwidth analysis: **[VPS Deployment](vps-deployment.md)**

### VPS Cost Model (Primary)

The VPS is a **fixed-cost** deployment — costs do not scale with user count until VPS hardware is exhausted (~3,000–5,000 DAU on KVM2).

| DAU | VPS Cost | Notes |
|-----|---------|-------|
| 0–5,000 | **$8–18/mo** | KVM2 fixed cost, Cloudflare/R2/GitHub free tiers |
| 5,000–15,000 | **$15–26/mo** | Upgrade to KVM4 (4 vCPU / 16 GB) |
| 15,000+ | Migrate incrementally | Move API → CF Workers, DB → Neon (see migration path) |

| Component | Cost |
|-----------|------|
| Hostinger KVM2 VPS | $7–18/mo (billing dependent) |
| Cloudflare (free tier) | $0 |
| Cloudflare R2 (free tier, 10 GB) | $0 |
| GitHub Actions (public repo) | $0 |
| Domain | ~$1/mo |
| **Total** | **$8–19/mo** |

### Cloud Migration Cost Model

If migrating away from VPS to fully managed cloud services:

| Service | Free Tier | Max DAU on Free |
|---------|-----------|----------------|
| Cloudflare Workers | 100K req/day | ~2,500 |
| Cloudflare R2 | 10 GB storage, 10M class B/mo | ~83,000 |
| Neon | 100 CU-hours/mo, 0.5 GB | ~1,000 |
| Upstash Redis | 500K commands/mo | ~1,100 |
| Clerk | 50K MRU | ~60,000 |
| GitHub Actions | 2,000 min/mo (free for public repos) | N/A |
| Cloudflare Pages | Unlimited (no commercial restriction) | N/A |
| PostHog | 1M events/mo | ~83,000 |
| Sentry | 5K errors/mo | ~30,000 |

Scaled cloud costs (monthly):

| DAU | Workers | R2 | Neon | Redis | Clerk | Other | Total |
|-----|---------|-----|------|-------|-------|-------|-------|
| 500 | $0 | $0 | $0 | $0 | $0 | $1 | **~$1** |
| 1K | $5 | $0 | $0 | $1 | $0 | $1 | **~$7** |
| 5K | $5 | $0 | $21 | $5 | $0 | $1 | **~$32** |
| 20K | $9 | $0 | $53 | $10 | $0 | $1 | **~$82** |
| 50K | $20 | $2 | $128 | $10 | $25 | $27 | **~$215** |
| 100K | $35 | $3 | $310 | $30 | $675 | $42 | **~$1,100** |

The key cloud cost advantage: **R2's $0 egress** means serving millions of images costs only storage + request fees, not bandwidth. At 100K DAU, Clerk (auth) becomes the dominant cloud cost — self-hosted Logto on VPS eliminates this entirely.

**VPS vs Cloud comparison** (from [vps-deployment.md](vps-deployment.md)):

| DAU | VPS (Strategy A) | Cloud-Only | Savings |
|-----|-----------------|------------|---------|
| 500 | $8 | $1 | Cloud cheaper |
| 1,000 | $8 | $7 | Similar |
| 3,000 | **$8** | $32 | **VPS saves $24/mo** |
| 10,000 | **$15** (KVM4) | $82 | **VPS saves $67/mo** |
| 20,000+ | Multi-server needed | $215 | Cloud easier at this scale |
