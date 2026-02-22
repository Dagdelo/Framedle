# Roadmap — Phased Delivery Plan

## Timeline Overview

```
Phase 0: Foundation          [Weeks 1-3]     ████░░░░░░░░░░░░░░░░░░░░
Phase 1: MVP Launch          [Weeks 4-8]     ░░░░████████░░░░░░░░░░░░
Phase 2: Extended Modes      [Weeks 9-13]    ░░░░░░░░░░░░█████░░░░░░░
Phase 3: Multiplayer+Mobile  [Weeks 14-19]   ░░░░░░░░░░░░░░░░░██████░
Phase 4: Growth              [Weeks 20-26]   ░░░░░░░░░░░░░░░░░░░░░███
```

---

## Phase 0: Foundation (Weeks 1-3)

> *Set up the monorepo, infrastructure, and content pipeline.*

### Goals
- Monorepo with Turborepo + shared packages
- CI/CD pipeline (GitHub Actions)
- Neon database provisioned with schema
- Cloudflare R2 bucket + Workers project
- Content pipeline v1 (yt-dlp heatmap → frames → R2)
- Clerk project configured with social providers
- Design system foundation (Tailwind + base components)

### Deliverables
- [ ] `turbo.json`, workspace config, TypeScript base config
- [ ] `packages/ui` — Button, Card, Input, Modal, Toast
- [ ] `packages/game-engine` — types, scoring module, daily seed logic
- [ ] `packages/api-client` — base HTTP client with auth headers
- [ ] `workers/api` — Hono skeleton with health check, Clerk middleware
- [ ] `pipeline/` — extraction script with R2 upload + Neon catalog
- [ ] `.github/workflows/pipeline.yml` — daily cron
- [ ] `.github/workflows/ci.yml` — lint, type-check, test
- [ ] Neon schema deployed, seed data (50+ videos processed)
- [ ] R2 bucket with first batch of frame variants

### Exit Criteria
- Pipeline successfully processes 10+ videos/day
- API returns a frame URL from R2 with signed URL
- Clerk sign-in works in a test React app
- CI passes on all packages

---

## Phase 1: MVP Launch — Web Only (Weeks 4-8)

> *Ship the web app with Daily Frame mode and basic leaderboard.*

### Goals
- Next.js web app deployed to Vercel (or CF Pages)
- Daily Frame mode fully playable
- Anonymous + registered user flows
- Basic leaderboard (daily)
- Social sharing (clipboard + Twitter)
- Responsive design (mobile web included)

### Features

#### Week 4-5: Game Core
- [ ] Daily Frame game board UI (frame display, guess input, hint reveals)
- [ ] Search-as-you-type with server-side fuzzy search
- [ ] Progressive frame reveal system (crop → full → color → extra frames)
- [ ] Game completion screen with score + emoji grid
- [ ] Timer tracking per game

#### Week 6: Auth & Profiles
- [ ] Clerk integration (sign-up, sign-in, sign-out)
- [ ] Anonymous play with device fingerprint
- [ ] Anonymous → registered account merge
- [ ] User profile page (avatar, display name, country)
- [ ] Play history page

#### Week 7: Leaderboard & Sharing
- [ ] Daily leaderboard (Redis sorted sets)
- [ ] Leaderboard UI with pagination, user highlight
- [ ] Share button → clipboard (emoji grid)
- [ ] Share to Twitter with pre-formatted text
- [ ] Dynamic OG image generation (CF Worker)
- [ ] Share page (`/share/:gameId`) with SSR meta tags

#### Week 8: Polish & Launch
- [ ] Onboarding tutorial (first-time player)
- [ ] Loading states, error handling, edge cases
- [ ] Analytics integration (PostHog)
- [ ] Error tracking (Sentry)
- [ ] Performance optimization (Lighthouse 90+)
- [ ] **Soft launch** — share with communities for feedback

### Exit Criteria
- Daily Frame playable end-to-end
- 100+ pre-scheduled daily games in the pipeline
- Leaderboard shows top 100 with user rank
- Share links produce rich previews on Twitter/Discord

---

## Phase 2: Extended Game Modes (Weeks 9-13)

> *Add 5 more game modes and the progression system.*

### Goals
- Category Clash (quick & accessible — engagement driver)
- Pixel Reveal (unique mechanic — viral potential)
- Year Guesser (broad appeal)
- Channel Check (YouTuber fans love this)
- Streak Mode (retention driver — endless play)
- XP system + achievements
- Enhanced leaderboards (weekly, all-time, friends)

### Features

#### Week 9-10: Modes Batch 1
- [ ] Category Clash (12 rounds, 10s each, 10 categories)
- [ ] Pixel Reveal (6-level progressive reveal, score by level)
- [ ] Pipeline update: generate pixelated variants in processing step
- [ ] Mode selection screen (hub/home page redesign)
- [ ] Daily calendar showing available modes per day

