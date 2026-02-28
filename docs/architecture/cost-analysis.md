# Cost Analysis — Free Tier to Scale

## TL;DR

| Scale (DAU) | Monthly Cost | Bottleneck Service | Action Required |
|-------------|-------------|-------------------|-----------------|
| 0–500 | **$0** | None (all free tiers) | None |
| 500–1,000 | **$0–5** | Upstash Redis (500K cmd/mo) | Upgrade Redis to pay-as-you-go |
| 1,000–3,000 | **$5–15** | CF Workers (100K req/day) | Upgrade to Workers Paid ($5/mo) |
| 3,000–10,000 | **$15–50** | Neon storage (0.5 GB) | Upgrade Neon to Launch plan |
| 10,000–50,000 | **$50–180** | Clerk (50K MRU) | Upgrade Clerk to Pro ($25/mo) |
| 50,000–100,000 | **$180–400** | Even scaling | All services on paid tiers |
| 100,000–1,000,000 | **$400–1,200** | Redis + Workers volume | Consider fixed Redis plan |

The architecture is designed to run entirely on free tiers through soft launch and early growth. The first dollar is spent around **500–1,000 DAU**, on Redis.

---

## Per-Game Resource Consumption

Every game session consumes resources across the stack. The table below estimates resource usage per completed game, averaged across all modes.

### API Requests (Cloudflare Workers)

| Action | Requests | Notes |
|--------|----------|-------|
| Load daily game | 1 | `GET /api/game/:mode/daily` |
| Frame/asset loads | 4–6 | Signed R2 URLs (served via CF CDN, but initial URL generation hits Worker) |
| Submit guesses | 2–6 | `POST /api/game/:mode/guess` (varies by mode) |
| Search-as-you-type | 3–8 | Debounced, ~3 chars avg before selection |
| Load result | 1 | After completion |
| Leaderboard check | 1–2 | View rank + surrounding players |
| **Total per game** | **~12–24** | **Average: ~15 requests** |

Additional per-session (not per-game) requests:

| Action | Requests | Frequency |
|--------|----------|-----------|
| Auth token verification | 0 | JWT verified at edge, no extra request |
| Profile load | 1 | Once per session |
| Mode hub | 1 | Once per session |
| **Session overhead** | **~2** | **Per visit** |

### R2 Storage Reads (Class B Operations)

| Asset | Reads/Game | Size (avg) |
|-------|-----------|------------|
| Frame images (WebP) | 3–6 | 40–80 KB each |
| Pixelated variants | 5 | 2–15 KB each |
| Clip (MP4) | 0–1 | 500 KB–2 MB |
| Audio (Opus) | 0–1 | 50–100 KB |
| OG share image | 0–1 | 100–200 KB |
| **Average per game** | **~5** | **~300 KB total** |

Note: After first load, CF CDN caches assets at edge. Subsequent reads for the same daily game are cache hits (free). Cache hit ratio estimated at **60–80%** for daily content.

### Database Queries (Neon PostgreSQL)

| Query | Count/Game | Compute Cost |
|-------|-----------|--------------|
| Load daily game + frames | 2 | Light (indexed lookup) |
| Fuzzy video search (pg_trgm) | 3–8 | Medium (GIN index scan) |
| Validate guess | 2–6 | Light |
| Write game result | 1 | Light (single INSERT) |
| Check daily lock | 1 | Light (unique constraint) |
| User stats update (XP, streak) | 1 | Light (single UPDATE) |
| **Average per game** | **~12** | **~50ms total CU time** |

### Redis Commands (Upstash)

| Command | Count/Game | Operation |
|---------|-----------|-----------|
| Check daily lock (SETNX) | 1 | Prevent replay |
| Write leaderboard score (ZADD) | 1–2 | Daily + weekly |
| Read rank (ZREVRANK) | 1 | User's rank |
| Read top players (ZREVRANGE) | 1 | Leaderboard view |
| Cache hit/miss | 1–2 | Search cache, game config |
| **Average per game** | **~6** | |

### Clerk

Clerk does not charge per API call. Cost is based on **Monthly Retained Users (MRU)** — users who have accounts. JWT verification at the edge is free and unlimited.

