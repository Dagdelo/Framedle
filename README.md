# 🎬 Framedle — The YouTube Guessing Game

> *"One frame. One guess. Can you name the video?"*

**Framedle** is a daily guessing game built around YouTube video frames. Think Wordle meets YouTube — players see carefully selected frames from the most replayed moments of YouTube videos and must guess the video, channel, year, or category. Multiple game modes, daily challenges, leaderboards, and social sharing make it addictive and shareable.

## 🎮 Game Concept

Every day, our backend pipeline uses **yt-dlp heatmap data** to extract the most-replayed moments from curated YouTube videos. These "peak moments" become the basis for multiple game modes where players test their YouTube knowledge.

The heatmap ensures we always pick the most **iconic, recognizable frames** — not random boring shots.

## 🕹️ Game Modes

### Core Daily Modes
| Mode | Description | Difficulty |
|------|-------------|------------|
| 🖼️ **Daily Frame** | Wordle-style — guess the video from progressively revealed frames | ⭐⭐⭐ |
| 🎬 **Clip Guesser** | 2-second clip from a peak moment, guess the video | ⭐⭐ |
| 📺 **Channel Check** | 5 frames from one channel — name the YouTuber | ⭐⭐ |
| 📅 **Year Guesser** | See a frame, guess the upload year | ⭐⭐⭐ |

### Extended Modes
| Mode | Description |
|------|-------------|
| 🔢 **View Count Blitz** | Thumbnail + title → guess the view count range |
| ⏱️ **Timeline Sort** | Order 5 frames chronologically within a video |
| 🔍 **Pixel Reveal** | Frame starts pixelated, progressively sharpens |
| 🏷️ **Category Clash** | Frame shown — Gaming, Music, Education, or Vlogs? |
| 🔥 **Streak Mode** | Endless — how many correct in a row? |
| ⚔️ **Duels** | Real-time 1v1 — same frame, fastest correct guess |
| 🧩 **Fragment Match** | Match 4 cropped fragments to their full frames |
| 🎵 **Sound Only** | Audio from peak moment — guess the video (no visual) |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│  CLIENTS: Web (Next.js) / Desktop+Mobile (Tauri v2) │
│           Shared React UI + Game Engine              │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────┴──────────────────────────────┐
│  API: Hono on Cloudflare Workers                     │
│  Auth: Clerk | Cache: Upstash Redis                  │
│  Realtime: CF Durable Objects (Duels)                │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│  DATA: Neon (PostgreSQL) | Cloudflare R2 (Images)    │
│  PIPELINE: GitHub Actions + yt-dlp + ffmpeg          │
└─────────────────────────────────────────────────────┘
```

## 📁 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design, components, data flow |
| [Game Modes](docs/game-design/GAME_MODES.md) | Detailed game mechanics |
| [Scoring & Progression](docs/game-design/SCORING.md) | Points, streaks, XP, leaderboards |
| [Roadmap](docs/ROADMAP.md) | Phased delivery plan |
| [Linear Issues](docs/LINEAR_ISSUES.md) | Project issues ready to import |
| [Database Schema](docs/DATABASE_SCHEMA.md) | Full PostgreSQL schema |
| [ADR-001](docs/adr/ADR-001-app-framework.md) | Tauri v2 vs Electron |
| [ADR-002](docs/adr/ADR-002-auth-provider.md) | Clerk as auth provider |
| [ADR-003](docs/adr/ADR-003-object-storage.md) | Cloudflare R2 for images |
| [ADR-004](docs/adr/ADR-004-api-layer.md) | Hono on CF Workers |
| [ADR-005](docs/adr/ADR-005-game-state.md) | State management & anti-cheat |
| [ADR-006](docs/adr/ADR-006-realtime.md) | Durable Objects for Duels |
| [ADR-007](docs/adr/ADR-007-content-pipeline.md) | yt-dlp extraction pipeline |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind + Framer Motion |
| Desktop/Mobile | Tauri v2 |
| Web | Next.js 15 (App Router) |
| API | Hono on Cloudflare Workers |
| Auth | Clerk (Google, Discord, Apple, GitHub, Twitter, Email) |
| Database | Neon PostgreSQL |
| Images | Cloudflare R2 |
| Cache/Leaderboard | Upstash Redis |
| Realtime (Duels) | Cloudflare Durable Objects |
| Pipeline | GitHub Actions + yt-dlp + ffmpeg |
| Monorepo | Turborepo |

## License

MIT
