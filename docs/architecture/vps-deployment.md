# VPS Deployment — Hostinger KVM2 + Coolify

## VPS Specifications

| Spec | KVM2 |
|------|------|
| CPU | 2 vCPU (AMD EPYC, shared) |
| RAM | 8 GB |
| Storage | 100 GB NVMe SSD |
| Bandwidth | 8 TB/month |
| Network | 1 Gbps |
| Cost | ~$7–18/mo (depending on billing cycle) |
| Features | KVM isolation, DDoS protection, weekly backups, 1 snapshot |
| Location | Sao Paulo (recommended for PT-BR audience) |

## Deployment Platform: Coolify

[Coolify](https://coolify.io) is a **self-hosted PaaS** — an open-source alternative to Vercel, Netlify, and Heroku that runs on your own server.

### Why Coolify

| Manual Docker Compose + Caddy | Coolify |
|-------------------------------|---------|
| Hours of config writing | 1-minute install script |
| Write your own CI/CD scripts | Built-in git push-to-deploy |
| Manage Let's Encrypt manually | Automatic SSL (zero config) |
| SSH + CLI only | Web dashboard |
| Write cron + pg_dump scripts | Built-in scheduled DB backups to S3 |
| No preview deploys | PR preview environments |
| You maintain everything | Self-updating |

### What Coolify Runs Internally

| Container | Purpose | RAM |
|-----------|---------|-----|
| `coolify` | Laravel dashboard + API | ~400 MB |
| `coolify-db` | Internal metadata PostgreSQL | ~50 MB |
| `coolify-redis` | Caching, queues, sessions | ~15 MB |
| `coolify-realtime` | Soketi WebSocket (live UI updates) | ~25 MB |
| `coolify-proxy` | Traefik reverse proxy (auto HTTPS) | ~40 MB |
| **Total overhead** | | **~530 MB** |

### One-Click Service Templates

| Service | One-Click? | Notes |
|---------|-----------|-------|
| PostgreSQL | Yes | Native database type with automated backups |
| Redis | Yes | Native database type |
| Valkey | No | Deploy as custom Docker image (`valkey/valkey:8-alpine`) |
| Logto | Yes | One-click service template |
| Umami | Yes | One-click service template |
| GlitchTip | Yes | One-click service template |
| Garage | Yes | One-click service template |
| MinIO | Yes | One-click service template |

### Key Features for Framedle

- **Git push-to-deploy**: Connect GitHub repo, push to `main` → auto-build + deploy
- **Automatic HTTPS**: Traefik handles Let's Encrypt certificates for all domains
- **Environment variables**: Encrypted, separate production/preview, managed in UI
- **Database backups**: Scheduled to any S3-compatible storage (R2, Garage, Backblaze)
- **Container logs**: Real-time in the dashboard + in-browser terminal
- **PR previews**: Open a PR → Coolify deploys a preview environment
- **Multi-app routing**: Traefik auto-routes `framedle.wtf`, `api.framedle.wtf`, `auth.framedle.wtf`

### Pricing

**$0** — fully open-source (Apache 2.0), all features, no paywalls. The paid Cloud offering ($5/mo) is just managed hosting of Coolify itself — same features.

---

## Two Deployment Strategies

| | Strategy A: Hybrid | Strategy B: All-in VPS |
|---|---|---|
| **Philosophy** | Self-host expensive services, keep free cloud where superior | Everything on VPS, external only for DNS/CDN/CI |
| **Monthly cost** | VPS + $0 cloud free tiers | VPS only |
| **Max DAU** | ~3,000–5,000 (VPS-limited) | ~2,000–3,000 (more services competing for resources) |
| **CDN** | Cloudflare free (essential) | Cloudflare free (essential) |
| **Object storage** | Cloudflare R2 free (10 GB, $0 egress) | Garage on VPS |
| **Durability** | R2 handles media durability | You manage backups |
| **Complexity** | Lower (fewer VPS services) | Higher (more to manage) |
| **Recommendation** | **Start here** | Fallback if R2 is undesirable |

Both strategies use **Cloudflare free tier as a CDN/proxy** in front of the VPS. This is non-negotiable for an image-heavy game — it provides global caching, DDoS protection, and SSL, all for $0.

---

## Strategy A: Hybrid (Recommended)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  CLIENTS: Web (Next.js) / Desktop+Mobile (Tauri v2)                │
└──────────────────────┬──────────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────┴──────────────────────────────────────────────┐
│  CLOUDFLARE FREE TIER                                               │
│  DNS + CDN proxy + DDoS protection + SSL                           │
│  Cache: static assets, frame images, API responses                  │
│  R2: frame images, clips, audio, OG images (10 GB free, $0 egress) │
└──────────────────────┬──────────────────────────────────────────────┘
                       │ Origin pull
┌──────────────────────┴──────────────────────────────────────────────┐
│  HOSTINGER KVM2 VPS (2 vCPU / 8 GB / 100 GB NVMe)                  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  Coolify (PaaS Dashboard + Traefik reverse proxy)    │          │
│  │  Auto HTTPS, push-to-deploy, container management    │          │
│  └──────────────────────────────────────────────────────┘          │
│       │ routes to:                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Next.js  │  │  Hono    │  │  Logto   │  │  Umami   │          │
│  │  App     │  │  API     │  │  Auth    │  │ Analytics│          │
│  │  (SSR)   │  │  Server  │  │  Server  │  │          │          │
│  │  :3000   │  │  :4000   │  │  :3301   │  │  :3100   │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│       │                                                             │
│  ┌─────────────────────────────────────────────────────┐          │
│  │  PostgreSQL 16        │  Valkey (Redis)              │          │
│  │  :5432                │  :6379                       │          │
│  │  (app + logto +       │  (cache + leaderboards)      │          │
│  │   umami + glitchtip)  │                              │          │
│  └───────────────────────┴──────────────────────────────┘          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  GlitchTip (error tracking, Sentry-compatible)       │          │
│  │  :8000                                                │          │
│  └──────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                       │
              GitHub Actions (free)
              Content pipeline: yt-dlp → ffmpeg → R2 upload
```

### What Runs Where

| Component | Where | Why |
|-----------|-------|-----|
| **Next.js app** | VPS | SSR, game UI, share pages |
| **Hono API** | VPS (Node.js) | Game logic, auth verification, DB queries |
| **PostgreSQL 16** | VPS | Users, games, results, frames metadata |
| **Valkey** | VPS | Leaderboards (sorted sets), caching, session locks |
| **Logto** | VPS | Auth with Google/Discord/GitHub/Apple SSO |
| **Coolify (Traefik)** | VPS | PaaS dashboard, reverse proxy, auto HTTPS, push-to-deploy |
| **Umami** | VPS | Privacy-first analytics (uses shared PostgreSQL) |
| **GlitchTip** | VPS | Error tracking (Sentry SDK compatible) |
| **Frame images** | Cloudflare R2 | 10 GB free, $0 egress, CDN-integrated |
| **CDN + SSL** | Cloudflare free | Global edge caching, DDoS, auto SSL |
| **CI/CD + pipeline** | GitHub Actions | Free for public repos, 6h limit for ffmpeg |
| **WebSocket (Duels)** | VPS (ws library) | Embedded in Hono API process |

### RAM Budget

| Service | Allocation | Notes |
|---------|-----------|-------|
| Linux OS + overhead | 500 MB | Base system |
| Coolify stack | 530 MB | Dashboard, internal DB/Redis, Soketi, Traefik |
| PostgreSQL 16 | 1,500 MB | `shared_buffers=384MB`, shared by 4 apps |
| Next.js (standalone) | 400 MB | `output: "standalone"`, SSR |
| Hono API (Node.js) | 200 MB | Lightweight, includes ws for Duels |
| Logto | 250 MB | Node.js auth server + admin panel |
| Valkey | 256 MB | `maxmemory 256mb`, LRU eviction |
| Umami | 250 MB | Node.js, shares PostgreSQL |
| GlitchTip | 400 MB | Django web + Celery worker |
| **Total allocated** | **~4,300 MB** | |
| **Headroom** | **~3,700 MB** | For spikes, OS cache, swap |

Comfortable fit. ~3.7 GB headroom handles traffic spikes and OS page cache (critical for PostgreSQL performance). Coolify replaces Caddy but adds ~480 MB more overhead due to its dashboard, internal DB, and WebSocket server.

### Storage Budget

| Data | Size | Notes |
|------|------|-------|
| OS + system packages | 5 GB | Ubuntu 24.04 minimal |
| Docker images | 8 GB | All services containerized |
| PostgreSQL data | 2–10 GB | Grows with users/games |
| Valkey data | <1 GB | Leaderboards + cache |
| Logto data | <500 MB | In PostgreSQL |
| Umami data | <1 GB | In PostgreSQL |
| GlitchTip data | 1–3 GB | In PostgreSQL, configure retention |
| Application code | <1 GB | Deployments |
| Logs + tmp | 2 GB | Rotate aggressively |
| **Total** | **~20–30 GB** | |
| **Available** | **~70–80 GB** | Plenty of headroom |

Frame images live in R2, not on the VPS. This is the key advantage of Strategy A.

### Bandwidth Analysis

| DAU | Games/Day | Data per Game | Daily Transfer | Monthly |
|-----|-----------|--------------|---------------|---------|
| 500 | 1,250 | ~300 KB | ~375 MB | ~11 GB |
| 1,000 | 2,500 | ~300 KB | ~750 MB | ~22 GB |
| 3,000 | 7,500 | ~300 KB | ~2.2 GB | ~67 GB |
| 5,000 | 12,500 | ~300 KB | ~3.7 GB | ~112 GB |

With Cloudflare CDN caching static assets and frame images (served from R2), **origin bandwidth is minimal**. The 8 TB/month limit is nowhere near a concern. Most traffic is API responses (JSON, <5 KB each).

### Monthly Cost

| Component | Cost |
|-----------|------|
| Hostinger KVM2 | $7–18 (billing dependent) |
| Cloudflare (free tier) | $0 |
| Cloudflare R2 (free tier, 10 GB) | $0 |
| GitHub Actions (public repo) | $0 |
| Domain | ~$1 |
| **Total** | **$8–19/mo** |

This is a **fixed cost** — it doesn't scale with users until you outgrow the VPS hardware.

---

## Strategy B: All-in VPS

### Differences from Strategy A

| Component | Strategy A | Strategy B |
|-----------|-----------|-----------|
| Object storage | Cloudflare R2 (free) | **Garage on VPS** |
| Media serving | R2 → CF CDN | VPS → CF CDN (origin) |
| Storage used on VPS | ~20–30 GB | **~30–50 GB** (+ media files) |
| Backup responsibility | R2 is durable | **You manage media backups** |
| Pipeline upload target | R2 (boto3) | VPS (scp/rsync or S3 API to Garage) |

### Additional RAM for Strategy B

| Service | Allocation |
|---------|-----------|
| Everything from Strategy A | 4,300 MB |
| Garage (object storage) | +300 MB |
| **Total** | **~4,600 MB** |

Still fits in 8 GB with ~3.4 GB headroom.

### Storage Impact

| Content | Size |
|---------|------|
| Strategy A base | ~20–30 GB |
| 1,000 videos × ~3 MB | +3 GB |
| 3,000 videos × ~3 MB | +9 GB |
| 5,000 videos × ~3 MB | +15 GB |
| **Total at 3K videos** | **~40 GB** |

Fits in 100 GB, but media growth needs monitoring. At 10,000 videos (30 GB media), you'd be at ~60 GB total — still fine but tighter.

### Why Strategy A is Still Recommended

Even in a "maximize self-hosting" scenario, Cloudflare R2 is worth keeping because:

1. **$0 cost** — free tier covers the game's storage needs for years
2. **$0 egress** — R2 is unique here; Garage on VPS means origin pulls cost bandwidth
3. **Durability** — R2 is replicated; VPS NVMe is a single point of failure for media
4. **CDN integration** — R2 assets are automatically edge-cached via Cloudflare; Garage requires explicit cache headers and origin pulls
5. **No VPS storage pressure** — keeps 70+ GB free for database growth

The only reason to choose Strategy B is a hard requirement to avoid all external storage vendors.

---

## Open-Source Stack Details

### Logto (replacing Clerk)

The closest open-source Clerk alternative. Modern developer experience with pre-built UI components.

| Feature | Clerk | Logto (self-hosted) |
|---------|-------|-------------------|
| Social SSO | Google, Discord, GitHub, Apple, X | Google, Discord, GitHub, Apple + 20 more |
| Email/password | Yes | Yes |
| Magic links | Yes | Yes |
| MFA | Pro only | Yes (free) |
| Pre-built UI | Yes | Yes (customizable) |
| JWT verification | Edge-native | Standard JWT (verify anywhere) |
| Cost | Free to 50K MRU, then $0.02/MRU | **$0 forever** |
| RAM | N/A (cloud) | ~250 MB |
| Dependencies | None | PostgreSQL (shared) |

Setup: Logto needs its own PostgreSQL database (schema). Share the PostgreSQL instance — create a separate `logto` database alongside `framedle`, `umami`, `glitchtip`.

```
# Logto environment
LOGTO_DB_URL=postgresql://logto:pass@localhost:5432/logto
LOGTO_ENDPOINT=https://auth.framedle.wtf
LOGTO_ADMIN_ENDPOINT=https://auth-admin.framedle.wtf
```

**Migration from Clerk**: If you ever used Clerk and want to migrate, Logto supports user import via API. The JWT format differs, so client SDKs need updating.

### Valkey (replacing Upstash Redis)

Drop-in Redis replacement, backed by the Linux Foundation. 100% API compatible.

| Feature | Upstash Redis | Valkey (self-hosted) |
|---------|-------------|---------------------|
| Sorted sets (leaderboards) | Yes | Yes |
| SETNX (daily locks) | Yes | Yes |
| Pipelining | Yes | Yes |
| REST API | Built-in | No (TCP only, use ioredis) |
| Persistence | Managed | Configure AOF + RDB |
| Cost | $0 → $0.20/100K cmds | **$0 forever** |
| RAM | N/A | ~128–256 MB (configurable) |
| Limitations | 500K cmds/mo free | **None** — unlimited commands |

```
# valkey.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
save 900 1
save 300 10
```

No free-tier ceiling. No per-command charges. The leaderboard bottleneck at 1,100 DAU disappears entirely.

### Garage (replacing R2, Strategy B only)

Lightweight S3-compatible object storage written in Rust.

| Feature | Cloudflare R2 | Garage (self-hosted) |
|---------|-------------|---------------------|
| S3 API | Yes | Yes |
| Egress cost | $0 | N/A (your bandwidth) |
| Free storage | 10 GB | **100 GB** (your disk) |
| CDN | Native CF edge | Via Cloudflare proxy |
| Durability | Multi-region replication | **Single disk** (you handle backups) |
| RAM | N/A | ~300 MB |

```bash
# Single-node Garage setup
garage -c /etc/garage.toml server

# garage.toml
metadata_dir = "/var/lib/garage/meta"
data_dir = "/var/lib/garage/data"
db_engine = "sqlite"

[s3_api]
api_bind_addr = "127.0.0.1:3900"
s3_region = "garage"
root_domain = ".s3.garage.localhost"

[s3_web]
bind_addr = "127.0.0.1:3902"
root_domain = ".web.garage.localhost"
```

### Umami (replacing PostHog)

Privacy-first analytics. Uses PostgreSQL (shared).

| Feature | PostHog | Umami (self-hosted) |
|---------|---------|-------------------|
| Page views + events | Yes | Yes |
| Session replay | Yes | No |
| Feature flags | Yes | No |
| Funnels | Yes | Basic |
| A/B testing | Yes | No |
| Script size | ~100 KB | **<2 KB** |
| RAM | 16+ GB (needs ClickHouse) | **~250 MB** |
| Dependencies | ClickHouse, Kafka, Redis | PostgreSQL (shared) |

PostHog cannot run on an 8 GB VPS (requires 16+ GB minimum). Umami is the only viable option and covers all the analytics needs for a game (page views, custom events, referrers, device stats).

### GlitchTip (replacing Sentry)

Sentry-compatible error tracking. Uses the same `@sentry/nextjs` SDK.

| Feature | Sentry (self-hosted) | GlitchTip (self-hosted) |
|---------|---------------------|------------------------|
| Error tracking | Yes | Yes |
| Performance monitoring | Yes | Yes |
| Uptime monitoring | Yes | Yes |
| Session replay | Yes | No |
| Sentry SDK compatible | Yes | **Yes** (same DSN format) |
| RAM | 16–32 GB (12+ containers) | **~400 MB** (4 components) |
| Dependencies | ClickHouse, Kafka, Snuba, Relay... | PostgreSQL + Redis (both shared) |

Sentry self-hosted is impossible on 8 GB. GlitchTip is purpose-built for small deployments:

```python
# In your Next.js app — same Sentry SDK, just point DSN to GlitchTip
NEXT_PUBLIC_SENTRY_DSN=https://key@glitchtip.framedle.wtf/1
```

### Routing (Coolify + Traefik)

Coolify manages Traefik as its built-in reverse proxy. Domain routing is configured per-service in the Coolify dashboard — no manual config files needed.

| Domain | Service | Set in Coolify |
|--------|---------|----------------|
| `framedle.wtf` | Next.js app | Resource → Settings → Domains |
| `api.framedle.wtf` | Hono API | Resource → Settings → Domains |
| `auth.framedle.wtf` | Logto | Resource → Settings → Domains |
| `analytics.framedle.wtf` | Umami | Resource → Settings → Domains |
| `errors.framedle.wtf` | GlitchTip | Resource → Settings → Domains |

- **HTTPS**: Automatic via Let's Encrypt (or Cloudflare origin certs when proxied through CF)
- **WebSocket**: Traefik handles WebSocket upgrade transparently for Duels
- **No Caddyfile or Nginx config** — Coolify generates Traefik labels on each deployment

### WebSocket for Duels (replacing Durable Objects)

Instead of Cloudflare Durable Objects, embed `ws` directly in the Hono API process:

```typescript
// apps/api/src/duel.ts
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });

