# Linear Issues — Ready to Import

> Each issue follows the format: `[Priority] Title — Description — Labels — Estimate`
> Priorities: 🔴 Urgent, 🟠 High, 🟡 Medium, 🟢 Low

---

## Project: 🏗️ FRA — Foundation

### FRA-1 🔴 Monorepo Setup
Set up Turborepo monorepo with workspace packages: `apps/web`, `packages/ui`, `packages/game-engine`, `packages/api-client`, `packages/shared`. Configure TypeScript, ESLint, Prettier with shared configs. Add `turbo.json` with build/dev/lint/test pipelines.
**Labels**: `infra`, `dx` | **Estimate**: 3 points

### FRA-2 🔴 Neon Database Provisioning
Create Neon project, configure branching for dev/staging/prod. Deploy the full database schema (videos, frames, games, users, game_results, achievements, leaderboard_snapshots). Set up connection pooling. Add migration tooling (Drizzle ORM).
**Labels**: `database`, `infra` | **Estimate**: 3 points

### FRA-3 🔴 Cloudflare R2 Setup
Create R2 bucket `framedle-content`. Configure CORS policy. Set up service account for pipeline uploads (S3 API keys). Configure CF CDN caching rules for `/frames/*` path. Verify signed URL generation.
**Labels**: `storage`, `infra` | **Estimate**: 2 points

### FRA-4 🔴 Cloudflare Workers Project
Initialize Hono project in `workers/api/`. Set up wrangler.toml with R2 binding, KV namespace, and environment variables. Deploy health check endpoint. Configure custom domain `api.framedle.gg`.
**Labels**: `api`, `infra` | **Estimate**: 3 points

### FRA-5 🔴 Clerk Authentication Setup
Create Clerk application. Configure social providers (Google, Discord, Apple, GitHub, Twitter). Set up webhook endpoint for `user.created` / `user.deleted` events → sync to Neon. Test JWT verification in CF Worker.
**Labels**: `auth`, `infra` | **Estimate**: 3 points

### FRA-6 🔴 Content Pipeline v1
Port and enhance the existing yt-dlp extraction script. Add: image variant generation (crops, pixelated, desaturated, fragments), R2 upload via boto3, Neon catalog write. Create `pipeline.yml` GitHub Actions workflow with daily cron.
**Labels**: `pipeline`, `backend` | **Estimate**: 5 points

### FRA-7 🟠 Design System — Base Components
Build shared React components in `packages/ui`: Button, Input (search-as-you-type), Card, Modal, Toast, Avatar, Badge, Skeleton, ProgressBar. Use Tailwind + class-variance-authority. Include Storybook for component catalog.
**Labels**: `design`, `frontend` | **Estimate**: 5 points

### FRA-8 🟠 Game Engine — Core Types & Scoring
Define TypeScript types for all game modes, guesses, results, and user stats in `packages/game-engine`. Implement scoring functions (per mode), daily seed generator (deterministic), and XP calculation.
**Labels**: `game-logic`, `frontend` | **Estimate**: 3 points

### FRA-9 🟠 CI/CD Pipeline
GitHub Actions: lint + type-check + test on PR. Auto-deploy: web → Vercel/CF Pages, workers → CF Workers, pipeline → manual trigger. Branch preview environments for web app.
**Labels**: `infra`, `dx` | **Estimate**: 3 points

### FRA-10 🟡 Seed Content — Process 50+ Videos
Run the pipeline against a curated list of 50+ iconic YouTube videos across categories. Verify heatmap extraction, frame quality, and R2 storage. Manually validate that selected frames are recognizable.
**Labels**: `content`, `pipeline` | **Estimate**: 3 points

---

## Project: 🎮 GAME — Game Modes

