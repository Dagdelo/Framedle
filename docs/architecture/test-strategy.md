# Test Strategy

## Overview

Framedle uses a layered testing strategy covering unit, integration, end-to-end, and pipeline validation. Tests run on every pull request and block merges on failure. The stack is **Vitest** (unit + integration) and **Playwright** (E2E), consistent with the monorepo toolchain.

---

## Test Layers

### Layer 1: Unit Tests (Vitest)

Pure logic tests with no I/O, no network, no database. Fast — target < 5 seconds for the full suite.

**packages/game-engine**

| Test Area | What Is Tested |
|-----------|---------------|
| `scoring.ts` | Score calculation for each attempt count (1–6 guesses), bonus multipliers, streak bonuses, XP deltas |
| `daily-seed.ts` | Deterministic seed for a given date + mode produces the same video assignment every run; different dates produce different assignments |
| State machines (each mode) | All valid transitions succeed; invalid transitions are rejected; terminal states (`reveal`, `complete`) are unreachable from `idle` without intermediate steps |
| `types.ts` | Zod schemas parse valid payloads; reject malformed input with typed errors |

```typescript
// packages/game-engine/src/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { calculateScore } from './scoring';

describe('calculateScore', () => {
  it('awards maximum score for a first-guess correct answer', () => {
    expect(calculateScore({ attemptsUsed: 1, maxAttempts: 6 })).toBe(1000);
  });

  it('awards zero score when all attempts are exhausted', () => {
    expect(calculateScore({ attemptsUsed: 6, maxAttempts: 6 })).toBe(0);
  });

  it('score decreases monotonically with each additional attempt', () => {
    const scores = [1, 2, 3, 4, 5].map(n =>
      calculateScore({ attemptsUsed: n, maxAttempts: 6 })
    );
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i + 1]);
    }
  });
});
```

```typescript
// packages/game-engine/src/daily-seed.test.ts
import { describe, it, expect } from 'vitest';
import { getDailyVideoId } from './daily-seed';

describe('getDailyVideoId', () => {
  it('returns the same video for the same date and mode', () => {
    const a = getDailyVideoId('daily-frame', '2026-03-01', testVideoPool);
    const b = getDailyVideoId('daily-frame', '2026-03-01', testVideoPool);
    expect(a).toBe(b);
  });

  it('returns different videos for different dates', () => {
    const a = getDailyVideoId('daily-frame', '2026-03-01', testVideoPool);
    const b = getDailyVideoId('daily-frame', '2026-03-02', testVideoPool);
    expect(a).not.toBe(b);
  });
});
```

**packages/shared**

| Test Area | What Is Tested |
|-----------|---------------|
| Validators | Username length/characters, game mode enum membership, date string format (YYYY-MM-DD), score range bounds |
| Utils | `formatScore`, `formatStreak`, `formatDuration` output for edge cases (0, max, negative) |
| Constants | Enum exhaustiveness — all `GameMode` values are present in `GAME_MODE_CONFIG` |

---

### Layer 2: Integration Tests (Vitest)

Tests that exercise real I/O: database queries, cache operations, and API routes end-to-end. Run against local Docker services (PostgreSQL 16 + Valkey).

**API Routes (apps/api)**

Uses Hono's built-in test client — no real HTTP server required.

```typescript
// apps/api/src/routes/game.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testClient } from 'hono/testing';
import { app } from '../app';
import { seedTestDb, teardownTestDb } from '../../test/helpers';

describe('POST /api/game/:mode/guess', () => {
  beforeAll(() => seedTestDb());
  afterAll(() => teardownTestDb());

  it('returns correct: true for a valid guess matching the answer', async () => {
    const client = testClient(app);
    const res = await client.api.game['daily-frame'].guess.$post({
      json: {
        gameToken: TEST_VALID_TOKEN,
        guess: 'Known Video Title',
        timestamp: Date.now(),
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.correct).toBe(true);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    const client = testClient(app);
    // Submit 11 guesses in rapid succession (limit is 10/minute)
    const requests = Array.from({ length: 11 }, () =>
      client.api.game['daily-frame'].guess.$post({
        json: { gameToken: TEST_VALID_TOKEN, guess: 'x', timestamp: Date.now() },
      })
    );
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThanOrEqual(1);
  });
});
```