// Match state stored in memory (per-match Map)
const matches = new Map<string, DuelMatch>();

// Upgrade HTTP → WebSocket on /api/duel/match/:id
server.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith('/api/duel/match/')) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  }
});
```

- Each Duel match lives in memory (~5 KB per match)
- 100 concurrent matches = ~500 KB RAM (negligible)
- Match state written to PostgreSQL on completion
- Cloudflare WebSocket proxying works transparently

**Limitation vs Durable Objects**: No automatic state persistence during crashes. If the VPS restarts mid-match, active Duels are lost. Acceptable for a game — matches last 2–3 minutes.

---

## Coolify Deployment Workflow

All services are managed through the Coolify dashboard. No manual `docker-compose.yml` needed — Coolify handles container orchestration, networking, and Traefik labels.

### Setup Order

```
1. Install Coolify on KVM2
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

2. Access dashboard at http://VPS_IP:8000 → set admin password

3. Add GitHub as source (Settings → Sources → GitHub App)

4. Deploy infrastructure services (one-click or custom Docker):
   a. PostgreSQL 16         → one-click database
   b. Valkey 8              → custom Docker (valkey/valkey:8-alpine)
   c. Logto                 → one-click service
   d. Umami                 → one-click service
   e. GlitchTip             → one-click service