### GAME-1 🔴 Daily Frame — Backend
API endpoints: `GET /game/daily-frame/daily` (fetch today's game), `POST /game/daily-frame/guess` (submit guess with server validation). Implement progressive hint system (6 levels). Store game sessions and results in Neon.
**Labels**: `api`, `game-logic` | **Estimate**: 5 points

### GAME-2 🔴 Daily Frame — Frontend
Game board component: frame display (with zoom/crop variants), search-as-you-type input with debounced server search, hint reveal animations, guess history, completion modal with score + emoji grid + share button.
**Labels**: `frontend`, `game-ui` | **Estimate**: 8 points

### GAME-3 🔴 Daily Frame — State Machine
XState v5 state machine for Daily Frame: `idle → loading → guessing → validating → (guessing | reveal) → complete`. Handle optimistic UI updates, server response reconciliation, error states, and network retry.
**Labels**: `game-logic`, `frontend` | **Estimate**: 5 points

### GAME-4 🟠 Video Search Endpoint
`GET /api/search?q=...` — fuzzy search across video titles. Use PostgreSQL `pg_trgm` extension for trigram similarity. Return top 10 matches with title, channel, thumbnail URL. Must be fast (<100ms). Cache common queries in KV.
**Labels**: `api`, `search` | **Estimate**: 3 points

### GAME-5 🟠 Category Clash — Full Implementation
Backend: 12 random frames with correct categories, daily seed. Frontend: 10-second countdown per round, category button grid, score animation, speed bonus indicator. Total score screen.
**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points

### GAME-6 🟠 Pixel Reveal — Full Implementation
Backend: serve pixelated frame variants (8→16→32→64→128→full) per level. Frontend: reveal button with level indicator, points display decreasing per level, guess input, wrong-guess penalty animation.
**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points

### GAME-7 🟠 Year Guesser — Full Implementation
Backend: 5 random frames with upload years, proximity scoring. Frontend: timeline slider component (2005-current), year display, score popup per round (+200/+150/etc.), total score summary.
**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points

### GAME-8 🟠 Channel Check — Full Implementation
Backend: 5 frames from one channel, channel search endpoint. Frontend: frame gallery (reveal one at a time), channel search input, subscriber count hint on wrong guess, difficulty badge.
**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points

### GAME-9 🟠 Streak Mode — Full Implementation
Backend: infinite frame queue with 4 multiple-choice options per round, difficulty scaling algorithm. Frontend: streak counter, multiplier indicator, rapid-fire card UI, game over animation with best score.
**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points

### GAME-10 🟡 View Count Blitz — Full Implementation
Backend: 8 video thumbnail+title pairs with view counts, range validation. Frontend: thumbnail card, 6 range buttons, 15s countdown, speed bonus sparkle.
**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points

### GAME-11 🟡 Timeline Sort — Full Implementation
Backend: 5 chronologically-ordered frames from one video (shuffled). Frontend: drag-and-drop sortable list, one-attempt lock, score reveal by position.
**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points

### GAME-12 🟡 Fragment Match — Full Implementation
Backend: 4 frames + 4 cropped fragments, correct mapping. Frontend: dual grid (fragments + frames), drag-to-connect, 60s timer, match result animation.
**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points

### GAME-13 🟡 Clip Guesser — Full Implementation
Backend: serve 5-second clip URL, extend clip on wrong guess. Pipeline: extract MP4 clips at heatmap peaks. Frontend: video player (muted), guess input, clip extension animation.
**Labels**: `game-mode`, `full-stack`, `pipeline` | **Estimate**: 8 points

### GAME-14 🟢 Sound Only — Full Implementation
Backend: serve .opus audio clip URL. Pipeline: extract audio at heatmap peaks. Frontend: audio player (waveform visualization), no video, guess input.
**Labels**: `game-mode`, `full-stack`, `pipeline` | **Estimate**: 8 points

---

## Project: 👤 USER — Users & Social

### USER-1 🔴 Anonymous User Flow
Device fingerprint generation (hashed). Local storage of game results (IndexedDB for web, SQLite for Tauri). Server-side storage keyed by fingerprint. Daily game lock via fingerprint+date.
**Labels**: `auth`, `frontend` | **Estimate**: 3 points

### USER-2 🔴 Registration & SSO Flow
Clerk sign-in/up modal integration. Post-registration webhook → create user record in Neon. JWT token attached to all API requests. Protected routes (profile, stats).
**Labels**: `auth`, `full-stack` | **Estimate**: 3 points

### USER-3 🟠 Anonymous → Registered Merge
When a user registers, prompt to "claim" anonymous history. API endpoint: `POST /user/claim-anonymous { fingerprint }`. Merge game results, stats, and streaks from anonymous records to new account.
**Labels**: `auth`, `api` | **Estimate**: 5 points

### USER-4 🟠 User Profile Page
Display name, avatar (Clerk-provided), country flag, level/title, XP bar, current streak, total games played, favorite mode, join date. Editable display name and country.
**Labels**: `frontend`, `api` | **Estimate**: 3 points

### USER-5 🟠 User Stats Dashboard
Per-mode breakdown: games played, win rate, average score, best score, average guess count. Overall: total XP, level, rank, streak history chart, games per day chart.
**Labels**: `frontend`, `api` | **Estimate**: 5 points

### USER-6 🟡 Achievement System
12+ achievements with progress tracking. Achievement unlock toast notification. Achievement showcase on profile. Backend: check achievement conditions on game completion, award and persist.
**Labels**: `game-logic`, `full-stack` | **Estimate**: 5 points

---

## Project: 🏆 LEAD — Leaderboards & Sharing

### LEAD-1 🔴 Daily Leaderboard Backend
Upstash Redis sorted set per mode per day. On game completion, `ZADD` score. Endpoints: `GET /leaderboard/:mode?period=daily` → top 100. `GET /leaderboard/:mode/me` → user rank + surrounding 5 above/below.
**Labels**: `api`, `redis` | **Estimate**: 3 points

### LEAD-2 🔴 Leaderboard UI
Tabbed view: Daily / Weekly / All-Time / Friends / Country. User row highlighted. Pagination (load more). Avatar, display name, score, rank badge. Pull-to-refresh (mobile).
**Labels**: `frontend` | **Estimate**: 5 points

### LEAD-3 🟠 Weekly & All-Time Leaderboards
Weekly: aggregate daily scores Mon-Sun, scheduled job to snapshot. All-Time: cumulative XP sorted set. Friends: filtered by Clerk social graph. Country: filtered by user.country field.
**Labels**: `api`, `redis` | **Estimate**: 3 points

### LEAD-4 🟠 Share — Clipboard & Twitter
Generate emoji grid text per mode. Copy to clipboard button. "Share to Twitter" → open tweet compose with pre-filled text + link. Track share events in analytics.
**Labels**: `frontend`, `social` | **Estimate**: 3 points

### LEAD-5 🟠 Share — Dynamic OG Image
CF Worker: receives gameId → looks up result → generates PNG with Satori/Resvg (blurred frame + score grid + streak). Cached in R2. Meta tags on `/share/:gameId` page for rich previews.
**Labels**: `api`, `social` | **Estimate**: 5 points

### LEAD-6 🟡 Share — Native Share Sheet
Web Share API for mobile web. Tauri share plugin for desktop/mobile apps. Fallback to clipboard on unsupported platforms. Instagram Stories image export.
**Labels**: `frontend`, `platform` | **Estimate**: 3 points

---

## Project: ⚔️ DUEL — Multiplayer

### DUEL-1 🟠 Durable Object — DuelMatch
Implement `DuelMatch` Durable Object: WebSocket handler, match state machine (waiting → countdown → round → intermission → ... → result), frame distribution, guess validation, timeout handling.
**Labels**: `backend`, `realtime` | **Estimate**: 8 points

### DUEL-2 🟠 Matchmaking System
Redis queue for matchmaking. Worker polls queue, pairs players, creates Durable Object. Friend invite: generate unique link → second player joins the same DO. Handle queue timeout (30s → cancel).
**Labels**: `backend`, `api` | **Estimate**: 5 points

### DUEL-3 🟠 Duel Frontend
Matchmaking screen (spinner + cancel). Game board: frame display, guess input, opponent status (guessing.../answered), round result overlay, best-of-5 score tracker, match summary.
**Labels**: `frontend`, `game-ui` | **Estimate**: 8 points

### DUEL-4 🟡 Duel Results & Leaderboard
Duel-specific leaderboard: wins, losses, win rate, ELO rating. Match history page. Duel share format. Duel achievement integration.
**Labels**: `full-stack`, `social` | **Estimate**: 3 points

---

## Project: 📱 NATIVE — Desktop & Mobile

### NATIVE-1 🟠 Tauri v2 Desktop Setup
Initialize Tauri v2 project in `apps/desktop/`. Configure for Windows, macOS, Linux builds. Integrate shared React app from `packages/ui`. Set up auto-update (Tauri updater plugin). CI: build artifacts for all 3 platforms.
**Labels**: `platform`, `infra` | **Estimate**: 5 points

### NATIVE-2 🟠 Tauri v2 Mobile Setup
Configure Tauri v2 mobile targets (iOS, Android) in `apps/mobile/`. Handle safe areas, status bar, navigation differences. Test on physical devices. Set up TestFlight + Google Play Console beta tracks.
**Labels**: `platform`, `infra` | **Estimate**: 8 points

### NATIVE-3 🟡 Offline Support
SQLite local DB (Tauri SQL plugin) for game cache, user preferences, and anonymous results. Service Worker for web. Cache strategy: pre-cache today's game assets on app open.
**Labels**: `platform`, `frontend` | **Estimate**: 5 points

### NATIVE-4 🟡 Push Notifications
Streak reminder: daily push at user's preferred time. New mode available notification. Duel invite notification. Tauri notification plugin (desktop), native push (mobile), Web Push API (web).
**Labels**: `platform`, `engagement` | **Estimate**: 5 points

### NATIVE-5 🟡 App Store Releases
Apple App Store submission (screenshots, description, review). Google Play Store submission. Windows Store / Homebrew / AUR packaging. Code signing for all platforms.
**Labels**: `platform`, `release` | **Estimate**: 5 points

---

## Project: 🔧 OPS — Operations & Quality

### OPS-1 🟠 Analytics Integration
PostHog setup: track game_started, guess_submitted, game_completed, share_clicked, mode_selected, signup_completed. Funnels: visit → play → complete → share. Retention cohorts.
**Labels**: `analytics`, `infra` | **Estimate**: 3 points

### OPS-2 🟠 Error Tracking
Sentry integration for web, workers, and Tauri apps. Source maps upload in CI. Alert rules: error rate spike, API latency P99, pipeline failure.
**Labels**: `monitoring`, `infra` | **Estimate**: 2 points

### OPS-3 🟡 Load Testing
Simulate 50K concurrent users. Test: API response times, Redis throughput, Neon connection limits, R2 CDN cache hit rates. Document bottlenecks and mitigations.
**Labels**: `performance`, `infra` | **Estimate**: 3 points

### OPS-4 🟡 Accessibility Audit
WCAG 2.1 AA compliance: keyboard navigation all modes, screen reader support, color-blind friendly grids (patterns + colors), reduced motion, high contrast mode.
**Labels**: `a11y`, `frontend` | **Estimate**: 5 points

### OPS-5 🟢 Localization
i18next integration. PT-BR as first additional language. Translation files for all UI strings, game instructions, achievement descriptions. RTL support preparation.
**Labels**: `i18n`, `frontend` | **Estimate**: 5 points

---

## Summary

| Project | Issues | Total Points |
|---------|--------|-------------|
| 🏗️ Foundation | 10 | 33 |
| 🎮 Game Modes | 14 | 77 |
| 👤 Users & Social | 6 | 24 |
| 🏆 Leaderboards | 6 | 22 |
| ⚔️ Duels | 4 | 24 |
| 📱 Native Apps | 5 | 28 |
| 🔧 Operations | 5 | 18 |
| **Total** | **50** | **226** |

At ~20 points/sprint (2 weeks), this is approximately **23 weeks** of work for a small team (2-3 developers).
