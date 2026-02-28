# Roadmap — Phased Delivery Plan

## Timeline Overview

```
Phase 0: Foundation          [Weeks 1-3]     ████░░░░░░░░░░░░░░░░░░░░░░░░
Phase 1: MVP Launch          [Weeks 4-8]     ░░░░████████░░░░░░░░░░░░░░░░
  Buffer                     [Week 9]        ░░░░░░░░░░░░█░░░░░░░░░░░░░░░
Phase 2: Extended Modes      [Weeks 10-14]   ░░░░░░░░░░░░░█████░░░░░░░░░░
  Buffer                     [Week 15]       ░░░░░░░░░░░░░░░░░░█░░░░░░░░░
Phase 3: Multiplayer+Mobile  [Weeks 16-21]   ░░░░░░░░░░░░░░░░░░░██████░░░
  Buffer                     [Week 22]       ░░░░░░░░░░░░░░░░░░░░░░░░░█░░
Phase 4: Growth              [Weeks 23-28]   ░░░░░░░░░░░░░░░░░░░░░░░░░░██
```

**Total: 28 weeks** (includes 3 buffer weeks for risk mitigation)

---

## Phase 0: Foundation (Weeks 1-3)

> *Set up the monorepo, infrastructure, and content pipeline.*

### Goals

- Monorepo with Turborepo + shared packages
- CI/CD pipeline (GitHub Actions)
- PostgreSQL (VPS) provisioned with full schema
- Cloudflare R2 bucket + Hono API (Node.js) project
- Content pipeline v1 (yt-dlp heatmap → frames → R2)
- Logto configured with social providers
- Design system foundation (Tailwind + base components)

### Deliverables

| Week | Deliverables |
|------|-------------|
| 1 | Monorepo setup (turbo.json, packages/ui, packages/game-engine, packages/shared) |
| 1 | CI workflow (lint, type-check, test on PR) |
| 2 | PostgreSQL (VPS) provisioned, full schema deployed, Drizzle ORM configured |
| 2 | R2 bucket created, CORS configured, signed URL generation verified |
| 2 | Logto application created, social providers configured |
| 3 | Pipeline v1: yt-dlp → ffmpeg → R2 upload → PostgreSQL catalog |
| 3 | Hono API (Node.js): Hono skeleton, health check, Logto middleware |
| 3 | Seed content: 50+ videos processed, frames in R2 |

### Exit Criteria

- [ ] Pipeline successfully processes 10+ videos/day
- [ ] API returns a signed R2 frame URL
- [ ] Logto sign-in works in a test React app
- [ ] CI passes on all packages
- [ ] Design system components render in Storybook

### Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| yt-dlp heatmap API changes | Medium | High | Pin yt-dlp version, monitor releases, fallback to evenly-spaced frames |
| PostgreSQL connection latency | Low | Medium | Use connection pooling (PgBouncer), preconnect on app load |
| R2 CORS issues | Low | Low | Test with actual client origin early |

### Dependencies

- None (first phase)

---

## Phase 1: MVP Launch — Web Only (Weeks 4-8)

> *Ship the web app with Daily Frame mode and basic leaderboard.*

### Goals

- Next.js web app deployed to Coolify (VPS)
- Daily Frame mode fully playable
- Anonymous + registered user flows
- Basic leaderboard (daily)
- Social sharing (clipboard + Twitter)
- Responsive design (mobile web)

### Features by Week

#### Weeks 4-5: Game Core

- [ ] Daily Frame game board UI (frame display, zoom, guess input, hint reveals)
- [ ] Search-as-you-type video search (pg_trgm fuzzy search, top 10 results)
- [ ] Progressive frame reveal system (crop → full → color → extra frames)
- [ ] Game completion screen (score, emoji grid, share button)
- [ ] Timer tracking per game
- [ ] XState state machine for Daily Frame flow

#### Week 6: Auth & Profiles

- [ ] Logto integration (sign-up, sign-in, sign-out)
- [ ] Anonymous play with device fingerprint
- [ ] Anonymous → registered account merge
- [ ] User profile page (avatar, display name, country)
- [ ] Play history page

#### Week 7: Leaderboard & Sharing

- [ ] Daily leaderboard backend (Valkey sorted sets)
- [ ] Leaderboard UI (pagination, user highlight, tab navigation)
- [ ] Share button → clipboard (emoji grid)
- [ ] Share to Twitter (pre-formatted text + link)
- [ ] Dynamic OG image generation (Hono API (Node.js) + Satori/Resvg)
- [ ] Share page (`/share/:gameId`) with SSR meta tags

#### Week 8: Polish & Launch

- [ ] Onboarding tutorial (first-time player)
- [ ] Loading states, error handling, edge cases
- [ ] Analytics integration (Umami)
- [ ] Error tracking (GlitchTip)
- [ ] Performance optimization (Lighthouse 90+)
- [ ] **Soft launch** — share with communities for feedback