5. Deploy application services (git push-to-deploy):
   a. Next.js app           → connect GitHub repo, set build command
   b. Hono API              → connect GitHub repo, set Dockerfile

6. Configure domains for each service in Coolify dashboard

7. Point DNS records (via Cloudflare) to VPS IP
```

### PostgreSQL Configuration

Coolify creates PostgreSQL via one-click, but you need custom tuning and multiple databases. After the initial deployment:

```sql
-- Run via Coolify's in-browser terminal or connect with psql
-- Create additional databases and users for services sharing the instance

CREATE USER logto WITH PASSWORD 'logto_pass';
CREATE USER umami WITH PASSWORD 'umami_pass';
CREATE USER glitchtip WITH PASSWORD 'glitchtip_pass';
CREATE USER framedle WITH PASSWORD 'framedle_pass';

CREATE DATABASE logto OWNER logto;
CREATE DATABASE umami OWNER umami;
CREATE DATABASE glitchtip OWNER glitchtip;
CREATE DATABASE framedle OWNER framedle;

\c framedle
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

Apply PostgreSQL tuning via Coolify's "Custom PostgreSQL Configuration" field:

```
shared_buffers=384MB
effective_cache_size=1GB
work_mem=32MB
maintenance_work_mem=128MB
max_connections=100
wal_buffers=16MB
random_page_cost=1.1
```