**Database Queries (Drizzle + test PostgreSQL)**

| Test Area | What Is Tested |
|-----------|---------------|
| `game_results` writes | Insert on completion, unique constraint on `(user_id, game_date, mode)` |
| `users` queries | Profile fetch returns correct fields; anonymous fingerprint lookup |
| `daily_games` | Correct game returned for today's date and mode |
| Migrations | `drizzle-kit migrate` applies cleanly against a blank database |

```typescript
// apps/api/test/db/game-results.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../src/db';
import { gameResults } from '../../src/db/schema';
import { resetTestTables } from '../helpers';

describe('game_results table', () => {
  beforeEach(() => resetTestTables());

  it('rejects a duplicate (user, date, mode) insertion', async () => {
    const record = { userId: 'u1', gameDate: '2026-03-01', mode: 'daily-frame', score: 800 };
    await db.insert(gameResults).values(record);
    await expect(db.insert(gameResults).values(record)).rejects.toThrow(/unique/i);
  });
});
```

**Valkey / Leaderboard Operations**

| Test Area | What Is Tested |
|-----------|---------------|
| `ZADD` / `ZREVRANK` | Score submitted appears at correct rank |
| `SETNX` daily lock | Second call returns `0` (lock already held) |
| Leaderboard pagination | `ZREVRANGE` with offset returns correct window |
| Expiry | Daily keys expire at UTC midnight |

```typescript
// apps/api/test/valkey/leaderboard.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { valkey } from '../../src/cache';
import { submitScore, getRank } from '../../src/leaderboard';

describe('Leaderboard sorted set operations', () => {
  const key = 'lb:daily-frame:2026-03-01:daily';

  beforeEach(async () => valkey.del(key));

  it('returns rank 0 (first place) for the only score submitted', async () => {
    await submitScore(key, 'user-1', 950);
    expect(await getRank(key, 'user-1')).toBe(0);
  });

  it('daily lock SETNX is idempotent', async () => {
    const lockKey = 'game:user-1:2026-03-01:daily-frame';
    const first = await valkey.setnx(lockKey, '1');
    const second = await valkey.setnx(lockKey, '1');
    expect(first).toBe(1);
    expect(second).toBe(0);
  });
});
```

---

### Layer 3: End-to-End Tests (Playwright)

Full browser flows against the running Next.js app and API. Run in CI on `ubuntu-latest` using `playwright/chromium`. Headed locally, headless in CI.

**Daily Frame — Full Game Flow**

```typescript
// e2e/daily-frame.spec.ts
import { test, expect } from '@playwright/test';

test('anonymous user completes a Daily Frame game', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /play daily frame/i }).click();

  // Game loads: first frame is visible
  await expect(page.getByTestId('game-frame')).toBeVisible();

  // Submit a wrong guess
  await page.getByRole('combobox', { name: /guess/i }).fill('Wrong Title');
  await page.getByRole('option', { name: 'Wrong Title' }).click();
  await page.getByRole('button', { name: /submit/i }).click();

  // Hint 2 is now visible
  await expect(page.getByTestId('attempt-2')).toBeVisible();

  // Submit the correct answer (seeded test date)
  await page.getByRole('combobox', { name: /guess/i }).fill('Correct Video Title');
  await page.getByRole('option', { name: 'Correct Video Title' }).click();
  await page.getByRole('button', { name: /submit/i }).click();

  // Result screen
  await expect(page.getByTestId('result-screen')).toBeVisible();
  await expect(page.getByText(/you got it/i)).toBeVisible();
});
```