---

## User Behavior Model

| Metric | Value | Source |
|--------|-------|--------|
| Games per DAU per day | 2.5 | Assumption: flagship + 1-2 extra modes |
| Requests per game | 15 | Calculated above |
| Session overhead | 2 | Per visit |
| Sessions per day | 1.2 | Most users play once; some return |
| DAU/MAU ratio | 30% | Industry standard for casual games |
| Registration rate | 25% | 75% anonymous, 25% registered |
| Share rate | 15% | Of completed games |

### Per-DAU Daily Resource Consumption

| Resource | Formula | Per DAU/Day |
|----------|---------|-------------|
| Worker requests | 2.5 games × 15 req + 2 overhead | **~40 requests** |
| R2 reads (origin) | 2.5 games × 5 reads × 30% miss rate | **~4 reads** (rest from CDN cache) |
| Neon queries | 2.5 games × 12 queries | **~30 queries** |
| Neon CU time | 2.5 games × 50ms | **~125ms** |
| Redis commands | 2.5 games × 6 cmds | **~15 commands** |

---

## Free Tier Ceilings

### Service-by-Service Limits

| Service | Free Tier Limit | Per-DAU Usage | Max DAU Supported | Bottleneck Rank |
|---------|----------------|---------------|-------------------|-----------------|
| **Upstash Redis** | 500K cmds/month | 15 cmds/day × 30 = 450/mo | **~1,100 DAU** | **#1** |
| **CF Workers** | 100K req/day | 40 req/day | **~2,500 DAU** | **#2** |
| **Neon Compute** | 100 CU-hours/month | See analysis below | **~3,000 DAU** | **#3** |
| **Neon Storage** | 0.5 GB | See analysis below | **~5,000 DAU** | **#4** |
| **R2 Class B** | 10M reads/month | 4 reads/day × 30 = 120/mo | **~83,000 DAU** | #7 |
| **R2 Storage** | 10 GB | ~3 MB/video | **~3,300 videos** | Content-dependent |
| **R2 Class A** | 1M writes/month | Pipeline only | **~66K videos/mo** | Non-issue |
| **Clerk** | 50K MRU | 25% of MAU register | **~60K DAU** | #6 |
| **Vercel** | 100 GB bandwidth/mo | ~1 MB/session × 1.2 | **~83K sessions** | #5 (if used) |
| **GitHub Actions** | 2,000 min/month | ~10 min/run × 1/day | **~300 min/mo** | Non-issue |
| **PostHog** | 1M events/month | ~10 events/session | **~83K sessions** | Non-issue |
| **Sentry** | 5K errors/month | ~0.5% error rate | OK to ~30K DAU | Non-issue |

### Neon Compute Analysis

Neon's free tier gives 100 CU-hours/month with autosuspend after 5 minutes of inactivity.

- **Low traffic** (<500 DAU): DB is idle most of the time. Active maybe 8–12 hours/day during peak. At 0.25 CU base: `0.25 × 10h × 30d = 75 CU-hours`. Well within free tier.
- **Medium traffic** (500–2,000 DAU): DB stays warm during waking hours (~16h). `0.25 × 16h × 30d = 120 CU-hours`. Exceeds free tier.
- **Steady traffic** (2,000+ DAU): DB is essentially always on. `0.25 × 24h × 30d = 180 CU-hours`. Significantly over.

**Effective free ceiling**: ~500–1,000 DAU (depending on traffic distribution).

### Neon Storage Analysis

| Data | Size Estimate |
|------|--------------|
| 500 videos + frames metadata | ~30 MB |
| 1,000 game results | ~1 MB |
| 10,000 game results | ~10 MB |
| 100,000 game results | ~100 MB |
| Users table (1,000 rows) | ~1 MB |
| Users table (10,000 rows) | ~10 MB |
| Indexes + overhead | ~30% of data |
| **Total at 5K DAU (~1.5K MAU)** | **~200 MB** |
| **Total at 20K DAU (~6K MAU)** | **~450 MB** |

Storage hits 0.5 GB around **15,000–20,000 cumulative users** (not DAU). With old game results accumulating, this could happen sooner. At 3,000 DAU (~1,000 MAU), storage is safe for several months.