### Exit Criteria

- [ ] Daily Frame playable end-to-end (load → guess → reveal → share)
- [ ] 100+ pre-scheduled daily games in the pipeline buffer
- [ ] Leaderboard shows top 100 with user rank
- [ ] Share links produce rich previews on Twitter/Discord
- [ ] Lighthouse performance score ≥90

### Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Search latency (pg_trgm on large dataset) | Medium | Medium | Cache top queries in Valkey, limit dataset to processed videos only |
| OG image generation complexity | Medium | Low | Use Satori template, cache in R2 |
| Logto integration edge cases (Tauri) | Low | Medium | Web-only for MVP, defer Tauri auth to Phase 3 |

### Dependencies

- Phase 0 complete (infra, pipeline, seed content)

---

## Buffer Week 9

Absorb delays from Phase 0-1. If on schedule, use for:
- Bug fixes from soft launch feedback
- Performance optimization
- Additional seed content processing
- Documentation updates

---

## Phase 2: Extended Game Modes (Weeks 10-14)

> *Add 5 more game modes and the progression system.*

### Goals

- 5 additional game modes (Category Clash, Pixel Reveal, Year Guesser, Channel Check, Streak)
- XP system + achievements
- Enhanced leaderboards (weekly, all-time, friends)
- Mode selection hub (home page redesign)

### Features by Week

#### Weeks 10-11: Modes Batch 1

- [ ] Category Clash (12 rounds, 10s timer, 10 categories, speed bonus)
- [ ] Pixel Reveal (6-level progressive reveal, score by level)
- [ ] Pipeline update: generate pixelated frame variants (8→128px)
- [ ] Mode selection hub screen (card grid with daily availability)
- [ ] Daily calendar showing available modes per day

#### Weeks 12-13: Modes Batch 2

- [ ] Year Guesser (timeline slider, 5 rounds, proximity scoring)
- [ ] Channel Check (5 frames, channel search, subscriber hint)
- [ ] Streak Mode (multiple choice, infinite, difficulty scaling)
- [ ] Pipeline update: channel-grouped content for Channel Check

#### Week 14: Progression & Retention

- [ ] FScore unified scoring system (mode weights + streak multiplier)
- [ ] XP system (FScore → XP → level → title)
- [ ] Streak tracking with freeze mechanic
- [ ] Achievement system (20+ achievements with progress tracking)
- [ ] Achievement toast notifications
- [ ] Weekly + all-time + friends leaderboards
- [ ] User stats dashboard (per-mode breakdown, charts)

### Exit Criteria

- [ ] 6 playable modes with daily content rotation
- [ ] XP and streaks tracked across all modes
- [ ] Achievements unlockable and displayed on profile
- [ ] Weekly leaderboard cycles correctly (Sunday midnight UTC)
- [ ] Content pipeline generates all required variants (pixelated, channel-grouped)

### Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Mode fatigue (too many choices) | Medium | Medium | Start with hub showing 2-3 modes, unlock more with level |
| Channel Check needs 5+ videos per channel | Medium | High | Pre-process top 100 channels, curate channel lists |
| Streak mode difficulty balancing | Low | Medium | A/B test difficulty curve, adjust multipliers |

### Dependencies

- Phase 1 complete (game framework, auth, leaderboard infrastructure)

---

## Buffer Week 15

Absorb delays from Phase 2. If on schedule, use for:
- Mode balancing based on player data
- Achievement condition tuning
- Difficulty calibration refinement

---

## Phase 3: Multiplayer + Desktop + Mobile (Weeks 16-21)

> *Launch Duels mode and native apps via Tauri v2.*

### Goals

- Duels mode (real-time 1v1 via ws library + Valkey state)
- Tauri v2 desktop app (Windows, macOS, Linux)
- Tauri v2 mobile app (iOS, Android)
- View Count Blitz + Timeline Sort + Clip Guesser modes
- Push notifications (streak reminders)

### Features by Week

#### Weeks 16-17: Duels Backend

- [ ] `DuelMatch` handler (WebSocket via ws library, match state machine, Valkey state)
- [ ] Matchmaking queue (Valkey list + Hono API polling)
- [ ] Friend invite system (shareable link → same match handler)
- [ ] Server-side timestamp validation (anti-latency-cheat)
- [ ] Duel results → leaderboard integration (ELO rating)

#### Week 18: Duels Frontend

- [ ] Matchmaking UI (searching animation, cancel button)
- [ ] Duel game board (split-screen feel, opponent status indicator)
- [ ] Round result animation (winner/loser reveal)
- [ ] Match summary screen (best-of-5 result)
- [ ] Duel-specific share format

#### Weeks 19-20: Tauri Desktop + Mobile