### Valkey Configuration

Valkey has no one-click template — deploy as a custom Docker service:

| Field | Value |
|-------|-------|
| Image | `valkey/valkey:8-alpine` |
| Start command | `valkey-server --maxmemory 256mb --maxmemory-policy allkeys-lru --appendonly yes --appendfsync everysec --save 900 1 --save 300 10` |
| Persistent storage | Mount volume at `/data` |

### Application Deployment

For each app service (Next.js, Hono API), connect the GitHub repo in Coolify:

| Setting | Next.js App | Hono API |
|---------|-------------|----------|
| Source | GitHub (Framedle repo) | GitHub (Framedle repo) |
| Build pack | Dockerfile | Dockerfile |
| Dockerfile path | `apps/web/Dockerfile` | `apps/api/Dockerfile` |
| Domain | `framedle.wtf` | `api.framedle.wtf` |
| Auto-deploy on push | Yes (main branch) | Yes (main branch) |

Environment variables for each service are set in Coolify's encrypted env var UI — never stored in files on the VPS.

### Docker Compose via Coolify (Alternative)

If you prefer a single compose file over individual services, Coolify supports **Docker Compose deployment mode**. Paste or connect a `docker-compose.yml` from the repo and Coolify will manage all containers, adding Traefik labels automatically:

