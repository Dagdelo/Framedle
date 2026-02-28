# Linear Issues — Ready to Import

> **Format**: `[Priority] Title — Description — Labels — Estimate — Dependencies`
> **Priorities**: 🔴 Urgent, 🟠 High, 🟡 Medium, 🟢 Low

---

## Project: 🏗️ FRA — Foundation

### FRA-1 🔴 Monorepo Setup

Set up Turborepo monorepo with workspace packages: `apps/web`, `packages/ui`, `packages/game-engine`, `packages/api-client`, `packages/shared`. Configure TypeScript, ESLint, Prettier with shared configs. Add `turbo.json` with build/dev/lint/test pipelines. Package manager: pnpm.

**Acceptance Criteria**:
- `pnpm dev` starts all packages in watch mode
- `pnpm build` builds all packages with proper dependency ordering
- `pnpm lint` + `pnpm typecheck` pass with zero errors
- Packages can import from each other via workspace protocol

**Labels**: `infra`, `dx` | **Estimate**: 3 points | **Depends on**: —

---

### FRA-2 🔴 PostgreSQL (VPS) Database Provisioning

Create PostgreSQL (VPS) instance via Coolify, configure separate databases for dev/staging/prod. Deploy the full database schema (10 tables: users, videos, frames, daily_games, game_results, achievements, user_achievements, duel_matches, leaderboard_snapshots + video_search materialized view). Set up connection pooling (PgBouncer). Configure Drizzle ORM with schema types.

**Acceptance Criteria**:
- Schema deployed to PostgreSQL dev database
- Drizzle schema types generated and match SQL schema
- Connection pooling configured (PgBouncer, 5 connections per service)
- Seed data (achievements) inserted successfully

**Labels**: `database`, `infra` | **Estimate**: 3 points | **Depends on**: —

---

### FRA-3 🔴 Cloudflare R2 Setup

Create R2 bucket `framedle-content`. Configure CORS policy for web + Tauri origins. Set up service account for pipeline uploads (S3 API keys). Configure CF CDN caching rules for `/frames/*` path (max-age=86400). Verify signed URL generation from Workers.

**Acceptance Criteria**:
- R2 bucket created and accessible via S3 API
- CORS allows requests from `localhost:3000` + production domain
- Signed URL generation works from a test Worker
- Cache-Control headers set correctly on uploaded files

**Labels**: `storage`, `infra` | **Estimate**: 2 points | **Depends on**: —

---

### FRA-4 🔴 Hono API (Node.js) Project

Initialize Hono project in `apps/api/`. Set up `Dockerfile` and `docker-compose.yml` with R2 env vars, Valkey connection, and environment variables. Deploy health check endpoint. Configure custom domain `api.framedle.wtf` via Coolify.

**Acceptance Criteria**:
- `pnpm dev` starts local development server
- `/health` endpoint returns `{ status: "ok", uptime: "..." }`
- R2 credentials accessible from route handlers via env vars
- Deployed to VPS via Coolify with custom domain

**Labels**: `api`, `infra` | **Estimate**: 3 points | **Depends on**: FRA-3

---

### FRA-5 🔴 Logto Authentication Setup

Deploy Logto via Coolify. Configure social providers (Google, Discord, Apple, GitHub, Twitter) + email/password + magic links. Set up webhook endpoint for `user.created` / `user.updated` / `user.deleted` events → sync to PostgreSQL. Test JWT verification in Hono middleware.

**Acceptance Criteria**:
- Logto sign-in UI renders with all providers
- JWT verification works in Hono middleware (no DB call)
- Webhook handler creates user record in PostgreSQL on signup
- React hooks (`useLogto`, `useUser`) work in test app

**Labels**: `auth`, `infra` | **Estimate**: 3 points | **Depends on**: FRA-2, FRA-4

---

### FRA-6 🔴 Content Pipeline v1

Port and enhance existing yt-dlp extraction script. Add: WebP conversion (Pillow), image variant generation (crops, pixelated, desaturated, fragments via ffmpeg), R2 upload via boto3, PostgreSQL catalog write (videos + frames tables). Create `pipeline.yml` GitHub Actions workflow with daily cron at 06:00 UTC.

**Acceptance Criteria**:
- Pipeline processes 10+ videos in a single run
- All 15 frame variants generated per frame (WebP format)
- Assets uploaded to R2 with correct folder structure
- Video + frame metadata written to PostgreSQL
- GitHub Actions workflow runs on schedule and manual trigger