- [ ] Tauri v2 project setup (desktop + mobile targets)
- [ ] Shared React app integration (import packages/ui)
- [ ] Platform adaptations (navigation, safe areas, status bar)
- [ ] SQLite local storage (offline data, anonymous results)
- [ ] Push notification integration (Tauri notification plugin)
- [ ] Desktop auto-update mechanism
- [ ] Mobile: TestFlight + Google Play beta builds
- [ ] CI: build matrix for Win/Mac/Linux/iOS/Android

#### Week 21: Additional Modes

- [ ] View Count Blitz (8 rounds, thumbnail + title, range selection)
- [ ] Timeline Sort (drag-and-drop, 5 frames, one attempt)
- [ ] Clip Guesser (5s clip, 3 guesses, clip extension)
- [ ] Pipeline update: MP4 clip extraction at heatmap peaks

### Exit Criteria

- [ ] Duels playable with <200ms perceived latency
- [ ] Desktop app installable on Windows, macOS, Linux
- [ ] Mobile app on TestFlight and Google Play beta
- [ ] 10 total modes playable
- [ ] Push notifications working on all platforms

### Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tauri mobile stability issues | Medium | High | Web-first approach, mobile is enhancement not blocker |
| WebSocket edge cases (ws library) | Medium | Medium | Comprehensive timeout/disconnect handling, reconnection logic |
| App store review delays (Apple) | High | Medium | Start TestFlight early (Week 19), iterate |
| Cross-platform testing matrix | Medium | Medium | Focus on latest OS versions, set minimum requirements |

### Dependencies

- Phase 2 complete (multiple modes, progression system)

---

## Buffer Week 22

Absorb delays from Phase 3. If on schedule, use for:
- App store submission preparation (screenshots, descriptions)
- Duel balancing based on play data
- Cross-platform bug fixes

---

## Phase 4: Growth & Polish (Weeks 23-28)

> *Remaining modes, seasonal events, community features, and scale.*

### Goals

- Fragment Match + Sound Only modes (12/12 complete)
- Seasonal event framework
- Community video submissions
- Localization (PT-BR, ES)
- Performance optimization at scale
- Production app store releases

### Features by Week

#### Weeks 23-24: Final Modes

- [ ] Fragment Match (4 fragments ↔ 4 frames, drag-and-drop)
- [ ] Sound Only (audio clip, no visuals, .opus streaming)
- [ ] Pipeline: fragment crop generation + audio extraction
- [ ] All 12 modes complete

#### Week 25: Community & Events

- [ ] Video submission system (registered users suggest URLs)
- [ ] Moderation queue (admin dashboard for reviewing submissions)
- [ ] Seasonal event framework (themed video sets, special badges, 2× XP)
- [ ] Creator Spotlight feature (featured channel week)

#### Week 26: Localization & Accessibility

- [ ] Localization framework (i18next)
- [ ] Portuguese (BR) translation
- [ ] Spanish translation
- [ ] Accessibility audit (WCAG 2.1 AA): keyboard nav, screen readers, color-blind modes
- [ ] Dark/light theme toggle

#### Weeks 27-28: Scale & Launch

- [ ] Load testing (simulate 50K concurrent users)
- [ ] Database query optimization (EXPLAIN ANALYZE all hot paths)
- [ ] CDN cache hit rate optimization (target 95%+)
- [ ] Monitoring dashboards (Grafana or Umami Analytics)
- [ ] Incident runbook (common issues + resolution steps)
- [ ] App Store + Google Play production release
- [ ] **Public launch** 🚀

### Exit Criteria

- [ ] All 12 modes playable
- [ ] Apps live on App Store + Google Play
- [ ] PT-BR + ES translations complete
- [ ] WCAG 2.1 AA compliance verified
- [ ] Load test passes at 50K concurrent users
- [ ] Monitoring and alerting operational

### Dependencies

- Phase 3 complete (native apps, duels, core platform stable)

---

## Post-Launch Vision

| Feature | Description | Timeline |
|---------|-------------|----------|
| Premium tier | Ad-free experience, exclusive modes, custom avatars | Launch + 2mo |
| Creator tools | YouTubers create custom Framedle games with their content | Launch + 3mo |
| Tournament mode | Weekly brackets, elimination, prizes | Launch + 3mo |
| API for embeds | Embed Framedle games in websites/blogs | Launch + 4mo |
| Educational mode | History/science videos for classroom use | Launch + 6mo |
| AI difficulty | ML model to predict frame recognizability | Launch + 6mo |
| Accessibility modes | Audio descriptions, simplified inputs, one-switch support | Launch + 2mo |

---

## Velocity Assumptions

| Metric | Value |
|--------|-------|
| Team size | 2-3 full-stack developers |
| Sprint length | 2 weeks |
| Velocity | ~20 story points per sprint |
| Total story points | ~226 (across 50 issues) |
| Effective weeks | 25 (+ 3 buffer) |
| Buffer ratio | ~12% (industry standard: 10-20%) |