```yaml
# docker-compose.coolify.yml — deployed via Coolify's compose mode
services:
  app:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://framedle:pass@postgres:5432/framedle
      - REDIS_URL=redis://valkey:6379
      - LOGTO_ENDPOINT=https://auth.framedle.wtf

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      - DATABASE_URL=postgresql://framedle:pass@postgres:5432/framedle
      - REDIS_URL=redis://valkey:6379
      - R2_ENDPOINT=${R2_ENDPOINT}
      - R2_ACCESS_KEY=${R2_ACCESS_KEY}
      - R2_SECRET_KEY=${R2_SECRET_KEY}

  # Strategy B only: self-hosted object storage
  # garage:
  #   image: dxflrs/garage:v1.0
  #   volumes:
  #     - garage_meta:/var/lib/garage/meta
  #     - garage_data:/var/lib/garage/data
  #     - ./garage.toml:/etc/garage.toml
```

> **Note**: Infrastructure services (PostgreSQL, Valkey, Logto, Umami, GlitchTip) are better deployed as individual Coolify resources — this gives you one-click backups, independent scaling, and per-service log access. Use compose mode only for your own app containers.

---

## VPS Capacity Limits

### CPU Bottleneck (the real constraint)

The 2 vCPU is the primary scaling limit. CPU-intensive operations:

