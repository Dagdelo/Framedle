# Framedle

> One frame. One guess. Can you name the video?

**Framedle** is a multi-platform daily guessing game built around YouTube video frames. Using heatmap data from YouTube's "most replayed" feature, we extract the most iconic moments from videos and turn them into puzzles across 12 game modes.

Think **Wordle meets YouTube** — daily challenges, leaderboards, streaks, and shareable results.

## Game Modes

| | Mode | Mechanic |
|-|------|----------|
| 🖼️ | **Daily Frame** | Progressive reveal, 6 guesses (flagship Wordle-style) |
| 🎬 | **Clip Guesser** | 2-3s silent clip, name the video |
| 📺 | **Channel Check** | 5 frames from one channel, name the YouTuber |
| 📅 | **Year Guesser** | Full frame, guess the upload year |
| 🔢 | **View Count Blitz** | Thumbnail + title, guess the view count range |
| ⏱️ | **Timeline Sort** | Drag-and-drop 5 frames in chronological order |
| 🔍 | **Pixel Reveal** | 8x8 → full resolution progressive reveal |
| 🏷️ | **Category Clash** | Quick-fire categorization (10s per round) |
| 🔥 | **Streak Mode** | Endless multiple-choice, difficulty climbs |
| ⚔️ | **Duels** | Real-time 1v1, fastest correct guess wins |
| 🧩 | **Fragment Match** | Match 4 cropped pieces to 4 full frames |
| 🎵 | **Sound Only** | Audio-only clip, no visuals |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  CLIENTS: Web (Next.js) / Desktop+Mobile (Tauri v2) │
│           Shared React 19 + TypeScript UI            │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────┴──────────────────────────────┐
│  EDGE: Hono on Cloudflare Workers (300+ PoPs)        │
│  Auth: Clerk | Cache: Upstash Redis                  │
│  Realtime: Durable Objects (Duels)                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│  DATA: Neon PostgreSQL | Cloudflare R2 (images)      │
│  PIPELINE: GitHub Actions + yt-dlp + ffmpeg          │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, Framer Motion |
| State | XState v5 (game), Zustand (UI) |
| Desktop/Mobile | Tauri v2 (Win/Mac/Linux/iOS/Android) |
| Web | Next.js 15 (App Router, SSR) |
| API | Hono on Cloudflare Workers |
| Auth | Clerk (Google, Discord, Apple, GitHub, X, email) |
| Database | Neon PostgreSQL + Drizzle ORM |
| Storage | Cloudflare R2 ($0 egress) |
| Cache | Upstash Redis (leaderboards, sessions) |
| Realtime | Cloudflare Durable Objects (Duels) |
| Pipeline | GitHub Actions + yt-dlp + ffmpeg |
| Monorepo | Turborepo + pnpm |

## Documentation

### Game Design

| Document | Description |
|----------|-------------|
| [Project Overview](docs/project-overview.md) | Vision, goals, target audience, success metrics |
| [Game Modes](docs/game-design/game-modes.md) | All 12 modes with detailed mechanics and scoring |
| [Game Mechanics](docs/game-design/game-mechanics.md) | FScore, XP, streaks, achievements, leaderboards, sharing |

### Architecture

| Document | Description |
|----------|-------------|
| [System Architecture](docs/architecture/system-architecture.md) | Full system design, API endpoints, data flow |
| [Tech Stack](docs/architecture/tech-stack.md) | Technology choices with justification and costs |
| [Database Schema](docs/architecture/database-schema.md) | Complete PostgreSQL schema (10 tables) |
| [Cost Analysis](docs/architecture/cost-analysis.md) | Free tier ceilings, migration triggers, cost at scale |
| [VPS Deployment](docs/architecture/vps-deployment.md) | Hostinger KVM2 self-hosted stack, open-source alternatives |

### Architectural Decision Records

| ADR | Decision |
|-----|----------|
| [001 — App Framework](docs/adr/001-tauri-over-electron.md) | Tauri v2 over Electron (10x smaller, mobile support) |
| [002 — Auth Provider](docs/adr/002-auth-provider.md) | Clerk (SSO + anonymous, edge JWT, 10K MAU free) |
| [003 — Object Storage](docs/adr/003-storage-r2.md) | Cloudflare R2 ($0 egress, native CF Workers binding) |
| [004 — API Framework](docs/adr/004-api-framework.md) | Hono on CF Workers (<1ms cold start, typed client) |
| [005 — Game Engine](docs/adr/005-game-engine-architecture.md) | Server-authoritative + optimistic UI |
| [006 — Realtime](docs/adr/006-realtime-versus.md) | CF Durable Objects (per-match WebSocket isolation) |
| [007 — Pipeline](docs/adr/007-content-pipeline.md) | GitHub Actions + yt-dlp + ffmpeg (6h limit, free) |
| [008 — Anonymous Identity](docs/adr/008-anonymous-identity.md) | Device fingerprinting (hashed, anti-abuse) |
| [009 — Leaderboards](docs/adr/009-leaderboard-architecture.md) | Redis sorted sets (O(log N) rank ops, ELO for Duels) |

### Project Management

| Document | Description |
|----------|-------------|
| [Roadmap](docs/project-management/roadmap.md) | 28-week phased delivery plan with risk analysis |
| [Linear Issues](docs/project-management/linear-issues.md) | 50 issues, 226 story points, dependency graph |

## Project Structure

```
framedle/
├── docs/                          # All documentation (you are here)
│   ├── project-overview.md
│   ├── game-design/
│   │   ├── game-modes.md
│   │   └── game-mechanics.md
│   ├── architecture/
│   │   ├── system-architecture.md
│   │   ├── tech-stack.md
│   │   ├── database-schema.md
│   │   ├── cost-analysis.md
│   │   └── vps-deployment.md
│   ├── adr/
│   │   ├── 001-tauri-over-electron.md
│   │   ├── 002-auth-provider.md
│   │   ├── 003-storage-r2.md
│   │   ├── 004-api-framework.md
│   │   ├── 005-game-engine-architecture.md
│   │   ├── 006-realtime-versus.md
│   │   ├── 007-content-pipeline.md
│   │   ├── 008-anonymous-identity.md
│   │   └── 009-leaderboard-architecture.md
│   └── project-management/
│       ├── roadmap.md
│       └── linear-issues.md
├── pipeline/                      # Content extraction pipeline
│   ├── extract_frames.py
│   ├── extract_batch.py
│   ├── extract-frames.yml
│   ├── requirements.txt
│   ├── schema.sql
│   └── videos.json
└── README.md
```

## Quick Start (Pipeline)

```bash
# Install dependencies
cd pipeline
pip install -r requirements.txt
sudo apt-get install ffmpeg

# Configure environment
export DATABASE_URL="postgresql://..."
export R2_ENDPOINT="https://..."
export R2_ACCESS_KEY="..."
export R2_SECRET_KEY="..."

# Process videos
python extract_batch.py
```

## Timeline

- **Phase 0** (Weeks 1-3): Foundation — monorepo, infra, pipeline, design system
- **Phase 1** (Weeks 4-8): MVP — web app, Daily Frame, leaderboard, sharing
- **Phase 2** (Weeks 10-14): Extended — 5 more modes, XP, achievements
- **Phase 3** (Weeks 16-21): Multiplayer — Duels, desktop, mobile apps
- **Phase 4** (Weeks 23-28): Growth — final modes, i18n, scale, public launch

**Team**: 2-3 developers | **Total**: 226 story points | **Duration**: ~28 weeks

## License

MIT