#### Week 11-12: Modes Batch 2
- [ ] Year Guesser (timeline slider, 5 rounds, proximity scoring)
- [ ] Channel Check (5 frames, channel search input)
- [ ] Streak Mode (multiple choice, infinite, difficulty scaling)
- [ ] Pipeline update: channel-grouped content for Channel Check

#### Week 13: Progression & Retention
- [ ] XP system (points → XP → level → title)
- [ ] Streak tracking with freeze mechanic
- [ ] Achievement system (12+ achievements)
- [ ] Achievement toast notifications
- [ ] Weekly leaderboard
- [ ] All-time leaderboard
- [ ] Friends leaderboard (Clerk social connections)
- [ ] User stats dashboard (games played, win rate, best streaks)

### Exit Criteria
- 6 playable modes with daily content rotation
- XP and streaks tracked across all modes
- Achievements unlockable and displayed on profile
- Weekly leaderboard cycling correctly

---

## Phase 3: Multiplayer + Desktop + Mobile (Weeks 14-19)

> *Launch Duels mode and native apps via Tauri v2.*

### Goals
- Duels mode (real-time 1v1)
- Tauri v2 desktop app (Windows, macOS, Linux)
- Tauri v2 mobile app (iOS, Android)
- View Count Blitz mode
- Timeline Sort mode
- Sound Only mode
- Push notifications (streak reminders)

### Features

#### Week 14-15: Duels Backend
- [ ] Durable Object: `DuelMatch` with WebSocket handling
- [ ] Matchmaking queue (Redis list + Worker)
- [ ] Friend invite system (shareable link)
- [ ] Match state machine (countdown → rounds → result)
- [ ] Server-side timestamp validation (anti-latency-cheat)
- [ ] Duel results → leaderboard integration

#### Week 16: Duels Frontend
- [ ] Matchmaking UI (searching... animation)
- [ ] Duel game board (split-screen feel, opponent progress indicator)
- [ ] Round result animation
- [ ] Match summary screen
- [ ] Duel-specific share format

#### Week 17-18: Tauri Desktop + Mobile
- [ ] Tauri v2 project setup (desktop + mobile targets)
- [ ] Shared React app integration
- [ ] Platform-specific adaptations (navigation, safe areas, etc.)
- [ ] SQLite local storage for offline data
- [ ] Push notification integration (Tauri notification plugin)
- [ ] Desktop: auto-update mechanism
- [ ] Mobile: app store builds (TestFlight + Google Play beta)

#### Week 19: Additional Modes
- [ ] View Count Blitz (8 rounds, thumbnail + title, range selection)
- [ ] Timeline Sort (drag-and-drop, 5 frames, one attempt)
- [ ] Sound Only (audio extraction in pipeline, .opus files)
- [ ] Pipeline update: clip extraction (5s MP4) for Clip Guesser

### Exit Criteria
- Duels playable with <200ms perceived latency
- Desktop app installable on Win/Mac/Linux
- Mobile app on TestFlight + Google Play beta
- 9 total modes playable

---

## Phase 4: Growth & Polish (Weeks 20-26)

> *Remaining modes, seasonal events, community features, and scale.*

### Goals
- Fragment Match mode
- Clip Guesser mode
- Seasonal/event mode system
- Tournament mode (weekly brackets)
- Community video submissions
- Localization (PT-BR, ES, FR, DE, JA, KO)
- Performance optimization at scale
- App store releases (production)

### Features

#### Weeks 20-21: Final Modes
- [ ] Fragment Match (4 fragments ↔ 4 frames drag-and-drop)
- [ ] Clip Guesser (2-3s silent clip, 3 guesses)
- [ ] Pipeline: fragment crop generation + clip extraction

#### Weeks 22-23: Community & Events
- [ ] Video submission system (registered users suggest URLs)
- [ ] Moderation queue (admin dashboard)
- [ ] Seasonal event framework (themed video sets, special badges)
- [ ] Tournament mode (weekly brackets, elimination, prizes)
- [ ] Creator Spotlight (featured channel week)

#### Weeks 24-25: Polish & i18n
- [ ] Localization framework (i18next)
- [ ] Portuguese (BR) translation
- [ ] Spanish translation
- [ ] Dark/light theme toggle
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance audit (Core Web Vitals)
- [ ] App Store + Google Play production release

#### Week 26: Scale Preparation
- [ ] Load testing (simulate 50K concurrent)
- [ ] Database query optimization
- [ ] CDN cache hit rate optimization
- [ ] Monitoring dashboards
- [ ] Runbook for common incidents
- [ ] **Public launch** 🚀

---

## Future (Post-Launch)

- **Premium tier**: ad-free, exclusive modes, custom avatars
- **API for third-party integrations**: embed Framedle in websites
- **Creator tools**: YouTubers can create custom Framedle games with their content
- **Educational mode**: history/science videos for classroom use
- **Accessibility modes**: audio descriptions, simplified inputs
- **AI-powered difficulty**: ML model to predict recognizability of frames