**Auth Flows**

| Flow | Steps Tested |
|------|-------------|
| Anonymous play | No login prompt on game entry; fingerprint set in localStorage; daily lock enforced on reload |
| Social registration | Click "Sign in", redirect to Logto, mock OAuth callback, user record created |
| Anonymous → registered upgrade | Game played anonymously, then registered; score and streak carried over |
| Session expiry | Expired JWT returns 401; client redirects to login without crashing |

**Leaderboard Interaction**

```typescript
// e2e/leaderboard.spec.ts
test('leaderboard shows current user rank after completing a game', async ({ page }) => {
  // Log in as seeded test user
  await loginAs(page, 'test-user@framedle.wtf');
  await completeTestGame(page, 'daily-frame');

  await page.getByRole('link', { name: /leaderboard/i }).click();
  await expect(page.getByTestId('my-rank')).toBeVisible();
  await expect(page.getByTestId('my-rank')).toContainText(/rank #/i);
});
```

**Share Page Rendering**

| Test | Assertion |
|------|-----------|
| OG image is served | `GET /api/share/:gameId` returns `image/png` with status 200 |
| Share page renders metadata | `<meta property="og:image">` tag present and pointing to R2 |
| Share page SSR | Correct result text is in the server-rendered HTML (not JS-only) |

---

### Layer 4: Pipeline Tests

Validates the GitHub Actions content pipeline (yt-dlp + ffmpeg → R2).

| Test | Tool | What Is Verified |
|------|------|-----------------|
| Frame extraction | `pytest` (pipeline/) | Given a test video URL, `extract_frames.py` produces the expected file set: `f01.webp`, `f01_px8.webp`, `f01_px16.webp`, `f01_px32.webp`, `f01_px64.webp`, `f01_px128.webp`, `f01_crop_25.webp`, `f01_crop_50.webp`, `f01_desat.webp` |
| Fragment extraction | `pytest` | Four fragment files present: `f01_frag_tl.webp`, `f01_frag_tr.webp`, `f01_frag_bl.webp`, `f01_frag_br.webp` |
| Clip extraction | `pytest` | `c01_5s.mp4` exists, duration is 5.0 ± 0.1 seconds |
| Audio extraction | `pytest` | `a01_5s.opus` exists, duration is 5.0 ± 0.1 seconds |
| R2 upload verification | `pytest` + boto3 | Files are present in R2 bucket under correct `{video_id}/` prefix; `Content-Type` is `image/webp` |
| Metadata correctness | `pytest` + psycopg2 | Inserted row in `videos` table has correct `title`, `channel_id`, `duration_seconds`; all frame paths are non-null |
| Idempotency | `pytest` | Running extraction twice for the same video does not create duplicate database rows |

```python
# pipeline/tests/test_extract_frames.py
import pytest
from pathlib import Path
from extract_frames import extract_frames_for_video

EXPECTED_VARIANTS = [
    'f01.webp', 'f01_thumb.webp',
    'f01_px8.webp', 'f01_px16.webp', 'f01_px32.webp',
    'f01_px64.webp', 'f01_px128.webp',
    'f01_crop_25.webp', 'f01_crop_50.webp',
    'f01_desat.webp',
    'f01_frag_tl.webp', 'f01_frag_tr.webp',
    'f01_frag_bl.webp', 'f01_frag_br.webp',
]

def test_extract_produces_all_variants(tmp_path, test_video_url):
    extract_frames_for_video(test_video_url, output_dir=tmp_path)
    for variant in EXPECTED_VARIANTS:
        assert (tmp_path / variant).exists(), f'Missing: {variant}'
```

---

## Coverage Targets