---

## Migration Triggers & Actions

### Trigger #1: Upstash Redis — ~500-1,000 DAU

**When**: ~500K Redis commands/month consumed.

**Action**: Switch to Upstash **Pay-As-You-Go**.

| Metric | Free | Pay-As-You-Go |
|--------|------|---------------|
| Commands | 500K/month | Unlimited |
| Cost | $0 | $0.20 per 100K commands |
| Storage | 256 MB | $0.25/GB |

**Cost at trigger point**:
- 1,000 DAU × 15 cmds × 30 days = 450K cmds/mo → **~$0.90/mo**
- 5,000 DAU × 15 cmds × 30 days = 2.25M cmds/mo → **~$4.50/mo**
- 10,000 DAU × 15 cmds × 30 days = 4.5M cmds/mo → **~$9.00/mo**

**When to consider Fixed plan** ($10/mo for 250MB + unlimited commands): When monthly pay-as-you-go exceeds $10 (~5M commands/month, ~11,000 DAU).

---

### Trigger #2: Cloudflare Workers — ~2,500 DAU

**When**: Hitting 100K requests/day regularly.

**Action**: Upgrade to **Workers Paid** ($5/month flat fee).

| Metric | Free | Paid ($5/mo) |
|--------|------|-------------|
| Requests | 100K/day | 10M/month included |
| CPU time | 10ms/invocation | 30M ms/month included |
| Overage | N/A | $0.30/million requests |

**Cost at trigger point**:
- 2,500 DAU × 40 req × 30 days = 3M req/mo → **$5.00/mo** (within included 10M)
- 10,000 DAU × 40 req × 30 days = 12M req/mo → **$5.60/mo** ($5 + 2M × $0.30)
- 50,000 DAU × 40 req × 30 days = 60M req/mo → **$20.00/mo** ($5 + 50M × $0.30)

The $5/mo Workers Paid plan also unlocks:
- Durable Objects (needed for Duels in Phase 3)
- Higher CPU time limits (30s vs 10ms)
- KV storage
- Cron triggers

**Recommendation**: Upgrade to Workers Paid at Phase 1 launch regardless of traffic. The $5/mo unlocks critical capabilities for future phases.

---

### Trigger #3: Neon PostgreSQL — ~1,000–3,000 DAU

**When**: CU-hours exceed 100/month (DB staying warm >13h/day) OR storage approaching 0.5 GB.

**Action**: Upgrade to **Neon Launch** (usage-based, no minimum).

| Metric | Free | Launch |
|--------|------|--------|
| Compute | 100 CU-hours/mo | $0.106/CU-hour |
| Storage | 0.5 GB | $0.35/GB-month |
| Branches | 10 | 10 included, then $0.002/branch-hour |
| Max CU | 2 (8 GB RAM) | 16 (64 GB RAM) |

**Cost at trigger point**:
- 3,000 DAU: DB active ~18h/day at 0.25 CU → `0.25 × 18 × 30 = 135 CU-hours` + 300 MB storage
  - Compute: 135 × $0.106 = **$14.31**
  - Storage: 0.3 × $0.35 = **$0.11**
  - **Total: ~$15/mo**
- 10,000 DAU: DB active ~22h/day at 0.5 CU → `0.5 × 22 × 30 = 330 CU-hours` + 800 MB
  - Compute: 330 × $0.106 = **$34.98**
  - Storage: 0.8 × $0.35 = **$0.28**
  - **Total: ~$35/mo**
- 50,000 DAU: DB active 24/7 at 2 CU → `2 × 24 × 30 = 1,440 CU-hours` + 3 GB
  - Compute: 1,440 × $0.106 = **$152.64**
  - Storage: 3 × $0.35 = **$1.05**
  - **Total: ~$154/mo**

---

### Trigger #4: Clerk — ~60,000 DAU

**When**: Registered users exceed 50,000 MRU.

**Action**: Upgrade to **Clerk Pro** ($25/month).