| Operation | CPU Impact | Frequency |
|-----------|----------|-----------|
| Next.js SSR page render | High (~50–100ms) | Every uncached page load |
| PostgreSQL pg_trgm fuzzy search | Medium (~20–50ms) | Every guess (search-as-you-type) |
| Hono API request handling | Low (~5ms) | Every API call |
| Valkey commands | Negligible (<1ms) | Every game action |
| Logto JWT verification | Low (~2ms) | Every authenticated request |

### Estimated Peak Concurrent Users

| DAU | Peak Concurrent (est. 5%) | Requests/sec at Peak | VPS Can Handle? |
|-----|--------------------------|---------------------|-----------------|
| 500 | 25 | ~15 req/s | Yes |
| 1,000 | 50 | ~30 req/s | Yes |
| 3,000 | 150 | ~90 req/s | Tight — optimize SSR |
| 5,000 | 250 | ~150 req/s | At limit — need ISR/caching |
| 10,000 | 500 | ~300 req/s | **No** — upgrade VPS or offload |

### Optimization Strategies to Push the Ceiling

1. **Static Generation + ISR**: Pre-render game hub, leaderboard pages, share pages. Only the active game board needs SSR.
2. **API response caching**: Traefik middleware or Valkey cache for hot endpoints (daily game config, leaderboard top 100).
3. **Connection pooling**: PgBouncer in front of PostgreSQL to reduce connection overhead.
4. **Node.js clustering**: Run 2 Next.js workers (1 per vCPU core) via PM2 or Node cluster mode.

With these optimizations, the KVM2 can realistically serve **3,000–5,000 DAU**.

### Upgrade Path: KVM4

When the KVM2 is no longer enough:

| Spec | KVM2 | KVM4 |
|------|------|------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 8 GB | 16 GB |
| Storage | 100 GB | 200 GB |
| Bandwidth | 8 TB | 8 TB |
| Cost | ~$7–18/mo | ~$14–26/mo |
| Max DAU (est.) | 3,000–5,000 | 10,000–15,000 |

The KVM4 doubles capacity and gives room for PostgreSQL to use more shared memory. This is the natural next step before considering multi-server or cloud migration.

---

## VPS vs Cloud: Side-by-Side Cost

