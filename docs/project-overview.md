# Framedle — Project Overview

## Vision

Framedle is a daily YouTube guessing game platform — **Wordle meets YouTube** — where players test their knowledge of YouTube culture through multiple game modes built around video frames extracted from the most-replayed moments (heatmap data). The platform aims to become the go-to casual gaming destination for YouTube enthusiasts, combining daily habit-forming mechanics with social competition.

## Problem Statement

YouTube is the world's largest video platform with billions of hours watched, yet there's no gamified way to test or celebrate that cultural knowledge. Existing trivia games don't tap into the visual memory and recognition skills that YouTube viewers develop — recognizing iconic frames, knowing upload eras, identifying creators by their visual style, or estimating a video's virality.

## Solution

A multi-mode guessing game that:

1. **Extracts the most iconic moments** from YouTube videos using heatmap data (most-replayed segments)
2. **Presents them as puzzles** across 12 distinct game modes with varied mechanics
3. **Creates daily habits** through Wordle-style one-per-day challenges
4. **Enables competition** via leaderboards, duels, and social sharing
5. **Runs everywhere** — web, desktop (Windows/macOS/Linux), and mobile (iOS/Android) via Tauri v2

## Target Audience

| Segment | Description | Primary Modes |
|---------|-------------|---------------|
| Casual YouTube viewers | Watch 1-2 hours/day, recognize popular content | Daily Frame, Category Clash |
| YouTube enthusiasts | Deep knowledge of creators and trends | Channel Check, Year Guesser |
| Competitive gamers | Want rankings, streaks, and head-to-head | Duels, Streak Mode, Leaderboards |
| Social sharers | Love sharing results (Wordle-style) | All modes (emoji grids) |
| Mobile-first users | Play during commute or breaks | Quick modes (Category Clash, View Count Blitz) |

## Core Principles

1. **Instant comprehension** — understand any mode in under 5 seconds
2. **Quick sessions** — no mode takes longer than 3 minutes
3. **Share-worthy results** — every mode produces a shareable emoji grid
4. **Fair competition** — server-authoritative game logic, answers never leak to clients
5. **Play without friction** — anonymous play supported, registration optional

## Game Modes (12 Total)

| # | Mode | Mechanic | Phase |
|---|------|----------|-------|
| 1 | Daily Frame | Progressive reveal, 6 guesses (flagship) | MVP |
| 2 | Clip Guesser | 2-3s silent clip, 3 guesses | Phase 3 |
| 3 | Channel Check | 5 frames from one channel, name the YouTuber | Phase 2 |
| 4 | Year Guesser | Full frame, guess upload year via slider | Phase 2 |
| 5 | View Count Blitz | Thumbnail + title, guess virality range | Phase 3 |
| 6 | Timeline Sort | Drag-and-drop 5 frames in chronological order | Phase 3 |
| 7 | Pixel Reveal | 8x8 → full resolution progressive reveal | Phase 2 |
| 8 | Category Clash | Quick-fire categorization, 10s per round | Phase 2 |
| 9 | Streak Mode | Endless multiple-choice, difficulty climbs | Phase 2 |
| 10 | Duels | Real-time 1v1, fastest correct guess wins | Phase 3 |
| 11 | Fragment Match | Match 4 cropped pieces to 4 full frames | Phase 4 |
| 12 | Sound Only | Audio-only clip, no visuals | Phase 4 |

## Architecture Summary

**VPS-first self-hosted** — Hono on Node.js, PostgreSQL 16, Valkey, and Logto all running on a Hostinger KVM2 VPS managed via Coolify, with Cloudflare free tier for CDN/DNS and R2 for media storage.

```
Clients (React + Tauri v2) → Cloudflare CDN → VPS (Coolify + Traefik)
                                                  → Hono API + Next.js (SSR)
                                                  → PostgreSQL 16 + Valkey
                                                  → Logto (Auth)
                                               ↑
                           GitHub Actions Pipeline (yt-dlp + ffmpeg → R2)
```

## Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| App framework | Tauri v2 | 6 platforms, 10x smaller than Electron |
| Auth | Logto (self-hosted, migration: Clerk) | SSO + anonymous support, no per-user cost, $0 forever |
| Storage | Cloudflare R2 | $0 egress, 10 GB free, CDN-integrated |
| Database | PostgreSQL 16 (VPS, migration: Neon) | Full control, zero cost, shared by all services |
| API | Hono on Node.js (VPS) | Lightweight, typed client, runs anywhere |
| Game engine | Server-authoritative | Anti-cheat: answers never reach client |
| Real-time | ws library + Valkey state on VPS | Embedded in Hono process, no per-connection cost |
| Leaderboards | Valkey sorted sets | O(log N) rank operations, unlimited commands |
| Pipeline | GitHub Actions + yt-dlp | 6h execution limit, free tier |

## Success Metrics

| Metric | Target (3 months) | Target (12 months) |
|--------|-------------------|---------------------|
| Daily Active Users (DAU) | 1,000 | 50,000 |
| Daily game completions | 2,000 | 150,000 |
| Average session length | 3 min | 5 min (multi-mode) |
| Share rate | 15% of completions | 25% of completions |
| Day-7 retention | 30% | 40% |
| Registered user ratio | 20% | 40% |

## Cost Projections

| Scale (DAU) | Monthly Cost | First Paid Service |
|-------------|-------------|-------------------|
| 0–500 | **$0** | None (all free tiers) |
| 1,000 | **~$7** | Redis pay-as-you-go + Workers Paid |
| 5,000 | **~$32** | + Neon Launch |
| 20,000 | **~$82** | + Fixed Redis plan |
| 50,000 | **~$215** | + Clerk Pro, Sentry Team |
| 100,000 | **~$1,100** | Clerk dominates (60% of cost) |

The VPS-first architecture with R2's $0 egress keeps costs remarkably low. See **[full cost analysis](architecture/cost-analysis.md)** for per-game resource consumption, free tier ceilings, and migration triggers.

## Documentation Index

| Document | Path | Description |
|----------|------|-------------|
| Game Modes | [docs/game-design/game-modes.md](game-design/game-modes.md) | All 12 modes with detailed mechanics |
| Game Mechanics | [docs/game-design/game-mechanics.md](game-design/game-mechanics.md) | Scoring, XP, streaks, achievements, sharing |
| System Architecture | [docs/architecture/system-architecture.md](architecture/system-architecture.md) | Full system design and data flow |
| Tech Stack | [docs/architecture/tech-stack.md](architecture/tech-stack.md) | Technology choices with justification |
| Database Schema | [docs/architecture/database-schema.md](architecture/database-schema.md) | Complete PostgreSQL schema |
| Cost Analysis | [docs/architecture/cost-analysis.md](architecture/cost-analysis.md) | Free tier ceilings, migration triggers, cost at scale |
| VPS Deployment | [docs/architecture/vps-deployment.md](architecture/vps-deployment.md) | Hostinger KVM2 self-hosted stack, Docker Compose, open-source alternatives |
| ADRs (001-009) | [docs/adr/](adr/) | Architectural Decision Records |
| Roadmap | [docs/project-management/roadmap.md](project-management/roadmap.md) | 28-week phased delivery plan |
| Linear Issues | [docs/project-management/linear-issues.md](project-management/linear-issues.md) | 50 issues, 226 story points |

## Team & Timeline

- **Team size**: 2-3 full-stack developers
- **Total scope**: ~226 story points across 50 issues
- **Timeline**: 28 weeks (including 3 buffer weeks) to full launch
- **MVP (web + Daily Frame)**: 8 weeks