| Metric | Free | Pro ($25/mo) |
|--------|------|-------------|
| MRU included | 50,000 | 50,000 |
| Overage | N/A | $0.02/MRU (50K–100K) |
| MFA | No | Yes |
| Branding | Clerk branding | Remove branding |

**Cost at trigger point**:

Since only ~25% of users register, Clerk's 50K MRU supports a large DAU:

| DAU | MAU (×3.3) | Registered (×25%) | Clerk Cost |
|-----|-----------|-------------------|------------|
| 5,000 | 16,500 | 4,125 | $0 |
| 15,000 | 49,500 | 12,375 | $0 |
| 50,000 | 165,000 | 41,250 | $0 |
| 60,000 | 198,000 | 49,500 | $0 (just under) |
| 75,000 | 247,500 | 61,875 | $25 + 11,875 × $0.02 = **$262** |
| 100,000 | 330,000 | 82,500 | $25 + 32,500 × $0.02 = **$675** |

**Recommendation**: Clerk stays free for a long time due to anonymous-first design. Consider upgrading to Pro earlier ($25/mo) for MFA and removing Clerk branding when the product matures.

---

### Trigger #5: Cloudflare R2 — Content Volume

R2's free tier is generous. The bottleneck is **storage**, not reads.

| Content Volume | Storage Used | R2 Cost |
|----------------|-------------|---------|
| 500 videos (~3 MB each) | 1.5 GB | $0 |
| 1,000 videos | 3 GB | $0 |
| 3,000 videos | 9 GB | $0 (just under 10 GB) |
| 5,000 videos | 15 GB | 5 GB × $0.015 = **$0.08/mo** |
| 10,000 videos | 30 GB | 20 GB × $0.015 = **$0.30/mo** |

Class B reads with CDN caching:

| DAU | Origin Reads/Month | Cost |
|-----|-------------------|------|
| 5,000 | 600K | $0 |
| 50,000 | 6M | $0 |
| 100,000 | 12M | 2M × $0.36/M = **$0.72/mo** |
| 500,000 | 60M | 50M × $0.36/M = **$18.00/mo** |

R2 is essentially free until massive scale, thanks to $0 egress.

---

### Trigger #6: Vercel — Commercial Use

**Important**: Vercel's Hobby tier is **non-commercial only**. If Framedle generates revenue or is used commercially, Vercel Pro ($20/user/month) is required.

**Alternative**: Deploy to **Cloudflare Pages** (free, no commercial restriction, native R2/Workers integration). This saves $20/mo and simplifies the stack.

**Recommendation**: Use Cloudflare Pages instead of Vercel from day one. The entire backend is already on Cloudflare — keeping the frontend there too eliminates a vendor and a cost trigger.

---

### Trigger #7: Durable Objects — Phase 3 (Duels)

Durable Objects are included in the Workers Paid plan ($5/mo).

| Metric | Included (Paid Plan) | Overage |
|--------|---------------------|---------|
| Requests | 1M/month | $0.15/million |
| Duration | 400K GB-s/month | $12.50/million GB-s |
| SQLite reads | 25B rows/month | $0.001/million rows |
| SQLite writes | 50M rows/month | $1.00/million rows |

**Cost estimation for Duels**:

Each Duel match (best-of-5, 2 players):
- ~50 WebSocket messages (requests) per match
- ~120 seconds active duration at 128MB → `120 × 0.128 = 15.36 GB-s`
- ~20 row reads, ~10 row writes

| Concurrent Duel Players | Matches/Day | Monthly Cost |
|-------------------------|-------------|--------------|
| 100 (~50 matches) | 1,500 | $0 (within included) |
| 1,000 (~500 matches) | 15,000 | $0 (within included) |
| 10,000 (~5,000 matches) | 150,000 | ~$2/mo |

Duels are very cost-efficient on Durable Objects.

---

## Phase-by-Phase Cost Projection

### Phase 0: Foundation (Weeks 1–3) — Development Only

| Service | Tier | Cost |
|---------|------|------|
| All services | Free tiers | $0 |
| Domain (framedle.gg) | Registration | ~$12/year ($1/mo) |
| **Monthly total** | | **~$1** |

No users, just development and content pipeline seeding.

---

### Phase 1: MVP Launch (Weeks 4–8) — 0 to 1,000 DAU