| DAU | VPS (Strategy A) | Cloud-Only | Savings |
|-----|-----------------|------------|---------|
| 500 | **$8** (VPS) | $1 (free tiers) | Cloud cheaper |
| 1,000 | **$8** | $7 | Similar |
| 3,000 | **$8** | $32 | **VPS saves $24/mo** |
| 5,000 | **$8** (at limit) | $32 | **VPS saves $24/mo** |
| 5,000+ | **$15** (KVM4) | $82 | **VPS saves $67/mo** |
| 10,000 | **$15** (KVM4) | $82 | **VPS saves $67/mo** |
| 20,000 | Need multi-server | $215 | Cloud easier at this scale |

### Key Insight

**The VPS is a fixed-cost play**: $8–18/mo whether you have 10 users or 5,000. This is superior to the cloud model at 1,000–10,000 DAU where cloud costs start climbing. Below 500 DAU, cloud free tiers win. Above 10,000–20,000 DAU, the VPS can't keep up without upgrading to multiple servers, and cloud auto-scaling becomes more cost-effective.

**Sweet spot for VPS**: 1,000–10,000 DAU (with KVM4 upgrade at ~5K).

---

## Comparing Auth: Logto vs Clerk at Scale

One of the biggest VPS wins is eliminating Clerk's per-user pricing:

| Registered Users | Clerk Cost | Logto Cost (VPS) | Annual Savings |
|-----------------|-----------|-----------------|---------------|
| 10,000 | $0 | $0 | $0 |
| 50,000 | $0 | $0 | $0 |
| 60,000 | $225/mo | $0 | **$2,700/yr** |
| 100,000 | $675/mo | $0 | **$8,100/yr** |
| 250,000 | $3,825/mo | $0 | **$45,900/yr** |

Logto self-hosted has **no user limits**. The auth cost curve that dominates the cloud strategy ($675/mo at 100K DAU) is completely eliminated.

---

## Content Pipeline on VPS

The content pipeline (yt-dlp + ffmpeg) is CPU-intensive. **Do not run it on the VPS** during production hours.

### Recommended: Keep on GitHub Actions

```yaml
# .github/workflows/extract-frames.yml
on:
  schedule:
    - cron: '0 4 * * *'  # 4 AM UTC daily (off-peak)

jobs:
  extract:
    runs-on: ubuntu-latest  # Free for public repos
    timeout-minutes: 300    # 5 hour limit
    steps:
      - uses: actions/checkout@v4
      - run: pip install -r pipeline/requirements.txt
      - run: sudo apt-get install -y ffmpeg
      - run: python pipeline/extract_batch.py
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
          R2_ACCESS_KEY: ${{ secrets.R2_ACCESS_KEY }}
          R2_SECRET_KEY: ${{ secrets.R2_SECRET_KEY }}
```

- Free for public repos (unlimited minutes)
- 6-hour execution limit is plenty
- Doesn't compete with game traffic for VPS CPU
- Pipeline writes to R2 (Strategy A) or VPS Garage (Strategy B)

### Alternative: VPS Off-Peak Cron

If you need private repos or want everything on VPS:

```bash
# Run pipeline at 3 AM local time when traffic is minimal
0 3 * * * cd /opt/framedle/pipeline && python extract_batch.py >> /var/log/framedle/pipeline.log 2>&1
```

This works but will spike CPU to 100% during processing. Use `nice -n 19` and `ionice -c3` to lower priority so the game server isn't affected.

---

## Backup Strategy

Coolify has **built-in scheduled database backups** to any S3-compatible storage. This replaces manual `pg_dump` scripts.

### Strategy A (R2 for media)

| Data | Method | Frequency |
|------|--------|-----------|
| PostgreSQL | **Coolify scheduled backup** → R2 or Backblaze B2 | Daily |
| Valkey | RDB snapshots (automatic) | Every 15 min |
| Docker volumes | Hostinger weekly backup (included) | Weekly |
| Frame images | Already in R2 (durable) | N/A |
| VPS config | Git repo (tracked in GitHub) | On change |

#### Coolify Database Backup Setup

1. Go to your PostgreSQL resource in Coolify
2. Navigate to **Backups** tab
3. Set schedule (e.g., `0 4 * * *` for 4 AM daily)
4. Configure S3 destination:
   - **Endpoint**: R2 or Backblaze B2 endpoint
   - **Bucket**: `framedle-backups`
   - **Access/Secret keys**: from your S3 provider
5. Set retention (e.g., keep last 30 backups)

Coolify handles `pg_dump`, compression, upload, and rotation automatically.

### Strategy B (Garage for media)

Everything above, plus:

| Data | Method | Frequency |
|------|--------|-----------|
| Garage media files | rsync to secondary storage or R2 | Daily |

