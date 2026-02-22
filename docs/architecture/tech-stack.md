# Tech Stack

## Overview

Framedle uses an **edge-first serverless architecture** optimized for low latency, minimal cost, and multi-platform delivery. Every component scales to zero when idle and auto-scales under load.

## Stack Diagram

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
│                           EDGE LAYER                                │
│                                                                     │
│  API: Hono on Cloudflare Workers (300+ PoPs worldwide)             │
│  Auth: Clerk (JWT verification at edge, no DB call)                │
│  Realtime: Cloudflare Durable Objects (Duels WebSocket)            │
│  OG Images: Satori + Resvg on CF Worker                            │
│  CDN: Cloudflare (automatic, for R2-served assets)                 │
└──────┬─────────────────┬─────────────────┬─────────────────────────┘
       │                 │                 │
┌──────┴──────┐  ┌───────┴───────┐  ┌──────┴──────┐
│  DATABASE   │  │    CACHE      │  │   STORAGE   │
│             │  │               │  │             │
│  Neon       │  │  Upstash      │  │  Cloudflare │
│  PostgreSQL │  │  Redis        │  │  R2         │
│  (serverl.) │  │  (leaderb.    │  │  (frames,   │
│             │  │   + session   │  │   clips,    │
│  Drizzle    │  │   + cache)    │  │   audio,    │
│  ORM        │  │               │  │   OG imgs)  │
└─────────────┘  └───────────────┘  └─────────────┘
       │
┌──────┴──────────────────────────────────────────────────────────────┐
│                        CONTENT PIPELINE                              │
│                                                                     │
│  Orchestrator: GitHub Actions (daily cron, 6h limit)               │
│  Extraction: yt-dlp (metadata + heatmap, no video download)        │
│  Processing: ffmpeg (frames, crops, pixelation, clips, audio)      │
│  Upload: boto3 (S3-compatible API → R2)                            │
│  Catalog: psycopg2 (metadata → Neon)                               │
└─────────────────────────────────────────────────────────────────────┘
```

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
| Hosting | Vercel or CF Pages | Auto-deploy, preview environments |
| Analytics | PostHog | Product analytics, funnels, retention |
| Error tracking | Sentry | Error capture + source maps |

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

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Hono | Lightweight edge-native API (~14KB) |
| Runtime | Cloudflare Workers | <1ms cold start, 300+ edge locations |
| Validation | Zod | Request/response schema validation |
| Client generation | hono/client | Type-safe API client for frontend |
| OpenAPI | @hono/zod-openapi | Auto-generated API documentation |

### Authentication

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Provider | Clerk | Hosted auth with pre-built UI components |
| SSO | Google, Discord, Apple, GitHub, X | Social sign-in |
| Fallback | Email + password, Magic links | Non-social options |
| Verification | @clerk/backend | Edge JWT verification (no DB call) |
| Anonymous | Device fingerprint | Hash-based anonymous identity |
| Webhooks | Clerk webhooks | Sync user lifecycle → Neon |

### Database

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Engine | PostgreSQL 16 | Relational data (users, games, results) |
| Provider | Neon | Serverless, scale-to-zero, branching |
| ORM | Drizzle | TypeScript-first, edge-compatible |
| Search | pg_trgm extension | Fuzzy video title search |
| Migrations | Drizzle Kit | Schema migrations |

### Cache & Leaderboards

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Provider | Upstash Redis | Serverless Redis with REST API |
| Leaderboards | Sorted sets (ZADD/ZREVRANGE) | O(log N) rank operations |
| Session lock | SETNX | One-play-per-day enforcement |
| Query cache | Key-value | Hot query caching (search, frames) |
| Rate limiting | Sliding window | Per-IP and per-user throttling |

### Object Storage

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Provider | Cloudflare R2 | S3-compatible, $0 egress |
| Format | WebP | 30-50% smaller than JPEG |
| Access | Signed URLs (1h TTL) | Anti-hotlinking, anti-cheat |
| CDN | Cloudflare (built-in) | Edge-cached globally |
| Upload | boto3 (S3 API) | Pipeline → R2 |

### Content Pipeline

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Orchestrator | GitHub Actions | Daily cron, 6h execution limit |
| Video metadata | yt-dlp | Heatmap, title, channel, dates |
| Frame extraction | ffmpeg | Capture frames at timestamps |
| Image processing | ffmpeg + Pillow | Crops, pixelation, desat, fragments |
| Audio extraction | ffmpeg | .opus clips for Sound Only mode |
| Upload | boto3 | WebP files → R2 |
| Catalog | psycopg2 | Metadata → Neon |

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

### Free Tier Coverage (0-10K DAU)

| Service | Free Tier | Expected Usage |
|---------|-----------|---------------|
| Cloudflare Workers | 100K req/day | ~50K req/day |
| Cloudflare R2 | 10M class B req/mo | ~5M req/mo |
| Neon | 0.5 GB storage, autoscaling | <0.5 GB |
| Upstash Redis | 10K commands/day | ~5K commands/day |
| Clerk | 10K MAU | <10K MAU |
| GitHub Actions | 2,000 min/mo | ~300 min/mo |
| Vercel | 100 GB bandwidth | <100 GB |
| PostHog | 1M events/mo | <1M events/mo |
| Sentry | 5K errors/mo | <5K errors/mo |

### Scaled Costs

| DAU | Workers | R2 | Neon | Redis | Clerk | Total |
|-----|---------|-----|------|-------|-------|-------|
| 1K | $0 | $0 | $0 | $0 | $0 | ~$0 |
| 10K | $5 | $3 | $5 | $10 | $0 | ~$23 |
| 50K | $25 | $8 | $19 | $30 | $25 | ~$107 |
| 100K | $50 | $15 | $39 | $50 | $50 | ~$204 |
| 1M | $200 | $50 | $100 | $100 | $100 | ~$550 |

The key cost advantage: **R2's $0 egress** means serving millions of images costs only storage + request fees, not bandwidth.