| Package / Layer | Tool | Target | Notes |
|----------------|------|--------|-------|
| `packages/game-engine` | Vitest | **95%** | Pure logic; easy to cover completely |
| `packages/shared` | Vitest | **90%** | Validators and utils are pure functions |
| `apps/api` routes | Vitest | **80%** | Integration tests cover happy path + key error branches |
| `packages/ui` components | Vitest (snapshot + interaction) | **70%** | Snapshot tests for render correctness; interaction tests for game controls |
| Pipeline scripts | pytest | **80%** | Critical path; extraction failures block all content |
| E2E (Playwright) | — | — | Coverage not measured; tests cover critical user journeys |

Coverage is enforced via Vitest's `coverage.thresholds` in each package's `vitest.config.ts`. A PR that drops any package below its threshold fails the CI check.

```typescript
// packages/game-engine/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
});
```

---

## CI Integration

Tests run on every pull request targeting `main`. All checks must pass before a merge is permitted.

```yaml
# .github/workflows/ci.yml (excerpt)
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  unit-and-integration:
    name: Unit + Integration Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: framedle_test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      valkey:
        image: valkey/valkey:8
        options: >-
          --health-cmd "valkey-cli ping"
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run test --filter='./packages/*' --filter='./workers/*'

  e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm playwright install --with-deps chromium
      - run: pnpm turbo run build --filter=web
      - run: pnpm playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Merge Gate Rules

| Check | Condition to Block Merge |
|-------|-------------------------|
| Unit tests | Any test failure |
| Integration tests | Any test failure |
| Coverage thresholds | Any package below its configured minimum |
| E2E tests | Any test failure |
| TypeScript | Any type error (`tsc --noEmit`) |
| Lint | Any ESLint error |

---

## Test Data

A seed script populates the test database with 10 videos that have known, stable frame assignments. These videos are stored in R2 under the `test/` prefix and are never rotated.

```typescript
// apps/api/test/seed.ts
export const TEST_VIDEOS = [
  { id: 'test-vid-001', title: 'Known Video Title',   mode: 'daily-frame',    gameDate: '2026-03-01' },
  { id: 'test-vid-002', title: 'Pixel Reveal Test',   mode: 'pixel-reveal',   gameDate: '2026-03-01' },
  { id: 'test-vid-003', title: 'Clip Guesser Test',   mode: 'clip-guesser',   gameDate: '2026-03-01' },
  { id: 'test-vid-004', title: 'Sound Only Test',     mode: 'sound-only',     gameDate: '2026-03-01' },
  { id: 'test-vid-005', title: 'Fragment Match Test', mode: 'fragment-match', gameDate: '2026-03-01' },
  { id: 'test-vid-006', title: 'Timeline Test',       mode: 'timeline',       gameDate: '2026-03-01' },
  { id: 'test-vid-007', title: 'Multi-Frame Test',    mode: 'multi-frame',    gameDate: '2026-03-01' },
  { id: 'test-vid-008', title: 'Channel Test',        mode: 'channel-guess',  gameDate: '2026-03-01' },
  { id: 'test-vid-009', title: 'Era Test',            mode: 'era-guess',      gameDate: '2026-03-01' },
  { id: 'test-vid-010', title: 'Duel Test',           mode: 'duel',           gameDate: '2026-03-01' },
];

export async function seedTestDb() {
  await db.insert(videos).values(TEST_VIDEOS.map(v => ({ ...v })));
  await db.insert(dailyGames).values(
    TEST_VIDEOS.map(v => ({
      videoId: v.id,
      mode: v.mode,
      gameDate: v.gameDate,
    }))
  );
}
```

Frame files for all 10 test videos are pre-processed and uploaded to R2 once. The pipeline test suite uses these same videos to validate extraction output against known-good checksums.

---

## References

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Hono Testing](https://hono.dev/docs/helpers/testing)
- [ADR-005: Game Engine Architecture](../adr/005-game-engine-architecture.md)
- [ADR-009: Leaderboard Architecture](../adr/009-leaderboard-architecture.md)
- [System Architecture](system-architecture.md)
- [VPS Deployment](vps-deployment.md)