**Labels**: `pipeline`, `backend` | **Estimate**: 5 points | **Depends on**: FRA-2, FRA-3

---

### FRA-7 🟠 Design System — Base Components

Build shared React components in `packages/ui`: Button, Input (search-as-you-type), Card, Modal, Toast, Avatar, Badge, Skeleton, ProgressBar, EmojiGrid. Use Tailwind + class-variance-authority (cva). Include Storybook for component catalog.

**Acceptance Criteria**:
- All components render in Storybook with multiple variants
- Components are accessible (keyboard nav, ARIA attributes)
- Dark mode support via CSS variables
- Components importable from `@framedle/ui`

**Labels**: `design`, `frontend` | **Estimate**: 5 points | **Depends on**: FRA-1

---

### FRA-8 🟠 Game Engine — Core Types & Scoring

Define TypeScript types for all game modes, guesses, results, and user stats in `packages/game-engine`. Implement: FScore calculation (with mode weights + streak multiplier), daily seed generator (deterministic), XP calculation, level-up logic. Unit tests for all scoring functions.

**Acceptance Criteria**:
- Types exported from `@framedle/game-engine`
- FScore calculation matches specification (mode weights, streak multipliers)
- Daily seed is deterministic (same date → same seed)
- 100% test coverage on scoring functions

**Labels**: `game-logic`, `frontend` | **Estimate**: 3 points | **Depends on**: FRA-1

---

### FRA-9 🟠 CI/CD Pipeline

GitHub Actions workflows: lint + type-check + test on PR. Auto-deploy: web → Coolify (VPS), Hono API (Node.js) → Coolify (VPS), pipeline → manual trigger. Branch preview environments for web app via Coolify. Status checks required for merge.

**Acceptance Criteria**:
- PR checks: lint, typecheck, test (must pass to merge)
- Web app auto-deploys on push to main via Coolify
- Hono API auto-deploys on push to main via Coolify
- Preview URLs generated for PRs

**Labels**: `infra`, `dx` | **Estimate**: 3 points | **Depends on**: FRA-1, FRA-4

---

### FRA-10 🟡 Seed Content — Process 50+ Videos

Run the pipeline against a curated list of 50+ iconic YouTube videos across all categories (Gaming, Music, Education, Vlogs, Sports, Comedy, News, Tech, Food, Travel). Verify heatmap extraction, frame quality, and R2 storage. Manually validate that selected frames are recognizable and appropriate.

**Acceptance Criteria**:
- 50+ videos processed with 6 frames each
- All categories represented (at least 3 videos per category)
- Frames manually reviewed for quality and recognizability
- Pre-scheduled 30+ daily games in the pipeline buffer

**Labels**: `content`, `pipeline` | **Estimate**: 3 points | **Depends on**: FRA-6

---

## Project: 🎮 GAME — Game Modes

### GAME-1 🔴 Daily Frame — Backend