| Service | Tier | Estimated Usage | Cost |
|---------|------|----------------|------|
| CF Workers | **Paid** ($5/mo) | 40K–1.2M req/mo | $5.00 |
| CF R2 | Free | 500 videos, ~2M reads | $0 |
| Neon | Free | <100 CU-hours, <0.3 GB | $0 |
| Upstash Redis | Pay-as-you-go | ~450K cmds/mo | $0.90 |
| Clerk | Free | <5K MRU | $0 |
| CF Pages | Free | Hosting + CDN | $0 |
| PostHog | Free | <100K events | $0 |
| Sentry | Free (Developer) | <1K errors | $0 |
| GitHub Actions | Free | ~300 min/mo | $0 |
| Domain | — | — | $1.00 |
| **Monthly total** | | | **~$7** |

**Upgrade Workers Paid from day one** — $5/mo unlocks higher CPU limits, cron triggers, and Durable Objects (needed for Phase 3). Worth it even at 0 DAU.

---

### Phase 2: Extended Modes (Weeks 10–14) — 1,000 to 5,000 DAU

| Service | Tier | Estimated Usage | Cost |
|---------|------|----------------|------|
| CF Workers | Paid | ~6M req/mo | $5.00 |
| CF R2 | Free | 1,000 videos, ~3M reads | $0 |
| Neon | **Launch** | ~200 CU-hours, 0.4 GB | $21.34 |
| Upstash Redis | Pay-as-you-go | ~2.25M cmds/mo | $4.50 |
| Clerk | Free | ~15K MRU | $0 |
| CF Pages | Free | | $0 |
| PostHog | Free | ~500K events | $0 |
| Sentry | Free | ~2K errors | $0 |
| GitHub Actions | Free | ~300 min/mo | $0 |
| Domain | — | | $1.00 |
| **Monthly total** | | | **~$32** |

Neon becomes the largest cost as the DB stays warm during active hours.

---

### Phase 3: Multiplayer + Mobile (Weeks 16–21) — 5,000 to 20,000 DAU

| Service | Tier | Estimated Usage | Cost |
|---------|------|----------------|------|
| CF Workers | Paid | ~24M req/mo | $9.20 |
| CF Durable Objects | Paid (incl.) | ~5K matches/day | $0 (within included) |
| CF R2 | Mostly free | 2,000 videos, ~8M reads | $0 |
| Neon | Launch | ~500 CU-hours, 1.2 GB | $53.42 |
| Upstash Redis | Pay-as-you-go | ~9M cmds/mo | $18.00 |
| Clerk | Free | ~25K MRU | $0 |
| CF Pages | Free | | $0 |
| PostHog | Free | ~900K events | $0 |
| Sentry | Free | ~4K errors | $0 |
| GitHub Actions | Free | ~400 min/mo | $0 |
| Domain | — | | $1.00 |
| **Monthly total** | | | **~$82** |

At this point consider switching Upstash to a **Fixed plan** ($10/mo for unlimited commands + 250MB) to cap Redis costs.

---

### Phase 4: Growth (Weeks 23–28) — 20,000 to 50,000 DAU

| Service | Tier | Estimated Usage | Cost |
|---------|------|----------------|------|
| CF Workers | Paid | ~60M req/mo | $20.00 |
| CF Durable Objects | Paid | ~15K matches/day | ~$2.00 |
| CF R2 | Slight overage | 3,000 videos, ~20M reads | $1.50 |
| Neon | Launch | ~1,200 CU-hours, 2.5 GB | $128.08 |
| Upstash Redis | **Fixed ($10/mo)** | ~22.5M cmds/mo | $10.00 |
| Clerk | Free → **Pro** | ~40K MRU (approaching 50K) | $0–25.00 |
| CF Pages | Free | | $0 |
| PostHog | Slight overage | ~2M events | $0.05 |
| Sentry | **Team ($26/mo)** | ~10K errors, team access | $26.00 |
| GitHub Actions | Free | ~500 min/mo | $0 |
| Domain | — | | $1.00 |
| **Monthly total** | | | **~$190–215** |

---

### Post-Launch Scale — 100,000 DAU