This is why Strategy A is recommended — R2 handles media durability and backups are simplified.

---

## Migration Path: VPS → Cloud

If Framedle outgrows the VPS (>10K–20K DAU), migrate incrementally:

| Step | Trigger | Action |
|------|---------|--------|
| 1 | CPU consistently >80% | Upgrade KVM2 → KVM4 (Coolify migrates easily) |
| 2 | KVM4 at limit (~15K DAU) | Move API to Cloudflare Workers ($5/mo) |
| 3 | DB needs more compute | Move PostgreSQL to Neon Launch |
| 4 | Need global low latency | Move app to Cloudflare Pages |
| 5 | VPS only runs Logto + Valkey | Consider dropping VPS + Coolify entirely |

Each step is independent. You don't have to migrate everything at once. The open-source services (Logto, Valkey) use standard protocols and can run anywhere.

---

## Mermaid Diagrams

### Strategy A Deployment — Hybrid Architecture

```mermaid
flowchart TB
    subgraph GHA[GitHub Actions — Free for Public Repos]
        Pipeline[yt-dlp + ffmpeg<br/>Daily Cron 4 AM UTC]
    end

    subgraph CF[Cloudflare Free Tier]
        CDN[CDN + DNS + DDoS + SSL]
        R2[R2 Object Storage<br/>10 GB free · $0 egress<br/>Frames · Clips · Audio · OG images]
    end

    subgraph VPS[Hostinger KVM2 VPS — 2 vCPU / 8 GB / 100 GB NVMe]
        subgraph Coolify[Coolify PaaS — Dashboard + Traefik]
            Traefik[Traefik Reverse Proxy<br/>Auto HTTPS · Let's Encrypt]

            NextJS[Next.js :3000<br/>400 MB · SSR + Game UI]
            Hono[Hono API :4000<br/>200 MB · Game Logic + WS Duels]
            Logto[Logto :3301<br/>250 MB · SSO + JWT]
            Umami[Umami :3100<br/>250 MB · Analytics]
            GlitchTip[GlitchTip :8000<br/>400 MB · Error Tracking]

            PG[PostgreSQL 16 :5432<br/>1500 MB · shared_buffers=384MB]
            Valkey[Valkey :6379<br/>256 MB · Leaderboards + Cache]
        end
    end

    subgraph Backup[Backup Flow]
        PGBackup[Coolify Scheduled Backup<br/>pg_dump → R2 Daily]
        ValkeySnap[Valkey RDB Snapshots<br/>Every 15 min]
    end

    Internet((Internet)) -->|HTTPS| CDN
    CDN -->|Origin Pull| Traefik
    CDN <-->|Media Assets| R2

    Traefik --> NextJS
    Traefik --> Hono
    Traefik --> Logto
    Traefik --> Umami
    Traefik --> GlitchTip

    Hono --> PG
    Hono --> Valkey
    Hono -->|Signed URLs| R2
    Logto --> PG
    Umami --> PG
    GlitchTip --> PG
    GlitchTip --> Valkey

    Pipeline -->|Upload frames| R2
    Pipeline -->|Catalog metadata| Hono

    PG --> PGBackup
    Valkey --> ValkeySnap
    PGBackup -->|Store| R2
```

---

## Recommendation

**Start with Strategy A (Hybrid)**:
- Deploy everything on KVM2 VPS via **Coolify** (one-click services + git push-to-deploy)
- Use Cloudflare free tier for CDN/DNS/DDoS
- Use Cloudflare R2 free tier for media storage (10 GB, $0 egress)
- Use GitHub Actions for content pipeline
- Use Coolify's built-in CI/CD for application deployments
- Use Coolify's scheduled backups for PostgreSQL → R2
- **Total fixed cost: ~$8/mo** regardless of user count (up to ~3,000–5,000 DAU)
- Upgrade to KVM4 (~$15/mo) when you hit CPU limits
- Migrate individual services to cloud only when the VPS can't handle the load

This gives you a production-grade platform for **$8/mo** that would cost **$32–82/mo** on fully managed cloud services at equivalent scale. The open-source stack (Logto, Valkey, PostgreSQL, Umami, GlitchTip) has **zero per-user or per-request charges**, which means your costs are entirely predictable. Coolify provides the deployment ergonomics (push-to-deploy, dashboard, auto HTTPS, backups) that make self-hosting practical without DevOps overhead.