API endpoints: `GET /game/daily-frame/daily` (fetch today's game with initial frame URL), `POST /game/daily-frame/guess` (submit guess with HMAC session token, server validates). Implement progressive hint system (6 levels with different frame variants). Store game sessions and results in PostgreSQL. Valkey daily lock (one play per user per day).

**Acceptance Criteria**:
- API returns today's game with signed frame URL
- Guess validation is server-side only (answer never sent to client)
- HMAC session token validated on each guess
- Game result written to PostgreSQL on completion
- Daily lock prevents replay (Valkey SETNX)

**Labels**: `api`, `game-logic` | **Estimate**: 5 points | **Depends on**: FRA-4, FRA-5, FRA-6

---

### GAME-2 🔴 Daily Frame — Frontend

Game board component: frame display (with zoom/crop variants), search-as-you-type input (debounced server search, 10 results), hint reveal animations (Framer Motion), guess history sidebar, completion modal (score + emoji grid + share + next mode CTA).

**Acceptance Criteria**:
- Frame displays correctly at all reveal levels
- Search returns results within 200ms
- Animations are smooth (60fps)
- Completion modal shows score, emoji grid, and share button
- Responsive design works on mobile viewport

**Labels**: `frontend`, `game-ui` | **Estimate**: 8 points | **Depends on**: FRA-7, GAME-1

---

### GAME-3 🔴 Daily Frame — State Machine

XState v5 state machine for Daily Frame: `idle → loading → guessing → validating → (guessing | reveal) → complete`. Handle optimistic UI updates (instant feedback), server response reconciliation, error states (network retry with exponential backoff), and state persistence (resume interrupted games).

**Acceptance Criteria**:
- All state transitions covered with tests
- Optimistic UI: guess feedback in <50ms
- Server disagreement triggers rollback with user notification
- Interrupted game resumes from last valid state
- State machine diagram matches documented spec

**Labels**: `game-logic`, `frontend` | **Estimate**: 5 points | **Depends on**: FRA-8

---

### GAME-4 🟠 Video Search Endpoint

`GET /api/search?q=...` — fuzzy search across video titles using PostgreSQL `pg_trgm` extension. Return top 10 matches with title, channel name, thumbnail URL. Target: <100ms response time. Cache top 1000 queries in Valkey (1h TTL).

**Acceptance Criteria**:
- Fuzzy search returns relevant results for partial titles
- Response time <100ms (P95)
- Top 1000 queries cached in Valkey
- Results include title, channel, and thumbnail
- Handles edge cases (empty query, special characters)

**Labels**: `api`, `search` | **Estimate**: 3 points | **Depends on**: FRA-2, FRA-4

---

### GAME-5 🟠 Category Clash — Full Implementation

Backend: 12 random frames with correct categories, deterministic daily seed. Frontend: 10-second countdown per round, category button grid (10 categories), score animation, speed bonus indicator (<3s = +50), total score screen with emoji grid.

**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points | **Depends on**: GAME-1, GAME-2

---

### GAME-6 🟠 Pixel Reveal — Full Implementation

Backend: serve pixelated frame variants (8→16→32→64→128→full) per level from R2. Frontend: reveal button with level indicator, points display (decreasing per level), guess input, wrong-guess penalty animation (-100), max 3 wrong guesses before auto-advance.

**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points | **Depends on**: GAME-1, GAME-2, FRA-6 (pixelated variants)

---

### GAME-7 🟠 Year Guesser — Full Implementation

Backend: 5 random frames with upload years (from video metadata), proximity scoring. Frontend: timeline slider component (2005-current), year display, score popup per round (+200/+150/+100/+50/+10), total score summary.

**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points | **Depends on**: GAME-1, GAME-2

---

### GAME-8 🟠 Channel Check — Full Implementation

Backend: 5 frames from one channel, channel search endpoint. Frontend: frame gallery (reveal one at a time with animation), channel search input, subscriber count hint on wrong guess, difficulty badge (Easy/Medium/Hard).

**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points | **Depends on**: GAME-1, GAME-2, FRA-6 (channel-grouped content)

---

### GAME-9 🟠 Streak Mode — Full Implementation

Backend: infinite frame queue with 4 multiple-choice options per round, difficulty scaling algorithm (options become more similar every 5 rounds). Frontend: streak counter (🔥), multiplier indicator, rapid-fire card UI, game over animation with best score + percentile.

**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points | **Depends on**: GAME-1, GAME-2

---

### GAME-10 🟡 View Count Blitz — Full Implementation

Backend: 8 video thumbnail+title pairs with view counts, range validation (adjacent range = half points). Frontend: thumbnail card, 6 range buttons, 15s countdown timer, speed bonus sparkle animation (<5s = +50, <10s = +25).

**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points | **Depends on**: GAME-1, GAME-2

---

### GAME-11 🟡 Timeline Sort — Full Implementation

Backend: 5 chronologically-ordered frames from one video (shuffled on serve). Frontend: drag-and-drop sortable list (touch + mouse), one-attempt lock, score reveal by position, 60s timer.

**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points | **Depends on**: GAME-1, GAME-2

---

### GAME-12 🟡 Fragment Match — Full Implementation

Backend: 4 frames + 4 cropped fragments (quadrant crops from R2), correct mapping. Frontend: dual grid (fragments on left, frames on right), drag-to-connect lines, 60s timer, match result animation.

**Labels**: `game-mode`, `full-stack` | **Estimate**: 5 points | **Depends on**: GAME-1, GAME-2, FRA-6 (fragment variants)

---

### GAME-13 🟡 Clip Guesser — Full Implementation

Backend: serve 5-second MP4 clip URL from R2, extend clip length on wrong guess (+1s per wrong). Pipeline: extract 5s MP4 clips at heatmap peaks (ffmpeg). Frontend: video player (muted), guess input, clip extension animation.

**Labels**: `game-mode`, `full-stack`, `pipeline` | **Estimate**: 8 points | **Depends on**: GAME-1, GAME-2

---

### GAME-14 🟢 Sound Only — Full Implementation

Backend: serve .opus audio clip URL from R2. Pipeline: extract 5s audio at heatmap peaks (ffmpeg, libopus). Frontend: audio player with waveform visualization, no video shown, guess input, clip extension on wrong guess.

**Labels**: `game-mode`, `full-stack`, `pipeline` | **Estimate**: 8 points | **Depends on**: GAME-1, GAME-2

---

## Project: 👤 USER — Users & Social

### USER-1 🔴 Anonymous User Flow

Device fingerprint generation (hashed SHA-256). Local storage of game results (IndexedDB for web, SQLite for Tauri). Server-side storage keyed by fingerprint. Daily game lock via fingerprint+date in Valkey. Rate limit: max 3 new anonymous identities per IP per day.

**Labels**: `auth`, `frontend` | **Estimate**: 3 points | **Depends on**: FRA-4

---

### USER-2 🔴 Registration & SSO Flow

Logto sign-in/up UI integration. Post-registration webhook → create user record in PostgreSQL. JWT token automatically attached to all API requests via Logto React SDK. Protected routes (profile, stats, friends) redirect to sign-in if not authenticated.

**Labels**: `auth`, `full-stack` | **Estimate**: 3 points | **Depends on**: FRA-5

---

### USER-3 🟠 Anonymous → Registered Merge

When a user registers, prompt to "claim" anonymous history. API endpoint: `POST /user/claim-anonymous { fingerprint }`. Merge game results, XP, streaks, and achievement progress from anonymous records to new account. Retire anonymous identity after merge.

**Labels**: `auth`, `api` | **Estimate**: 5 points | **Depends on**: USER-1, USER-2

---

### USER-4 🟠 User Profile Page

Display name, avatar (Logto-provided), country flag selector, level/title badge, XP progress bar, current streak display, total games played, favorite mode, join date. Editable fields: display name, country.

**Labels**: `frontend`, `api` | **Estimate**: 3 points | **Depends on**: USER-2

---

### USER-5 🟠 User Stats Dashboard

Per-mode breakdown: games played, win rate, average score, best score, average guess count. Overall stats: total XP, level, all-time rank, streak history chart (line graph), games per day chart (bar graph). Use Recharts for data visualization.

**Labels**: `frontend`, `api` | **Estimate**: 5 points | **Depends on**: USER-4

---

### USER-6 🟡 Achievement System

20+ achievements with progress tracking (e.g., "Gladiator: 47/100 Duel wins"). Achievement unlock toast notification (Framer Motion animation). Achievement showcase section on profile page. Backend: check achievement conditions on game completion, award XP, persist to user_achievements table.

**Labels**: `game-logic`, `full-stack` | **Estimate**: 5 points | **Depends on**: USER-4, FRA-8

---

## Project: 🏆 LEAD — Leaderboards & Sharing

### LEAD-1 🔴 Daily Leaderboard Backend

Valkey sorted set per mode per day. On game completion: `ZADD lb:{mode}:{date} {score} {userId}`. Endpoints: `GET /leaderboard/:mode?period=daily` → top 100. `GET /leaderboard/:mode/me` → user rank + surrounding 5 above/below. TTL: 7 days per daily board.

**Labels**: `api`, `redis` | **Estimate**: 3 points | **Depends on**: FRA-4, GAME-1

---

### LEAD-2 🔴 Leaderboard UI

Tabbed view: Daily / Weekly / All-Time / Friends / Country. User row always highlighted (pinned at bottom if off-screen). Infinite scroll pagination (load 50 at a time). Each row: rank, avatar, display name, score, level badge, country flag. Pull-to-refresh for mobile.

**Labels**: `frontend` | **Estimate**: 5 points | **Depends on**: LEAD-1, FRA-7

---

### LEAD-3 🟠 Weekly & All-Time Leaderboards

Weekly: scheduled Hono API cron (Sunday midnight UTC) aggregates daily scores via ZUNIONSTORE. All-Time: cumulative XP sorted set (ZINCRBY on each game). Friends: filtered by Logto social connections (batch ZSCORE). Country: per-country sorted sets. Snapshot top 100 weekly to PostgreSQL.

**Labels**: `api`, `redis` | **Estimate**: 3 points | **Depends on**: LEAD-1

---

### LEAD-4 🟠 Share — Clipboard & Twitter

Generate emoji grid text per mode (mode-specific templates from game-mechanics spec). Copy to clipboard button with success feedback. "Share to Twitter" → open tweet compose intent with pre-filled text + share page URL. Track share events in Umami analytics.

**Labels**: `frontend`, `social` | **Estimate**: 3 points | **Depends on**: GAME-2

---

### LEAD-5 🟠 Share — Dynamic OG Image

Hono API (Node.js): receives `share_hash` → looks up game result in PostgreSQL → generates PNG via Satori/Resvg (blurred frame background + score grid + streak + level badge). Cache generated image in R2 under `og/{share_hash}.png`. Meta tags on `/share/:gameId` page for rich link previews on Twitter/Discord/WhatsApp.

**Labels**: `api`, `social` | **Estimate**: 5 points | **Depends on**: LEAD-4, FRA-3

---

### LEAD-6 🟡 Share — Native Share Sheet

Web Share API for mobile web. Tauri share plugin for desktop/mobile native apps. Fallback to clipboard on unsupported platforms. Instagram Stories image export (full-size PNG share card). Platform detection for optimal share method.

**Labels**: `frontend`, `platform` | **Estimate**: 3 points | **Depends on**: LEAD-4

---

## Project: ⚔️ DUEL — Multiplayer

### DUEL-1 🟠 WebSocket DuelMatch Handler

Implement `DuelMatch` WebSocket handler in Hono API (Node.js) using the `ws` library: WebSocket connection handler, match state machine (waiting → countdown → round → intermission → ... → result → cleanup), frame distribution (both players see same frame simultaneously), guess validation, server-side timestamping, timeout handling (30s per round). Match state stored in Valkey.

**Labels**: `backend`, `realtime` | **Estimate**: 8 points | **Depends on**: FRA-4, GAME-1

---

### DUEL-2 🟠 Matchmaking System

Valkey queue for matchmaking: `LPUSH` player to queue, Hono API polls queue every 2s, pairs first two players, creates WebSocket match handler. Friend invite: generate unique link (UUID) → second player joins same match handler via link. Handle queue timeout: 30s in queue → cancel and notify player.

**Labels**: `backend`, `api` | **Estimate**: 5 points | **Depends on**: DUEL-1

---

### DUEL-3 🟠 Duel Frontend

Matchmaking screen (spinner + "Searching for opponent..." + cancel button). Game board: frame display, guess input, opponent status indicator ("thinking..." / "answered!"), round result overlay (winner animation), best-of-5 score tracker, match summary screen.

**Labels**: `frontend`, `game-ui` | **Estimate**: 8 points | **Depends on**: DUEL-1, DUEL-2, FRA-7

---

### DUEL-4 🟡 Duel Results & Leaderboard

Duel-specific leaderboard: ELO rating sorted set (`lb:duels:elo`). Win/loss/draw tracking. Match history page (last 20 matches with opponent, result, score). Duel share format. Duel achievement integration (Speed Demon, Gladiator, Rival).

**Labels**: `full-stack`, `social` | **Estimate**: 3 points | **Depends on**: DUEL-1, LEAD-1, USER-6

---

## Project: 📱 NATIVE — Desktop & Mobile

### NATIVE-1 🟠 Tauri v2 Desktop Setup

Initialize Tauri v2 project in `apps/desktop/`. Configure build targets for Windows (MSI + NSIS), macOS (DMG), Linux (AppImage + deb). Integrate shared React app from `packages/ui`. Set up auto-update via Tauri updater plugin. CI: GitHub Actions build matrix for all 3 platforms.

**Labels**: `platform`, `infra` | **Estimate**: 5 points | **Depends on**: FRA-1, FRA-7

---

### NATIVE-2 🟠 Tauri v2 Mobile Setup

Configure Tauri v2 mobile targets (iOS, Android) in `apps/mobile/`. Handle safe areas (notch, home indicator), status bar, navigation differences (back gesture). Test on physical devices (iPhone + Android). Set up TestFlight and Google Play Console beta tracks.

**Labels**: `platform`, `infra` | **Estimate**: 8 points | **Depends on**: NATIVE-1

---

### NATIVE-3 🟡 Offline Support

SQLite local DB via Tauri SQL plugin for: game cache (today's frames pre-loaded), user preferences, anonymous game results. Web: Service Worker for offline assets. Cache strategy: pre-cache today's game assets on app open. Offline indicator in UI.

**Labels**: `platform`, `frontend` | **Estimate**: 5 points | **Depends on**: NATIVE-1

---

### NATIVE-4 🟡 Push Notifications

Streak reminder: daily push at user's preferred time (configurable in settings). New mode available notification. Duel invite notification. Implementation: Tauri notification plugin (desktop), native push via Firebase/APNs (mobile), Web Push API (web). Opt-in/opt-out in settings.

**Labels**: `platform`, `engagement` | **Estimate**: 5 points | **Depends on**: NATIVE-2

---

### NATIVE-5 🟡 App Store Releases

Apple App Store submission: screenshots (6.7", 6.1", iPad), description, keywords, privacy policy URL, review notes. Google Play Store: feature graphic, screenshots, description, content rating questionnaire. Windows Store / Homebrew / AUR packaging. Code signing certificates for all platforms.

**Labels**: `platform`, `release` | **Estimate**: 5 points | **Depends on**: NATIVE-2, NATIVE-4

---

## Project: 🔧 OPS — Operations & Quality

### OPS-1 🟠 Analytics Integration

Umami setup: track events: `game_started`, `guess_submitted`, `game_completed`, `share_clicked`, `mode_selected`, `signup_completed`, `duel_matched`, `achievement_unlocked`. Funnels: visit → play → complete → share. Retention cohorts: day-1, day-7, day-30.

**Labels**: `analytics`, `infra` | **Estimate**: 3 points | **Depends on**: FRA-1

---

### OPS-2 🟠 Error Tracking

GlitchTip integration for: Next.js web app, Hono API (Node.js), Tauri desktop + mobile. Source maps upload in CI (automatic on deploy). Alert rules: error rate spike (>2× baseline), API P99 latency >500ms, pipeline failure notification.

**Labels**: `monitoring`, `infra` | **Estimate**: 2 points | **Depends on**: FRA-1, FRA-4

---

### OPS-3 🟡 Load Testing

Simulate 50K concurrent users using k6 or Artillery. Test scenarios: daily game play (load → guess × 6 → share), leaderboard reads, search queries, duel matchmaking. Measure: API response times (P50, P95, P99), Valkey throughput, PostgreSQL (VPS) connection saturation, R2 CDN cache hit rates. Document bottlenecks and mitigations.

**Labels**: `performance`, `infra` | **Estimate**: 3 points | **Depends on**: GAME-1, LEAD-1

---

### OPS-4 🟡 Accessibility Audit

WCAG 2.1 AA compliance check: keyboard navigation for all game modes, screen reader support (ARIA labels, live regions), color-blind friendly emoji grids (patterns + colors), reduced motion mode (respect `prefers-reduced-motion`), high contrast mode, focus indicators.

**Labels**: `a11y`, `frontend` | **Estimate**: 5 points | **Depends on**: GAME-2

---

### OPS-5 🟢 Localization

i18next integration in `packages/shared`. Portuguese (BR) as first additional language. Translation files for: all UI strings, game instructions, achievement names + descriptions, error messages, share templates. RTL support preparation (structure only, no RTL language yet).

**Labels**: `i18n`, `frontend` | **Estimate**: 5 points | **Depends on**: FRA-1

---

## Summary

| Project | Issues | Total Points | Phase |
|---------|--------|-------------|-------|
| 🏗️ Foundation | 10 | 33 | 0 |
| 🎮 Game Modes | 14 | 77 | 1-4 |
| 👤 Users & Social | 6 | 24 | 1-2 |
| 🏆 Leaderboards & Sharing | 6 | 22 | 1-2 |
| ⚔️ Duels | 4 | 24 | 3 |
| 📱 Native Apps | 5 | 28 | 3-4 |
| 🔧 Operations | 5 | 18 | 1-4 |
| **Total** | **50** | **226** | |

At ~20 points/sprint (2-week sprints), this is approximately **23 sprints / 46 weeks** of work for a solo developer, or **~23 weeks** for a 2-person team.

## Dependency Graph (Critical Path)

```
FRA-1 (Monorepo) ──┬── FRA-7 (Design System) ──── GAME-2 (Daily Frame UI)
                   ├── FRA-8 (Game Engine) ──────── GAME-3 (State Machine)
                   └── FRA-9 (CI/CD)

FRA-2 (PostgreSQL) ──┬── FRA-5 (Logto) ──── USER-2 (SSO) ──── USER-3 (Merge)
                     └── FRA-6 (Pipeline) ──── FRA-10 (Seed Content)

FRA-3 (R2) ──── FRA-4 (Hono API) ──── GAME-1 (Daily Frame API) ──┬── GAME-2
                                                                   ├── LEAD-1 (Leaderboard)
                                                                   └── DUEL-1 (Duels)
```

**Critical path**: FRA-1 → FRA-7 → GAME-2 → GAME-5+ (extended modes)
**Parallel track**: FRA-2 → FRA-6 → FRA-10 (can run alongside critical path)