| Service | Tier | Cost |
|---------|------|------|
| CF Workers | Paid | $35.00 |
| CF Durable Objects | Paid | ~$5.00 |
| CF R2 | Paid | ~$3.00 |
| Neon | Launch (autoscale to 4 CU) | ~$310.00 |
| Upstash Redis | Fixed ($30/mo, 1GB) | $30.00 |
| Clerk | Pro | ~$675.00 |
| CF Pages | Free | $0 |
| PostHog | Paid | ~$15.00 |
| Sentry | Team | $26.00 |
| GitHub Actions | Free | $0 |
| Domain | — | $1.00 |
| **Monthly total** | | **~$1,100** |

At 100K DAU, **Clerk becomes the dominant cost** (~60% of total). At this scale, evaluate:
- Reducing registration push (keep more users anonymous)
- Migrating to self-hosted auth (Lucia, Auth.js) — saves $675/mo but costs dev time
- Negotiating enterprise pricing with Clerk

---

### Post-Launch Scale — 1,000,000 DAU

| Service | Cost | % of Total |
|---------|------|-----------|
| CF Workers | $155 | 4% |
| CF Durable Objects | $50 | 1% |
| CF R2 | $25 | 1% |
| Neon (**Scale plan**, 8 CU 24/7) | $1,250 | 32% |
| Upstash Redis (Fixed $100, 10GB) | $100 | 3% |
| Clerk (Pro, ~82K MRU) | $675 | 17% |
| Clerk (Pro, scaled to 250K MRU) | $3,825 | — |
| CF Pages | $0 | 0% |
| PostHog | $150 | 4% |
| Sentry (Business) | $80 | 2% |
| **Monthly total (25% reg rate)** | **~$2,485** | |
| **Monthly total (if 75% register)** | **~$6,100** | |

At 1M DAU, database and auth dominate. Key decisions:
- **Self-host auth**: Switch to Lucia/Auth.js to eliminate Clerk ($675–$3,800/mo savings)
- **Neon Scale plan**: Required for higher CU caps and production features (SOC2, HIPAA)
- **Dedicated Redis**: Consider self-managed Redis on Fly.io or Railway (~$25/mo vs $100)

---

## Cost Optimization Strategies

### 1. Aggressive CDN Caching (Day 1)

Daily game content is identical for all users. Set long cache TTLs:

```
Frame images:     Cache-Control: public, max-age=86400 (24h)
Game config:      Cache-Control: public, max-age=3600 (1h, versioned)
Leaderboard:      Cache-Control: public, max-age=60 (1min)
Static assets:    Cache-Control: public, max-age=31536000, immutable
```

**Impact**: Reduces R2 origin reads by 60–80%, Worker CPU by caching responses at edge.

### 2. Cloudflare Pages Over Vercel (Day 1)

Eliminates Vercel Pro requirement ($20/mo) and stays within the Cloudflare ecosystem. CF Pages has no commercial-use restriction on the free tier.

**Impact**: Saves $20/mo immediately, $240/year.

### 3. Anonymous-First Design (Day 1)

Every anonymous user who plays without registering is a user Clerk never charges for. The 75% anonymous target directly controls auth costs.

| Registration Rate | Clerk Cost at 100K DAU |
|-------------------|----------------------|
| 25% (target) | $675/mo |
| 50% | $1,325/mo |
| 75% | $1,975/mo |

**Impact**: 25% vs 50% registration saves $650/mo at 100K DAU.

### 4. Redis Command Batching (Phase 2)

Use Redis pipelines to batch leaderboard operations:

```
PIPELINE:
  ZADD lb:daily-frame:2026-02-22 1000 "user_abc"
  ZADD lb:daily-frame:week:2026-W08 1000 "user_abc"
  ZREVRANK lb:daily-frame:2026-02-22 "user_abc"
EXEC
```

3 commands → 1 command (pipelines count as 1).

**Impact**: Reduces Redis commands by ~40%, extending free tier and reducing pay-as-you-go costs.

### 5. Neon Scale-to-Zero Tuning

On the free/launch tier, the 5-minute autosuspend timer means the DB wakes frequently during active hours. If traffic is bursty:
- Morning spike → DB wakes → 5min idle → sleeps → next request wakes it again
- Each wake cycle costs ~1 CU-second for cold start

For low-traffic phases, this is fine. For 5K+ DAU, the DB stays warm naturally and scale-to-zero just works during nighttime.

### 6. Evaluate Self-Hosted Auth at 50K+ MRU (Phase 4)

When Clerk costs exceed ~$500/mo, evaluate migrating to:
- **Lucia Auth** (open source, zero cost, runs on CF Workers)
- **Auth.js** (NextAuth successor, self-hosted)
- **Supabase Auth** (free for 50K MAU, $25/mo for 100K)

Migration cost: ~2–3 weeks of dev time. Break-even: ~4 months at $500/mo savings.

---

## Summary: When to Upgrade Each Service

```
DAU Scale:    0      500     1K      3K      5K     10K     20K     50K    100K
              │       │       │       │       │       │       │       │       │
Redis:        ├─FREE──┤──PAY-AS-YOU-GO ($1–9/mo)──────┤──FIXED $10+──────────┤
              │       │       │       │       │       │       │       │       │
Workers:      ├─FREE──────────┤──PAID $5/mo ($5–20/mo)───────────────────────┤
              │  (upgrade at  │       │       │       │       │       │       │
              │  Phase 1 for  │       │       │       │       │       │       │
              │  capabilities)│       │       │       │       │       │       │
              │       │       │       │       │       │       │       │       │
Neon:         ├─FREE──────────────────┤──LAUNCH ($15–150/mo)─────────┤─SCALE─┤
              │       │       │       │       │       │       │       │       │
Clerk:        ├─FREE (50K MRU)────────────────────────────────┤──PRO $25+───┤
              │       │       │       │       │       │       │       │       │
R2:           ├─FREE──────────────────────────────────────────────────┤─PAID─┤
              │       │       │       │       │       │       │       │       │
Sentry:       ├─DEV (FREE)───────────────────────────┤──TEAM $26/mo─────────┤
              │       │       │       │       │       │       │       │       │
PostHog:      ├─FREE──────────────────────────────────────────┤──PAID───────┤
```

### Monthly Cost Curve

```
$1,200 ┤                                                              ╭
       │                                                           ╭──╯
$1,000 ┤                                                        ╭──╯
       │                                                     ╭──╯
  $800 ┤                                                  ╭──╯
       │                                               ╭──╯
  $600 ┤                                            ╭──╯
       │                                         ╭──╯
  $400 ┤                                      ╭──╯
       │                                ╭─────╯
  $200 ┤                          ╭─────╯
       │                    ╭─────╯
  $100 ┤              ╭────╯
       │         ╭────╯
   $30 ┤    ╭────╯
       │╭───╯
    $7 ├╯
    $0 ┼─────┬──────┬──────┬───────┬───────┬───────┬────────┬───────
         500   1K     3K     5K     10K     20K     50K     100K  DAU
```

---

## Key Takeaways

1. **$0 through soft launch**: All free tiers cover development and early testing with real users (up to ~500 DAU).

2. **First $5 is strategic**: Upgrade CF Workers Paid at Phase 1 launch. It unlocks Durable Objects, higher CPU limits, and cron triggers needed in later phases.

3. **First real cost at ~1K DAU is ~$7/mo**: Redis pay-as-you-go + Workers Paid. Extremely affordable for a growing product.

4. **$100/mo ceiling holds to ~20K DAU**: The edge-first serverless architecture with aggressive caching keeps costs remarkably low through significant growth.

5. **Clerk is the long-term cost driver**: At 100K+ DAU, auth becomes 60%+ of total cost. Plan for self-hosted auth migration if costs become prohibitive.

6. **R2's $0 egress is the architectural advantage**: An image-heavy game serving millions of frames would cost 10–50x more on AWS S3 ($0.09/GB egress). R2 makes this architecture viable.

7. **Total cost at 100K DAU: ~$1,100/mo**. For a game serving 100,000 daily active users across 12 modes with real-time multiplayer, leaderboards, and multi-platform apps, this is exceptionally cost-efficient.
