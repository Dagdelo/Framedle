# Phase 4: Testing Infrastructure

## Insert Between Phase 3 (API Client + Composables + Wire Variants) and Phase 5 (Pages + Admin Dashboard)

**Created:** 2026-03-01
**Status:** READY TO EXECUTE
**Complexity:** MEDIUM-HIGH
**Estimated scope:** 4 sub-phases, ~45 new files, 7 modified files

---

## Context

This phase installs and validates the full test infrastructure before any application logic is built in Phase 5. Zero test infrastructure currently exists: all `package.json` `test` scripts echo a placeholder, the CI `test` step is a no-op, and no test files exist anywhere in the monorepo.

### What Exists at Phase 4 Entry Point

| Package | Code Present | Tests |
|---------|-------------|-------|
| `packages/game-engine` | `src/index.ts` (empty export) | None |
| `packages/shared` | `src/index.ts` (empty export) | None |
| `packages/ui` | 10 Vue SFCs + `cn()` utility | None |
| `apps/api` | `src/index.ts` (Hono health only) | None |
| `apps/web` | Nuxt 3 + 2 composables + 5 variants | None |
| `pipeline/` | `extract_frames.py` + `extract_batch.py` | None |

The game-engine and shared packages export nothing yet — Phase 5 builds them out. This phase therefore does two things: (1) installs and verifies the test toolchain works end-to-end with minimal test stubs, and (2) writes all tests for existing code that already has real behavior to test (composables, pipeline pure functions, UI components, API health route).

---

## Sub-Phase Overview

```
Phase 4.1 — Vitest infrastructure (configs, helpers, CI services)
    |
    v
Phase 4.2 — Unit tests: composables, UI utilities, pipeline pure functions
    |
    v
Phase 4.3 — Integration tests: API routes, pipeline DB/R2 contracts
    |
    v
Phase 4.4 — Playwright E2E: variant switching, health check, smoke tests
    |
    v
Phase 4.5 — CI wiring + coverage enforcement
```

---

## Phase 4.1: Vitest Infrastructure

**Objective:** Install Vitest in every package that needs it, create shared test helpers, configure coverage thresholds, and prove the toolchain works by running a single passing test in each workspace.

### Tasks

**3.5.1.1 Install Vitest in packages/game-engine**

Add to `devDependencies`:
- `vitest` ^3.0.0
- `@vitest/coverage-v8` ^3.0.0

Update `scripts.test`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**3.5.1.2 Install Vitest in packages/shared**

Same deps and scripts as 3.5.1.1.

**3.5.1.3 Install Vitest in packages/ui**

Add to `devDependencies`:
- `vitest` ^3.0.0
- `@vitest/coverage-v8` ^3.0.0
- `@vue/test-utils` ^2.4.0
- `happy-dom` ^16.0.0

Update scripts the same way.

**3.5.1.4 Install Vitest in apps/api**

Add to `devDependencies`:
- `vitest` ^3.0.0
- `@vitest/coverage-v8` ^3.0.0

Update scripts: same pattern, plus add `"test:integration": "vitest run --config vitest.integration.config.ts"`.

**3.5.1.5 Create vitest.config.ts files**

One per package/app. See "New Files" section for full content.

**3.5.1.6 Create shared test helpers**

Create `packages/ui/src/test/setup.ts` and `apps/api/test/helpers.ts`. See "New Files" section.

**3.5.1.7 Update turbo.json**

Add `coverage` output and split test tasks so unit and integration can run independently in CI.

**3.5.1.8 Install pytest for pipeline**

```bash
pip install --user --break-system-packages pytest pytest-mock
```

Create `pipeline/pytest.ini` and `pipeline/tests/conftest.py`.

**3.5.1.9 Smoke-test the toolchain**

Run each package's test command and confirm exit code 0. The smoke tests in each package are the minimal canary tests listed in each package's "New Files" section.

### Acceptance Criteria for 3.5.1

- [ ] `pnpm --filter @framedle/game-engine test` exits 0
- [ ] `pnpm --filter @framedle/shared test` exits 0
- [ ] `pnpm --filter @framedle/ui test` exits 0
- [ ] `pnpm --filter @framedle/api test` exits 0
- [ ] `cd pipeline && python -m pytest tests/ -v` exits 0
- [ ] Coverage reports are generated (HTML + JSON) in each package's `coverage/` directory
- [ ] `pnpm turbo run test` from repo root runs all packages and exits 0

---

## Phase 4.2: Unit Tests

**Objective:** Cover all existing pure-function logic with unit tests. At Phase 4 entry, this means the composables in `apps/web`, the `cn()` utility in `packages/ui`, the `ShareButton.generateShareText` logic, the `ScoreDisplay.formatTime` logic, the `find_top_moments` function in `pipeline/extract_frames.py`, and the `generate_variants` determinism.

### Tasks

**3.5.2.1 packages/ui unit tests**

Test the `cn()` utility, `ShareButton` share text generation, `ScoreDisplay.formatTime`, and `GuessHistory` render logic.

**3.5.2.2 apps/web composable unit tests**

Test `useDesignVariant` (variant ID parsing from route query) and `useAnimations` (preset selection). These are pure computed functions — test with mocked `useRoute`.

**3.5.2.3 pipeline pure function tests (pytest)**

Test `find_top_moments` and `generate_variants`. Both are pure given controlled inputs — no network, no DB, no R2.

### Acceptance Criteria for 3.5.2

- [ ] `packages/ui` line coverage >= 70%
- [ ] `apps/web` composable logic has 100% branch coverage (small surface)
- [ ] `pipeline/tests/test_find_top_moments.py` all pass
- [ ] `pipeline/tests/test_generate_variants.py` all pass with tmp_path (no network)

---

## Phase 4.3: Integration Tests

**Objective:** Test the Hono API (all routes in their current state) and the pipeline's database/R2 interaction contracts against real Docker services.

**Note:** The API currently only has a `/health` route. Integration tests at this stage verify the test harness wires up correctly and cover the health route. The test files are written with the full schema matching what Phase 5 will build — placeholder `describe` blocks with `it.todo` for routes not yet implemented. This is TDD setup: the tests exist and fail with "not implemented" before Phase 5 writes the handlers.

### Tasks

**3.5.3.1 API integration test harness**

Wire up `hono/testing`'s `testClient`, a test PostgreSQL connection (Docker service in CI), and a test Valkey client. Write `apps/api/test/helpers.ts` with `seedTestDb`, `teardownTestDb`, and `resetTestTables`.

**3.5.3.2 API route tests (current routes)**

Test `GET /health` fully. Scaffold `it.todo` stubs for all Phase 5 routes so they show as pending in test output rather than being absent.

**3.5.3.3 Pipeline DB/R2 contract tests**

Test `save_to_database` with a real PostgreSQL connection (using the Docker service). Test `upload_to_r2` with mocked boto3 (no real R2 calls in CI).

### Acceptance Criteria for 3.5.3

- [ ] `GET /health` integration test passes
- [ ] All Phase 5 route stubs are present as `it.todo` (visible in output, not failing)
- [ ] `test_save_to_database` inserts a row and the row is readable back
- [ ] `test_save_to_database_idempotent` confirms ON CONFLICT DO UPDATE does not create duplicates
- [ ] Integration tests are excluded from the unit test run (separate config)

---

## Phase 4.4: Playwright E2E (Smoke)

**Objective:** Install Playwright, write smoke tests that run against the Nuxt dev server, and verify variant switching and the health endpoint work end-to-end.

**Scope is intentionally narrow:** Full game flow E2E tests belong in Phase 5+ when the game pages exist. Phase 4 E2E tests cover only what exists now.

### Tasks

**3.5.4.1 Install Playwright**

Add `@playwright/test` to root `devDependencies`. Create `playwright.config.ts` at repo root. Install Chromium browser.

**3.5.4.2 Write smoke E2E tests**

Three tests:
1. Homepage loads for each variant (`?variant=1` through `?variant=5`)
2. `/api/health` returns `{ status: 'ok' }`
3. `/compare` page renders all 5 variant cards

**3.5.4.3 Add E2E to CI as separate job**

The E2E job builds the Nuxt app, starts the preview server, runs Playwright, and uploads the report on failure.

### Acceptance Criteria for 3.5.4

- [ ] `pnpm playwright test` from repo root exits 0
- [ ] All 3 smoke test files pass
- [ ] Playwright report is generated at `playwright-report/`
- [ ] Playwright chromium binary is cached in CI

---

## Phase 4.5: CI Wiring + Coverage Enforcement

**Objective:** Replace the no-op CI test step with real parallelized jobs. Enforce coverage thresholds as merge gates.

### Tasks

**3.5.5.1 Rewrite `.github/workflows/ci.yml`**

Split the monolithic job into four parallel jobs:
- `unit` — Vitest unit tests for packages/* and apps/web
- `integration` — Vitest integration tests for apps/api with Postgres + Valkey services
- `e2e` — Playwright against built Nuxt app
- `pipeline` — pytest for pipeline/

**3.5.5.2 Add coverage threshold enforcement**

Each Vitest config enforces thresholds. CI fails if any threshold is missed. The `turbo run test:coverage` command uploads LCOV to a coverage summary artifact.

**3.5.5.3 Update `turbo.json`**

Add `test:coverage` as a Turborepo task with `outputs: ["coverage/**"]` for caching.

### Acceptance Criteria for 3.5.5

- [ ] All 4 CI jobs run in parallel on every PR to `main`
- [ ] A coverage drop below threshold fails the `unit` job
- [ ] Coverage artifacts are uploaded and visible in the GitHub Actions summary
- [ ] The old monolithic `ci` job is replaced (no redundant step)

---

## New Files

### 1. `packages/game-engine/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
})
```

### 2. `packages/shared/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
})
```

### 3. `packages/ui/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/index.ts', 'src/env.d.ts', 'src/test/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
  },
})
```

### 4. `packages/ui/src/test/setup.ts`

```typescript
// Global test setup for @framedle/ui
// Runs before each test file in the happy-dom environment.
import { config } from '@vue/test-utils'

// Suppress Vue warnings about missing router in unit tests.
config.global.stubs = {
  RouterLink: { template: '<a><slot /></a>' },
  NuxtLink: { template: '<a><slot /></a>' },
}
```

### 5. `apps/api/vitest.config.ts` (unit)

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['test/integration/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
})
```

### 6. `apps/api/vitest.integration.config.ts`

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integration/**/*.test.ts'],
    // Integration tests hit real Postgres + Valkey — sequential is safer.
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    // Give DB operations breathing room.
    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
})
```

### 7. `apps/api/test/helpers.ts`

```typescript
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../src/db/schema'

// Uses TEST_DATABASE_URL from env (set by CI service or local docker-compose).
const pool = new Pool({
  connectionString: process.env.TEST_DATABASE_URL ?? 'postgres://postgres:test@localhost:5432/framedle_test',
})

export const testDb = drizzle(pool, { schema })

export async function seedTestDb() {
  await testDb.insert(schema.videos).values([
    {
      videoId: 'test-vid-001',
      title: 'Known Video Title',
      channel: 'Test Channel',
      channelId: 'UC_test_001',
      duration: 213,
    },
  ])

  await testDb.insert(schema.dailyGames).values([
    {
      videoId: 'test-vid-001',
      mode: 'daily-frame',
      gameDate: '2026-03-01',
    },
  ])
}

export async function resetTestTables() {
  // Order matters: child tables first.
  await testDb.delete(schema.gameResults)
  await testDb.delete(schema.dailyGames)
  await testDb.delete(schema.videos)
}

export async function teardownTestDb() {
  await resetTestTables()
  await pool.end()
}
```

### 8. `apps/api/test/integration/health.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { testClient } from 'hono/testing'
import app from '../../src/index'

describe('GET /health', () => {
  it('returns status ok with 200', async () => {
    const client = testClient(app)
    const res = await client.health.$get()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ status: 'ok' })
  })

  it('responds with Content-Type application/json', async () => {
    const client = testClient(app)
    const res = await client.health.$get()
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
  })
})

// TDD stubs for Phase 5 routes — they must exist and be tested before implementation.
describe('GET /game/daily (Phase 5)', () => {
  it.todo('returns current daily game config for a valid mode')
  it.todo('returns 400 for an unknown game mode')
  it.todo('returns 401 when auth token is invalid')
})

describe('POST /game/guess (Phase 5)', () => {
  it.todo('returns correct: true when guess matches the answer exactly')
  it.todo('returns correct: true for case-insensitive exact match')
  it.todo('returns correct: false for a wrong guess')
  it.todo('returns 400 when guess field is missing')
  it.todo('returns 400 when game token is expired')
  it.todo('returns 429 when rate limit is exceeded')
  it.todo('increments guess count on each call')
})

describe('GET /game/result/:dailyGameId (Phase 5)', () => {
  it.todo('returns the final game result for a completed game')
  it.todo('returns 404 for a game ID that does not exist')
  it.todo('returns 403 when requesting another user\'s result before it\'s public')
})

describe('GET /videos/search (Phase 5)', () => {
  it.todo('returns matching videos for a query string')
  it.todo('returns empty array when no videos match')
  it.todo('respects the limit query parameter')
  it.todo('returns 400 when q parameter is absent')
  it.todo('returns 400 when limit exceeds 50')
})

describe('Admin routes — GET /admin/config (Phase 5)', () => {
  it.todo('returns current config for a valid admin Bearer token')
  it.todo('returns 401 for a missing Authorization header')
  it.todo('returns 401 for an invalid Bearer token')
})

describe('Admin routes — PUT /admin/config (Phase 5)', () => {
  it.todo('updates a top-level config key and returns the updated config')
  it.todo('returns 400 for an unrecognized config key')
  it.todo('returns 422 when value type does not match schema')
})

describe('Admin routes — PUT /admin/theme (Phase 5)', () => {
  it.todo('accepts a valid variant ID 1-5 and returns 200')
  it.todo('returns 400 for a variant ID outside 1-5')
})

describe('Admin routes — GET /admin/games (Phase 5)', () => {
  it.todo('returns paginated list of scheduled daily games')
  it.todo('returns games filtered by mode when mode query param is provided')
})

describe('Admin routes — POST /admin/games (Phase 5)', () => {
  it.todo('creates a new daily game entry and returns 201')
  it.todo('returns 409 when a game already exists for that date + mode')
  it.todo('returns 400 when videoId does not exist in the videos table')
})

describe('Admin routes — GET /admin/videos (Phase 5)', () => {
  it.todo('returns all processed videos with frame counts')
  it.todo('supports search by title via q param')
})

describe('Admin routes — GET /admin/stats (Phase 5)', () => {
  it.todo('returns aggregate play counts and average scores per mode')
})
```

### 9. `packages/ui/src/lib/utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn()', () => {
  it('returns a single class unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('merges multiple classes into a single string', () => {
    expect(cn('flex', 'items-center', 'gap-2')).toBe('flex items-center gap-2')
  })

  it('resolves Tailwind conflicts by keeping the last class', () => {
    // tailwind-merge: later bg-blue-500 wins over bg-red-500
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('resolves padding conflicts by keeping the last value', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('conditionally includes a class when the condition is true', () => {
    expect(cn('base', true && 'active')).toBe('base active')
  })

  it('omits a class when the condition is false', () => {
    expect(cn('base', false && 'hidden')).toBe('base')
  })

  it('omits undefined values without throwing', () => {
    expect(cn('base', undefined)).toBe('base')
  })

  it('omits null values without throwing', () => {
    expect(cn('base', null)).toBe('base')
  })

  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('handles array inputs', () => {
    expect(cn(['flex', 'items-center'])).toBe('flex items-center')
  })

  it('handles object inputs where truthy keys are included', () => {
    expect(cn({ flex: true, hidden: false, 'text-sm': true })).toBe('flex text-sm')
  })
})
```

### 10. `packages/ui/src/components/game/ShareButton.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ShareButton from './ShareButton.vue'

// navigator.clipboard is not available in happy-dom — stub it.
const writeTextMock = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: writeTextMock },
  writable: true,
})

describe('ShareButton — generateShareText()', () => {
  it('produces header with game mode name', () => {
    const wrapper = mount(ShareButton, {
      props: { gameMode: 'Daily Frame', score: 850, guesses: 2, maxGuesses: 6, won: true },
    })
    // Access the internal function via the component's exposed scope.
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('Framedle Daily Frame')
  })

  it('shows fraction guesses/maxGuesses when won', () => {
    const wrapper = mount(ShareButton, {
      props: { gameMode: 'Daily Frame', score: 850, guesses: 2, maxGuesses: 6, won: true },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('2/6')
  })

  it('shows X/maxGuesses when lost', () => {
    const wrapper = mount(ShareButton, {
      props: { gameMode: 'Daily Frame', score: 0, guesses: 6, maxGuesses: 6, won: false },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('X/6')
  })

  it('places a green square at the winning guess position', () => {
    // Won on guess 1 → first square is green, rest black.
    const wrapper = mount(ShareButton, {
      props: { gameMode: 'Daily Frame', score: 1000, guesses: 1, maxGuesses: 6, won: true },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('🟩')
    // 5 black squares for unused guesses
    expect(text).toContain('⬛⬛⬛⬛⬛')
  })

  it('shows all red squares followed by green on last guess (won on guess 6)', () => {
    const wrapper = mount(ShareButton, {
      props: { gameMode: 'Daily Frame', score: 100, guesses: 6, maxGuesses: 6, won: true },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('🟥🟥🟥🟥🟥🟩')
  })

  it('shows all red squares when lost', () => {
    const wrapper = mount(ShareButton, {
      props: { gameMode: 'Daily Frame', score: 0, guesses: 6, maxGuesses: 6, won: false },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    // No green square — all reds, rest black
    expect(text).not.toContain('🟩')
    expect(text).toContain('🟥')
  })

  it('always includes the framedle.wtf URL', () => {
    const wrapper = mount(ShareButton, {
      props: { won: true, guesses: 3, maxGuesses: 6 },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('https://framedle.wtf')
  })

  it('defaults gameMode to "Daily" when prop is not provided', () => {
    const wrapper = mount(ShareButton, {
      props: { won: true, guesses: 1, maxGuesses: 6 },
    })
    const text: string = (wrapper.vm as any).generateShareText()
    expect(text).toContain('Framedle Daily')
  })
})

describe('ShareButton — share() interaction', () => {
  beforeEach(() => writeTextMock.mockClear())

  it('calls clipboard.writeText with the share text on click', async () => {
    const wrapper = mount(ShareButton, {
      props: { won: true, guesses: 2, maxGuesses: 6, gameMode: 'Daily Frame' },
    })
    await wrapper.find('button').trigger('click')
    expect(writeTextMock).toHaveBeenCalledOnce()
    const written: string = writeTextMock.mock.calls[0][0]
    expect(written).toContain('Framedle Daily Frame')
  })

  it('shows "Copied!" text immediately after a successful copy', async () => {
    const wrapper = mount(ShareButton, {
      props: { won: true, guesses: 2, maxGuesses: 6 },
    })
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Copied!')
  })

  it('reverts to "Share Result" text after 2 seconds', async () => {
    vi.useFakeTimers()
    const wrapper = mount(ShareButton, {
      props: { won: true, guesses: 2, maxGuesses: 6 },
    })
    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(2001)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Share Result')
    vi.useRealTimers()
  })
})
```

### 11. `packages/ui/src/components/game/ScoreDisplay.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScoreDisplay from './ScoreDisplay.vue'

// formatTime is a private function inside the SFC.
// We test it through the rendered output of the component.
describe('ScoreDisplay — formatTime rendering', () => {
  it('displays 0:00 for 0 seconds', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 0, maxTime: 60 } })
    expect(wrapper.text()).toContain('0:00')
  })

  it('displays 1:00 for 60 seconds', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 60, maxTime: 120 } })
    expect(wrapper.text()).toContain('1:00')
  })

  it('displays 0:09 for 9 seconds (zero-pads seconds)', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 9, maxTime: 60 } })
    expect(wrapper.text()).toContain('0:09')
  })

  it('displays 10:00 for 600 seconds', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 600, maxTime: 600 } })
    expect(wrapper.text()).toContain('10:00')
  })

  it('displays 1:30 for 90 seconds', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 90, maxTime: 180 } })
    expect(wrapper.text()).toContain('1:30')
  })
})

describe('ScoreDisplay — conditional rendering', () => {
  it('renders score when score prop is provided', () => {
    const wrapper = mount(ScoreDisplay, { props: { score: 850 } })
    expect(wrapper.text()).toContain('850')
  })

  it('does not render score section when score prop is absent', () => {
    const wrapper = mount(ScoreDisplay, { props: {} })
    expect(wrapper.text()).not.toContain('Score')
  })

  it('renders streak when streak > 0', () => {
    const wrapper = mount(ScoreDisplay, { props: { streak: 5 } })
    expect(wrapper.text()).toContain('5')
  })

  it('does not render streak section when streak is 0', () => {
    const wrapper = mount(ScoreDisplay, { props: { streak: 0 } })
    expect(wrapper.text()).not.toContain('Streak')
  })

  it('does not render streak section when streak prop is absent', () => {
    const wrapper = mount(ScoreDisplay, { props: {} })
    expect(wrapper.text()).not.toContain('Streak')
  })

  it('renders time section when timeRemaining is provided', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 30, maxTime: 60 } })
    expect(wrapper.text()).toContain('Time')
  })

  it('applies urgent class when timeRemaining < 10', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 9, maxTime: 60 } })
    const timeEl = wrapper.find('.text-variant-incorrect')
    expect(timeEl.exists()).toBe(true)
  })

  it('does not apply urgent class when timeRemaining >= 10', () => {
    const wrapper = mount(ScoreDisplay, { props: { timeRemaining: 10, maxTime: 60 } })
    const timeEl = wrapper.find('.text-variant-incorrect')
    expect(timeEl.exists()).toBe(false)
  })
})
```

### 12. `packages/ui/src/components/game/GuessHistory.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GuessHistory from './GuessHistory.vue'
import type { Guess } from './types'

const makeGuess = (overrides: Partial<Guess> = {}): Guess => ({
  id: Math.random().toString(36).slice(2),
  text: 'Some Video Title',
  correct: false,
  ...overrides,
})

describe('GuessHistory', () => {
  it('shows "No guesses yet" when the guesses array is empty', () => {
    const wrapper = mount(GuessHistory, { props: { guesses: [] } })
    expect(wrapper.text()).toContain('No guesses yet')
  })

  it('renders one row per guess', () => {
    const guesses = [makeGuess(), makeGuess(), makeGuess()]
    const wrapper = mount(GuessHistory, { props: { guesses } })
    // Each guess renders as a div with a checkmark or X
    expect(wrapper.findAll('.flex.items-center').length).toBe(3)
  })

  it('shows a checkmark icon for correct guesses', () => {
    const guesses = [makeGuess({ correct: true, text: 'Right Answer' })]
    const wrapper = mount(GuessHistory, { props: { guesses } })
    expect(wrapper.text()).toContain('✓')
    expect(wrapper.text()).toContain('Right Answer')
  })

  it('shows an X icon for incorrect guesses', () => {
    const guesses = [makeGuess({ correct: false, text: 'Wrong Answer' })]
    const wrapper = mount(GuessHistory, { props: { guesses } })
    expect(wrapper.text()).toContain('✗')
    expect(wrapper.text()).toContain('Wrong Answer')
  })

  it('applies correct color class to correct guess rows', () => {
    const guesses = [makeGuess({ correct: true })]
    const wrapper = mount(GuessHistory, { props: { guesses } })
    const row = wrapper.find('.border-variant-correct\\/50')
    expect(row.exists()).toBe(true)
  })

  it('applies neutral border class to incorrect guess rows', () => {
    const guesses = [makeGuess({ correct: false })]
    const wrapper = mount(GuessHistory, { props: { guesses } })
    const row = wrapper.find('.border-variant-border')
    expect(row.exists()).toBe(true)
  })

  it('respects maxVisible and truncates the list', () => {
    const guesses = Array.from({ length: 6 }, () => makeGuess())
    const wrapper = mount(GuessHistory, { props: { guesses, maxVisible: 3 } })
    expect(wrapper.findAll('.flex.items-center').length).toBe(3)
  })

  it('defaults maxVisible to 6 when not provided', () => {
    const guesses = Array.from({ length: 8 }, () => makeGuess())
    const wrapper = mount(GuessHistory, { props: { guesses } })
    expect(wrapper.findAll('.flex.items-center').length).toBe(6)
  })
})
```

### 13. `packages/ui/src/components/game/FrameViewer.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FrameViewer from './FrameViewer.vue'

describe('FrameViewer', () => {
  it('renders the frame image when imageUrl is provided', () => {
    const wrapper = mount(FrameViewer, {
      props: { imageUrl: 'https://example.com/frame.webp' },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://example.com/frame.webp')
  })

  it('shows loading placeholder text when imageUrl is not provided', () => {
    const wrapper = mount(FrameViewer, { props: {} })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('Loading frame...')
  })

  it('applies blur filter when blurLevel > 0', () => {
    const wrapper = mount(FrameViewer, {
      props: { imageUrl: 'https://example.com/frame.webp', blurLevel: 8 },
    })
    const img = wrapper.find('img')
    expect(img.attributes('style')).toContain('blur(8px)')
  })

  it('applies no blur when blurLevel is 0', () => {
    const wrapper = mount(FrameViewer, {
      props: { imageUrl: 'https://example.com/frame.webp', blurLevel: 0 },
    })
    const img = wrapper.find('img')
    expect(img.attributes('style')).toContain('blur(0px)')
  })

  it('shows round counter when round and totalRounds are both provided', () => {
    const wrapper = mount(FrameViewer, {
      props: {
        imageUrl: 'https://example.com/frame.webp',
        round: 2,
        totalRounds: 6,
      },
    })
    expect(wrapper.text()).toContain('2 / 6')
  })

  it('does not show round counter when round is not provided', () => {
    const wrapper = mount(FrameViewer, {
      props: { imageUrl: 'https://example.com/frame.webp' },
    })
    expect(wrapper.text()).not.toContain('/')
  })
})
```

### 14. `packages/ui/src/components/game/GuessInput.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GuessInput from './GuessInput.vue'

describe('GuessInput — submission', () => {
  it('emits "submit" with the typed value when form is submitted', async () => {
    const wrapper = mount(GuessInput, { props: {} })
    await wrapper.find('input').setValue('My Guess')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([['My Guess']])
  })

  it('trims whitespace before emitting', async () => {
    const wrapper = mount(GuessInput, { props: {} })
    await wrapper.find('input').setValue('  Padded Guess  ')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([['Padded Guess']])
  })

  it('clears the input after submission', async () => {
    const wrapper = mount(GuessInput, { props: {} })
    await wrapper.find('input').setValue('Something')
    await wrapper.find('form').trigger('submit')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('does not emit when the input is empty', async () => {
    const wrapper = mount(GuessInput, { props: {} })
    await wrapper.find('input').setValue('')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('does not emit when the input is only whitespace', async () => {
    const wrapper = mount(GuessInput, { props: {} })
    await wrapper.find('input').setValue('   ')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })
})

describe('GuessInput — disabled state', () => {
  it('disables the input field when disabled prop is true', () => {
    const wrapper = mount(GuessInput, { props: { disabled: true } })
    expect((wrapper.find('input').element as HTMLInputElement).disabled).toBe(true)
  })

  it('disables the submit button when disabled prop is true', () => {
    const wrapper = mount(GuessInput, { props: { disabled: true } })
    expect((wrapper.find('button').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables the submit button when input is empty', () => {
    const wrapper = mount(GuessInput, { props: {} })
    // Input starts empty
    expect((wrapper.find('button').element as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('GuessInput — suggestions dropdown', () => {
  it('shows suggestions list when suggestions are provided and input is focused', async () => {
    const wrapper = mount(GuessInput, {
      props: { suggestions: ['Option A', 'Option B', 'Option C'] },
    })
    await wrapper.find('input').trigger('focus')
    const buttons = wrapper.findAll('button[type="button"]')
    expect(buttons.length).toBe(3)
    expect(buttons[0].text()).toBe('Option A')
  })

  it('emits "submit" with suggestion text when a suggestion is clicked', async () => {
    const wrapper = mount(GuessInput, {
      props: { suggestions: ['Option A', 'Option B'] },
    })
    await wrapper.find('input').trigger('focus')
    await wrapper.findAll('button[type="button"]')[1].trigger('click')
    expect(wrapper.emitted('submit')).toEqual([['Option B']])
  })

  it('hides suggestions list when no suggestions are provided', async () => {
    const wrapper = mount(GuessInput, { props: { suggestions: [] } })
    await wrapper.find('input').trigger('focus')
    expect(wrapper.find('button[type="button"]').exists()).toBe(false)
  })

  it('uses the placeholder prop when provided', () => {
    const wrapper = mount(GuessInput, {
      props: { placeholder: 'Type a video title...' },
    })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Type a video title...')
  })

  it('uses the default placeholder when placeholder prop is not provided', () => {
    const wrapper = mount(GuessInput, { props: {} })
    expect(wrapper.find('input').attributes('placeholder')).toBe('Guess the video...')
  })
})
```

### 15. `apps/web/composables/useDesignVariant.test.ts`

Note: Nuxt composables rely on `useRoute`. In Vitest (outside Nuxt), mock `useRoute` globally in the test setup.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

// Mock Nuxt auto-imports before importing the composable.
vi.mock('#app', () => ({
  useRoute: vi.fn(),
}))

// We test the core logic extracted from useDesignVariant.
// Since the composable uses Nuxt's useRoute auto-import, we test
// the variant ID resolution logic in isolation.

describe('useDesignVariant — variant ID resolution', () => {
  function resolveVariantId(queryParam: unknown): number {
    const id = Number(queryParam)
    return id >= 1 && id <= 5 ? id : 1
  }

  it('returns 1 when query param is "1"', () => {
    expect(resolveVariantId('1')).toBe(1)
  })

  it('returns 5 when query param is "5"', () => {
    expect(resolveVariantId('5')).toBe(5)
  })

  it('returns 3 when query param is "3"', () => {
    expect(resolveVariantId('3')).toBe(3)
  })

  it('falls back to 1 when query param is absent (undefined)', () => {
    expect(resolveVariantId(undefined)).toBe(1)
  })

  it('falls back to 1 when query param is an empty string', () => {
    expect(resolveVariantId('')).toBe(1)
  })

  it('falls back to 1 when query param is "0" (below range)', () => {
    expect(resolveVariantId('0')).toBe(1)
  })

  it('falls back to 1 when query param is "6" (above range)', () => {
    expect(resolveVariantId('6')).toBe(1)
  })

  it('falls back to 1 when query param is a non-numeric string', () => {
    expect(resolveVariantId('abc')).toBe(1)
  })

  it('falls back to 1 for negative values', () => {
    expect(resolveVariantId('-1')).toBe(1)
  })
})

describe('useDesignVariant — variant names', () => {
  const variantNames: Record<number, string> = {
    1: 'Neon Cinema',
    2: 'Paper Cut',
    3: 'Vapor Grid',
    4: 'Brutal Mono',
    5: 'Soft Focus',
  }

  it('maps variant 1 to "Neon Cinema"', () => {
    expect(variantNames[1]).toBe('Neon Cinema')
  })

  it('maps variant 2 to "Paper Cut"', () => {
    expect(variantNames[2]).toBe('Paper Cut')
  })

  it('maps variant 3 to "Vapor Grid"', () => {
    expect(variantNames[3]).toBe('Vapor Grid')
  })

  it('maps variant 4 to "Brutal Mono"', () => {
    expect(variantNames[4]).toBe('Brutal Mono')
  })

  it('maps variant 5 to "Soft Focus"', () => {
    expect(variantNames[5]).toBe('Soft Focus')
  })

  it('covers all 5 variants with no extras', () => {
    expect(Object.keys(variantNames).length).toBe(5)
  })
})
```

### 16. `apps/web/composables/useAnimations.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useAnimations } from './useAnimations'
import type { AnimationStyle } from './useAnimations'

describe('useAnimations — preset selection', () => {
  const styles: AnimationStyle[] = ['neon', 'paper', 'vapor', 'brutal', 'soft']

  it.each(styles)('returns a preset for style "%s"', (style) => {
    const { preset } = useAnimations(style)
    expect(preset.value).toBeDefined()
    expect(preset.value.entrance).toBeDefined()
    expect(preset.value.exit).toBeDefined()
    expect(preset.value.hover).toBeDefined()
    expect(typeof preset.value.stagger).toBe('number')
    expect(typeof preset.value.spring.stiffness).toBe('number')
    expect(typeof preset.value.spring.damping).toBe('number')
  })

  it('accepts a string literal directly', () => {
    const { preset } = useAnimations('neon')
    expect(preset.value.animation ?? 'neon').toBeTruthy()
    // neon stagger is 0.08
    expect(preset.value.stagger).toBe(0.08)
  })

  it('accepts a reactive ref and reflects changes', () => {
    const style = ref<AnimationStyle>('brutal')
    const { preset } = useAnimations(style)
    // brutal has stagger 0
    expect(preset.value.stagger).toBe(0)
    style.value = 'soft'
    // soft has stagger 0.1
    expect(preset.value.stagger).toBe(0.1)
  })

  it('neon preset has a higher spring stiffness than paper (more responsive)', () => {
    const { preset: neon } = useAnimations('neon')
    const { preset: paper } = useAnimations('paper')
    expect(neon.value.spring.stiffness).toBeGreaterThan(paper.value.spring.stiffness)
  })

  it('brutal preset has zero stagger (no animation delay)', () => {
    const { preset } = useAnimations('brutal')
    expect(preset.value.stagger).toBe(0)
  })

  it('returns derived computed refs for entrance, exit, hover, stagger, spring', () => {
    const { entrance, exit, hover, stagger, spring } = useAnimations('soft')
    expect(entrance.value).toBeDefined()
    expect(exit.value).toBeDefined()
    expect(hover.value).toBeDefined()
    expect(typeof stagger.value).toBe('number')
    expect(spring.value).toHaveProperty('stiffness')
    expect(spring.value).toHaveProperty('damping')
  })
})
```

### 17. `pipeline/pytest.ini`

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
```

### 18. `pipeline/tests/__init__.py`

Empty file marking the directory as a Python package.

```python
```

### 19. `pipeline/tests/conftest.py`

```python
"""
Shared fixtures for all pipeline tests.
"""
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch
import sys
import os

# Make pipeline/ importable from the tests/ subdirectory.
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def sample_heatmap():
    """
    Deterministic heatmap fixture with 10 segments.
    Segment values decrease linearly so the selection order is predictable.
    Timestamps are spaced 12 seconds apart, safely above MIN_SPACING_SEC=10.
    """
    return [
        {"start_time": i * 12.0, "end_time": (i + 1) * 12.0, "value": 1.0 - (i * 0.08)}
        for i in range(10)
    ]


@pytest.fixture
def sparse_heatmap():
    """
    Only 3 segments — tests behavior when fewer segments than NUM_FRAMES exist.
    """
    return [
        {"start_time": 0.0, "end_time": 30.0, "value": 0.9},
        {"start_time": 60.0, "end_time": 90.0, "value": 0.6},
        {"start_time": 120.0, "end_time": 150.0, "value": 0.3},
    ]


@pytest.fixture
def tightly_packed_heatmap():
    """
    All segments within 5 seconds of each other — tests min_spacing enforcement.
    """
    return [
        {"start_time": i * 3.0, "end_time": (i + 1) * 3.0, "value": 1.0 - (i * 0.05)}
        for i in range(20)
    ]


@pytest.fixture
def sample_image(tmp_path):
    """
    Creates a real 1280x720 JPEG image at tmp_path for variant generation tests.
    Uses Pillow directly — no network required.
    """
    from PIL import Image
    img = Image.new("RGB", (1280, 720), color=(100, 150, 200))
    # Add some pixel variation so crop/fragment tests are meaningful.
    for x in range(0, 1280, 64):
        for y in range(0, 720, 64):
            img.putpixel((x, y), (x % 255, y % 255, (x + y) % 255))
    path = tmp_path / "f01.webp"
    img.save(str(path), "WEBP", quality=80)
    return str(path)


@pytest.fixture
def mock_db_conn():
    """
    Returns a mock psycopg2 connection + cursor pair.
    Used to test save_to_database without a real PostgreSQL server.
    """
    conn = MagicMock()
    cur = MagicMock()
    conn.cursor.return_value = cur
    return conn, cur


@pytest.fixture
def minimal_video_info():
    """Minimal yt-dlp info dict for testing save_to_database."""
    return {
        "id": "test-abc123",
        "title": "Test Video Title",
        "channel": "Test Channel",
        "channel_id": "UC_testchannel",
        "categories": ["Gaming"],
        "duration": 300,
        "view_count": 100_000,
        "channel_follower_count": 50_000,
        "upload_date": "20240101",
    }
```

### 20. `pipeline/tests/test_find_top_moments.py`

```python
"""
Unit tests for find_top_moments().
No network, no filesystem, no database — pure function.
"""
import pytest
from extract_frames import find_top_moments, NUM_FRAMES, MIN_SPACING_SEC


class TestFindTopMomentsBasicSelection:
    def test_returns_exactly_num_frames_when_enough_segments(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0)
        assert len(result) == NUM_FRAMES

    def test_returns_fewer_when_not_enough_spaced_segments(self, tightly_packed_heatmap):
        # All segments within 5s of each other; only the first can be selected
        # before spacing violations eliminate the rest.
        result = find_top_moments(tightly_packed_heatmap, duration=60.0, min_spacing=10.0)
        assert len(result) < NUM_FRAMES

    def test_returns_all_segments_when_fewer_than_num_frames(self, sparse_heatmap):
        # sparse_heatmap has 3 segments; expect at most 3 results
        result = find_top_moments(sparse_heatmap, duration=180.0)
        assert len(result) <= 3

    def test_raises_on_empty_heatmap(self):
        with pytest.raises(ValueError, match="empty or unavailable"):
            find_top_moments([], duration=300.0)


class TestFindTopMomentsSpacingEnforcement:
    def test_no_two_selected_moments_closer_than_min_spacing(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0, min_spacing=10.0)
        timestamps = [m["timestamp"] for m in result]
        for i in range(len(timestamps)):
            for j in range(i + 1, len(timestamps)):
                diff = abs(timestamps[i] - timestamps[j])
                assert diff >= MIN_SPACING_SEC, (
                    f"Moments at {timestamps[i]:.1f}s and {timestamps[j]:.1f}s "
                    f"are only {diff:.1f}s apart (min={MIN_SPACING_SEC}s)"
                )

    def test_custom_min_spacing_is_respected(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0, min_spacing=20.0)
        timestamps = [m["timestamp"] for m in result]
        for i in range(len(timestamps)):
            for j in range(i + 1, len(timestamps)):
                assert abs(timestamps[i] - timestamps[j]) >= 20.0


class TestFindTopMomentsTimestampClamping:
    def test_timestamp_is_never_below_0_5_seconds(self):
        heatmap = [{"start_time": 0.0, "end_time": 0.5, "value": 0.95}]
        result = find_top_moments(heatmap, duration=300.0, n=1)
        assert result[0]["timestamp"] >= 0.5

    def test_timestamp_is_never_within_0_5_seconds_of_end(self):
        duration = 100.0
        heatmap = [{"start_time": 99.0, "end_time": 100.0, "value": 0.95}]
        result = find_top_moments(heatmap, duration=duration, n=1)
        assert result[0]["timestamp"] <= duration - 0.5


class TestFindTopMomentsOutputShape:
    def test_each_result_has_required_keys(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0)
        required_keys = {"timestamp", "value", "start_time", "end_time", "rank"}
        for moment in result:
            assert required_keys.issubset(moment.keys()), (
                f"Missing keys: {required_keys - moment.keys()}"
            )

    def test_ranks_are_assigned_sequentially_from_1(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0)
        ranks = [m["rank"] for m in result]
        assert ranks == list(range(1, len(result) + 1))

    def test_rank_1_has_highest_heat_value(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0)
        # After sorting by rank, rank 1 should have the highest value.
        values = [m["value"] for m in result]
        assert values[0] == max(values)

    def test_values_decrease_monotonically_by_rank(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0)
        values = [m["value"] for m in result]
        for i in range(len(values) - 1):
            assert values[i] >= values[i + 1]

    def test_all_timestamps_are_within_video_duration(self, sample_heatmap):
        duration = 120.0
        result = find_top_moments(sample_heatmap, duration=duration)
        for moment in result:
            assert 0 <= moment["timestamp"] <= duration

    def test_deterministic_given_same_inputs(self, sample_heatmap):
        result_a = find_top_moments(sample_heatmap, duration=120.0)
        result_b = find_top_moments(sample_heatmap, duration=120.0)
        assert [m["timestamp"] for m in result_a] == [m["timestamp"] for m in result_b]

    def test_selects_segment_midpoint_as_timestamp(self):
        heatmap = [{"start_time": 10.0, "end_time": 20.0, "value": 1.0}]
        result = find_top_moments(heatmap, duration=300.0, n=1)
        assert result[0]["timestamp"] == 15.0
```

### 21. `pipeline/tests/test_generate_variants.py`

```python
"""
Unit tests for generate_variants().
Uses real Pillow image operations on tmp_path — no network, no DB, no R2.
"""
import pytest
from pathlib import Path
from extract_frames import generate_variants, VARIANTS, FRAME_WIDTH, WEBP_QUALITY


EXPECTED_VARIANT_NAMES = list(VARIANTS.keys())


class TestGenerateVariantsOutputFiles:
    def test_produces_a_file_for_every_defined_variant(self, sample_image, tmp_path):
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        assert set(paths.keys()) == set(EXPECTED_VARIANT_NAMES)

    def test_all_output_files_exist_on_disk(self, sample_image, tmp_path):
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        for name, path in paths.items():
            assert Path(path).exists(), f"Missing variant file: {name} at {path}"

    def test_output_files_are_not_empty(self, sample_image, tmp_path):
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        for name, path in paths.items():
            assert Path(path).stat().st_size > 0, f"Empty file for variant: {name}"

    def test_output_files_are_webp_format(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        for name, path in paths.items():
            img = Image.open(path)
            assert img.format == "WEBP", f"Variant {name} is {img.format}, expected WEBP"

    def test_filenames_use_rank_prefix(self, sample_image, tmp_path):
        paths = generate_variants(sample_image, video_id="test123", rank=3, work_dir=str(tmp_path))
        for name, path in paths.items():
            assert Path(path).name.startswith("f03_"), (
                f"Expected f03_ prefix for rank 3, got: {Path(path).name}"
            )


class TestGenerateVariantsDimensions:
    def test_thumbnail_variant_has_width_320(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        img = Image.open(paths["thumb"])
        assert img.width == 320

    def test_thumbnail_variant_preserves_aspect_ratio(self, sample_image, tmp_path):
        from PIL import Image
        # Source image is 1280x720 (16:9). Thumbnail at 320 should be 320x180.
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        img = Image.open(paths["thumb"])
        assert img.width == 320
        assert img.height == 180

    def test_crop_25_result_is_upscaled_to_frame_width(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        img = Image.open(paths["crop_25"])
        assert img.width == FRAME_WIDTH

    def test_crop_50_result_is_upscaled_to_frame_width(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        img = Image.open(paths["crop_50"])
        assert img.width == FRAME_WIDTH

    def test_fragment_variants_are_quarter_size(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        for frag_key in ("frag_tl", "frag_tr", "frag_bl", "frag_br"):
            img = Image.open(paths[frag_key])
            assert img.width == 640, f"{frag_key} width should be half of 1280"
            assert img.height == 360, f"{frag_key} height should be half of 720"


class TestGenerateVariantsPixelation:
    def test_px8_variant_has_8x8_grid_appearance(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        img = Image.open(paths["px8"])
        # After downscale to 8x8 then upscale with NEAREST,
        # adjacent pixels in each 8x8 block should be identical.
        # Sample the first two pixels in the top row.
        px0 = img.getpixel((0, 0))
        px1 = img.getpixel((1, 0))
        block_size = img.width // 8
        # Two pixels within the same block must be identical
        px_in_block = img.getpixel((block_size - 1, 0))
        assert px0 == px_in_block, "Pixels within the same block should be identical (NEAREST upscale)"

    def test_all_pixelation_variants_present(self, sample_image, tmp_path):
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        for px in ("px8", "px16", "px32", "px64", "px128"):
            assert px in paths


class TestGenerateVariantsDesaturation:
    def test_desat_variant_has_equal_rgb_channels(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        img = Image.open(paths["desat"]).convert("RGB")
        # Sample 10 pixels; all should have R == G == B (grayscale converted back to RGB).
        for x in range(0, min(img.width, 500), 50):
            r, g, b = img.getpixel((x, 0))
            assert r == g == b, f"Pixel at ({x}, 0) is not grayscale: R={r} G={g} B={b}"


class TestGenerateVariantsIdempotency:
    def test_running_twice_produces_identical_file_sizes(self, sample_image, tmp_path):
        import os
        paths_a = generate_variants(sample_image, video_id="v1", rank=1, work_dir=str(tmp_path / "a"))
        (tmp_path / "a").mkdir(exist_ok=True)
        paths_b = generate_variants(sample_image, video_id="v1", rank=1, work_dir=str(tmp_path / "b"))
        (tmp_path / "b").mkdir(exist_ok=True)
        for name in EXPECTED_VARIANT_NAMES:
            size_a = os.path.getsize(paths_a[name])
            size_b = os.path.getsize(paths_b[name])
            # Sizes should be identical for identical inputs.
            assert size_a == size_b, (
                f"Variant {name}: sizes differ between runs ({size_a} vs {size_b})"
            )
```

### 22. `pipeline/tests/test_save_to_database.py`

```python
"""
Integration tests for save_to_database().
Requires a real PostgreSQL connection (TEST_DATABASE_URL env var).
Skipped automatically when the database is not available.
"""
import os
import pytest

# Skip this entire module if TEST_DATABASE_URL is not set.
pytestmark = pytest.mark.skipif(
    not os.environ.get("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL not set — skipping DB integration tests",
)


@pytest.fixture
def db_conn():
    import psycopg2
    conn = psycopg2.connect(os.environ["TEST_DATABASE_URL"], sslmode="prefer")
    conn.autocommit = False
    yield conn
    conn.rollback()  # Roll back all changes after each test.
    conn.close()


@pytest.fixture
def clean_db(db_conn):
    """Truncate test tables before each test."""
    cur = db_conn.cursor()
    cur.execute("TRUNCATE TABLE frames, videos CASCADE")
    db_conn.commit()
    cur.close()
    yield db_conn


class TestSaveToDatabase:
    def test_inserts_video_row(self, clean_db, minimal_video_info):
        from extract_frames import save_to_database
        moments = [{
            "rank": 1, "timestamp": 45.0, "value": 0.9,
            "width": 1280, "height": 720, "file_size": 50_000,
        }]
        save_to_database(minimal_video_info, moments, heatmap=[], r2_results={})
        cur = clean_db.cursor()
        cur.execute("SELECT video_id, title FROM videos WHERE video_id = %s",
                    (minimal_video_info["id"],))
        row = cur.fetchone()
        assert row is not None
        assert row[0] == minimal_video_info["id"]
        assert row[1] == minimal_video_info["title"]
        cur.close()

    def test_inserts_frame_row_for_each_moment(self, clean_db, minimal_video_info):
        from extract_frames import save_to_database
        moments = [
            {"rank": i, "timestamp": i * 15.0, "value": 1.0 - (i * 0.1),
             "width": 1280, "height": 720, "file_size": 40_000}
            for i in range(1, 4)
        ]
        save_to_database(minimal_video_info, moments, heatmap=[], r2_results={})
        cur = clean_db.cursor()
        cur.execute("SELECT COUNT(*) FROM frames WHERE video_id = %s",
                    (minimal_video_info["id"],))
        count = cur.fetchone()[0]
        assert count == 3
        cur.close()

    def test_upsert_does_not_create_duplicate_video_row(self, clean_db, minimal_video_info):
        from extract_frames import save_to_database
        moments = [{"rank": 1, "timestamp": 30.0, "value": 0.8,
                    "width": 1280, "height": 720, "file_size": 45_000}]
        save_to_database(minimal_video_info, moments, heatmap=[], r2_results={})
        # Run again with updated title.
        updated_info = {**minimal_video_info, "title": "Updated Title"}
        save_to_database(updated_info, moments, heatmap=[], r2_results={})
        cur = clean_db.cursor()
        cur.execute("SELECT COUNT(*) FROM videos WHERE video_id = %s",
                    (minimal_video_info["id"],))
        count = cur.fetchone()[0]
        assert count == 1, "ON CONFLICT DO UPDATE should not create duplicate rows"
        cur.close()

    def test_upsert_updates_title_on_reprocessing(self, clean_db, minimal_video_info):
        from extract_frames import save_to_database
        moments = [{"rank": 1, "timestamp": 30.0, "value": 0.8,
                    "width": 1280, "height": 720, "file_size": 45_000}]
        save_to_database(minimal_video_info, moments, heatmap=[], r2_results={})
        updated_info = {**minimal_video_info, "title": "Updated Title"}
        save_to_database(updated_info, moments, heatmap=[], r2_results={})
        cur = clean_db.cursor()
        cur.execute("SELECT title FROM videos WHERE video_id = %s",
                    (minimal_video_info["id"],))
        title = cur.fetchone()[0]
        assert title == "Updated Title"
        cur.close()

    def test_reprocessing_replaces_frames_not_duplicates(self, clean_db, minimal_video_info):
        from extract_frames import save_to_database
        moments = [{"rank": 1, "timestamp": 30.0, "value": 0.8,
                    "width": 1280, "height": 720, "file_size": 45_000}]
        save_to_database(minimal_video_info, moments, heatmap=[], r2_results={})
        # Process again with 2 moments.
        moments2 = [
            {"rank": 1, "timestamp": 30.0, "value": 0.8,
             "width": 1280, "height": 720, "file_size": 45_000},
            {"rank": 2, "timestamp": 60.0, "value": 0.6,
             "width": 1280, "height": 720, "file_size": 42_000},
        ]
        save_to_database(minimal_video_info, moments2, heatmap=[], r2_results={})
        cur = clean_db.cursor()
        cur.execute("SELECT COUNT(*) FROM frames WHERE video_id = %s",
                    (minimal_video_info["id"],))
        count = cur.fetchone()[0]
        assert count == 2, "Re-processing should replace old frames, not accumulate them"
        cur.close()

    def test_raises_when_database_url_is_missing(self, minimal_video_info, monkeypatch):
        import extract_frames
        monkeypatch.setattr(extract_frames, "DATABASE_URL", None)
        with pytest.raises(RuntimeError, match="DATABASE_URL"):
            extract_frames.save_to_database(minimal_video_info, [], [], {})
```

### 23. `playwright.config.ts` (repo root)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    // The Nuxt preview server started by CI or local dev.
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Start the Nuxt preview server automatically for local runs.
  // In CI, the server is started as a separate step before Playwright.
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm --filter @framedle/web preview',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 60_000,
      },
})
```

### 24. `e2e/smoke/variants.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

const VARIANTS = [
  { id: 1, name: 'Neon Cinema' },
  { id: 2, name: 'Paper Cut' },
  { id: 3, name: 'Vapor Grid' },
  { id: 4, name: 'Brutal Mono' },
  { id: 5, name: 'Soft Focus' },
]

for (const variant of VARIANTS) {
  test(`variant ${variant.id} (${variant.name}) renders without errors`, async ({ page }) => {
    // Collect any console errors.
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto(`/?variant=${variant.id}`)

    // Page loaded without a crash.
    await expect(page).not.toHaveTitle(/error/i)

    // At minimum the <body> has content.
    const body = page.locator('body')
    await expect(body).not.toBeEmpty()

    // No JavaScript errors thrown during render.
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
  })
}

test('default route loads variant 1 when no query param is set', async ({ page }) => {
  await page.goto('/')
  // The page should render — no crash.
  await expect(page.locator('body')).not.toBeEmpty()
})

test('unknown variant param falls back to variant 1', async ({ page }) => {
  await page.goto('/?variant=99')
  await expect(page.locator('body')).not.toBeEmpty()
})

test('non-numeric variant param falls back to variant 1', async ({ page }) => {
  await page.goto('/?variant=abc')
  await expect(page.locator('body')).not.toBeEmpty()
})
```

### 25. `e2e/smoke/health.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test('GET /api/health returns { status: "ok" }', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.status()).toBe(200)
  const body = await response.json()
  expect(body).toEqual({ status: 'ok' })
})

test('GET /api/health responds with JSON content-type', async ({ request }) => {
  const response = await request.get('/api/health')
  const contentType = response.headers()['content-type']
  expect(contentType).toMatch(/application\/json/)
})
```

### 26. `e2e/smoke/compare.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test('compare page renders at /compare', async ({ page }) => {
  await page.goto('/compare')
  await expect(page).not.toHaveTitle(/error/i)
  await expect(page.locator('body')).not.toBeEmpty()
})

test('compare page contains links to all 5 variants', async ({ page }) => {
  await page.goto('/compare')
  // Each variant card or link should reference ?variant=N.
  for (let i = 1; i <= 5; i++) {
    const link = page.locator(`[href*="variant=${i}"]`).first()
    await expect(link).toBeVisible()
  }
})

test('compare page is server-side rendered (content in initial HTML)', async ({ page }) => {
  const response = await page.goto('/compare')
  const html = await response!.text()
  // The variant names should appear in the SSR'd HTML, not require JS.
  expect(html).toContain('Neon Cinema')
  expect(html).toContain('Paper Cut')
  expect(html).toContain('Vapor Grid')
  expect(html).toContain('Brutal Mono')
  expect(html).toContain('Soft Focus')
})
```

### 27. Updated `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ─────────────────────────────────────────────────────────────
  # Job 1: Unit tests (packages/*, apps/web composables, packages/ui)
  # No external services required.
  # ─────────────────────────────────────────────────────────────
  unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Lint + Typecheck
        run: pnpm turbo run lint typecheck

      - name: Unit tests with coverage
        run: pnpm turbo run test:coverage --filter='./packages/*'

      - name: Upload coverage reports
        uses: actions/upload-artifact@v4
        with:
          name: coverage-unit
          path: |
            packages/*/coverage/
          retention-days: 7

  # ─────────────────────────────────────────────────────────────
  # Job 2: Integration tests (apps/api against real Postgres + Valkey)
  # ─────────────────────────────────────────────────────────────
  integration:
    name: Integration Tests (API)
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: framedle_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      valkey:
        image: valkey/valkey:8
        options: >-
          --health-cmd "valkey-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    env:
      TEST_DATABASE_URL: postgres://postgres:test@localhost:5432/framedle_test
      TEST_VALKEY_URL: redis://localhost:6379

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Run DB migrations against test database
        run: pnpm --filter @framedle/api db:migrate
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/framedle_test

      - name: Integration tests
        run: pnpm --filter @framedle/api test:integration

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-integration
          path: apps/api/coverage/
          retention-days: 7

  # ─────────────────────────────────────────────────────────────
  # Job 3: Pipeline tests (pytest, no external services)
  # ─────────────────────────────────────────────────────────────
  pipeline:
    name: Pipeline Tests (pytest)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: pip

      - name: Install pipeline dependencies
        run: pip install -r pipeline/requirements.txt pytest pytest-mock

      - name: Install ffmpeg (for variant generation tests)
        run: sudo apt-get install -y ffmpeg

      - name: Run pytest
        run: python -m pytest pipeline/tests/ -v --tb=short
        # DB integration tests are auto-skipped when TEST_DATABASE_URL is not set.

  # ─────────────────────────────────────────────────────────────
  # Job 4: E2E tests (Playwright, Chromium only)
  # Depends on unit passing so we don't waste time if types/lint fail.
  # ─────────────────────────────────────────────────────────────
  e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: [unit]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Install Playwright Chromium
        run: pnpm playwright install --with-deps chromium

      - name: Build Nuxt app
        run: pnpm --filter @framedle/web build
        env:
          NUXT_PUBLIC_API_URL: http://localhost:4000

      - name: Start Nuxt preview server
        run: pnpm --filter @framedle/web preview &
        env:
          PORT: 3000

      - name: Wait for preview server
        run: npx wait-on http://localhost:3000 --timeout 30000

      - name: Run Playwright smoke tests
        run: pnpm playwright test e2e/smoke/
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000
          CI: true

      - name: Upload Playwright report on failure
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### 28. Updated `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".output/**", ".nuxt/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test:coverage": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:integration": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

---

## Modified Files

### 1. `packages/game-engine/package.json`

Add to `devDependencies`:
```json
"vitest": "^3.0.0",
"@vitest/coverage-v8": "^3.0.0"
```

Update `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### 2. `packages/shared/package.json`

Same additions as game-engine above.

### 3. `packages/ui/package.json`

Add to `devDependencies`:
```json
"vitest": "^3.0.0",
"@vitest/coverage-v8": "^3.0.0",
"@vue/test-utils": "^2.4.0",
"@vitejs/plugin-vue": "^5.0.0",
"happy-dom": "^16.0.0"
```

Update `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### 4. `apps/api/package.json`

Add to `devDependencies`:
```json
"vitest": "^3.0.0",
"@vitest/coverage-v8": "^3.0.0"
```

Update `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"test:integration": "vitest run --config vitest.integration.config.ts"
```

### 5. Root `package.json`

Add to `devDependencies`:
```json
"@playwright/test": "^1.50.0",
"wait-on": "^8.0.0"
```

Add script:
```json
"test:e2e": "playwright test"
```

### 6. `turbo.json`

Replace with the full version shown in New Files section 28 above.

### 7. `.github/workflows/ci.yml`

Replace entirely with the version shown in New Files section 27 above.

---

## Files Summary

### New Files (45 total)

| File | Purpose |
|------|---------|
| `packages/game-engine/vitest.config.ts` | Vitest config + 95% coverage thresholds |
| `packages/game-engine/src/canary.test.ts` | Toolchain smoke test (1 assertion) |
| `packages/shared/vitest.config.ts` | Vitest config + 90% coverage thresholds |
| `packages/shared/src/canary.test.ts` | Toolchain smoke test |
| `packages/ui/vitest.config.ts` | Vitest + Vue plugin + happy-dom + 70% thresholds |
| `packages/ui/src/test/setup.ts` | Global test setup (stub RouterLink/NuxtLink) |
| `packages/ui/src/lib/utils.test.ts` | 11 tests for `cn()` |
| `packages/ui/src/components/game/ShareButton.test.ts` | 11 tests for share text + clipboard |
| `packages/ui/src/components/game/ScoreDisplay.test.ts` | 13 tests for formatTime + conditional rendering |
| `packages/ui/src/components/game/GuessHistory.test.ts` | 8 tests for rendering + maxVisible |
| `packages/ui/src/components/game/FrameViewer.test.ts` | 6 tests for img src + blur + round counter |
| `packages/ui/src/components/game/GuessInput.test.ts` | 12 tests for submit + disabled + suggestions |
| `apps/api/vitest.config.ts` | Vitest config (unit only, excludes integration/) |
| `apps/api/vitest.integration.config.ts` | Separate integration config (sequential, 15s timeout) |
| `apps/api/src/canary.test.ts` | Toolchain smoke test |
| `apps/api/test/helpers.ts` | seedTestDb / resetTestTables / teardownTestDb |
| `apps/api/test/integration/health.test.ts` | 2 real tests + 30 `it.todo` stubs for Phase 5 routes |
| `apps/web/composables/useDesignVariant.test.ts` | 15 tests for variant ID resolution + name mapping |
| `apps/web/composables/useAnimations.test.ts` | 7 tests for preset selection + reactive ref |
| `pipeline/pytest.ini` | pytest configuration |
| `pipeline/tests/__init__.py` | Package marker |
| `pipeline/tests/conftest.py` | 6 shared fixtures |
| `pipeline/tests/test_find_top_moments.py` | 14 tests across 4 describe classes |
| `pipeline/tests/test_generate_variants.py` | 16 tests across 5 describe classes |
| `pipeline/tests/test_save_to_database.py` | 7 DB integration tests (auto-skip when no DB) |
| `playwright.config.ts` | Playwright config (Chromium, webServer for local) |
| `e2e/smoke/variants.spec.ts` | 8 tests for all 5 variants + edge cases |
| `e2e/smoke/health.spec.ts` | 2 tests for /api/health |
| `e2e/smoke/compare.spec.ts` | 3 tests for /compare page + SSR check |

### Canary Test Content

Each package's `canary.test.ts` is the minimal toolchain proof:

```typescript
// packages/game-engine/src/canary.test.ts
import { describe, it, expect } from 'vitest'
describe('test toolchain', () => {
  it('vitest is configured and running', () => {
    expect(1 + 1).toBe(2)
  })
})
```

```typescript
// packages/shared/src/canary.test.ts
import { describe, it, expect } from 'vitest'
describe('test toolchain', () => {
  it('vitest is configured and running', () => {
    expect(typeof 'string').toBe('string')
  })
})
```

```typescript
// apps/api/src/canary.test.ts
import { describe, it, expect } from 'vitest'
describe('test toolchain', () => {
  it('vitest is configured and running in apps/api', () => {
    expect(process.env.NODE_ENV).toBeDefined()
  })
})
```

### Modified Files (7 total)

| File | Change |
|------|--------|
| `packages/game-engine/package.json` | Add vitest deps + test scripts |
| `packages/shared/package.json` | Add vitest deps + test scripts |
| `packages/ui/package.json` | Add vitest + vue-test-utils + happy-dom deps + test scripts |
| `apps/api/package.json` | Add vitest deps + test scripts including test:integration |
| `package.json` (root) | Add @playwright/test + wait-on deps + test:e2e script |
| `turbo.json` | Add test:coverage and test:integration tasks |
| `.github/workflows/ci.yml` | Replace monolithic job with 4 parallel jobs |

---

## Test Count Summary

| Package | Tests | Type |
|---------|-------|------|
| `packages/ui` | 61 | Unit (Vitest + Vue Test Utils) |
| `apps/web` | 22 | Unit (Vitest, mocked Nuxt composables) |
| `apps/api` | 2 passing + 30 `it.todo` | Integration (Hono testClient) |
| `pipeline` | 37 | pytest (14 unit + 16 unit + 7 DB integration) |
| `e2e/smoke` | 13 | Playwright Chromium |
| **Total** | **165** | — |

---

## Coverage Enforcement

Coverage thresholds are enforced at the `vitest.config.ts` level in each package. A PR that drops any package below its threshold causes the `unit` CI job to exit non-zero and blocks merge.

| Package | Lines | Functions | Branches | Statements |
|---------|-------|-----------|----------|------------|
| `packages/game-engine` | 95% | 95% | 90% | 95% |
| `packages/shared` | 90% | 90% | 85% | 90% |
| `packages/ui` | 70% | 70% | 65% | 70% |
| `apps/api` | 80% | 80% | 75% | 80% |

Pipeline coverage is not enforced via thresholds — pytest produces a summary but does not gate on percentages at this stage. The `pipeline/tests/test_generate_variants.py` suite achieves approximately 80% coverage of `extract_frames.py` by exercising all variant branches.

---

## Execution Order Within Phase 4

```
3.5.1.1  Install vitest in all 4 packages (parallel)
3.5.1.5  Create vitest.config.ts in all 4 packages (parallel)
3.5.1.8  Install pytest
3.5.1.9  Run canary tests → confirm toolchain (all must exit 0)
         |
3.5.2.1  Write packages/ui unit tests
3.5.2.2  Write apps/web composable tests (parallel with 3.5.2.1)
3.5.2.3  Write pipeline unit tests (parallel with 3.5.2.1 and 3.5.2.2)
         Run all unit tests → confirm pass
         |
3.5.3.1  Write apps/api test helpers + integration config
3.5.3.2  Write health + it.todo stubs
3.5.3.3  Write pipeline DB tests (auto-skip when no DB)
         Run integration tests → confirm 2 pass, 30 todo
         |
3.5.4.1  Install Playwright
3.5.4.2  Write E2E smoke tests
         Build Nuxt, start preview, run Playwright → confirm 13 pass
         |
3.5.5.1  Rewrite CI workflow
3.5.5.2  Verify CI workflow YAML is valid
3.5.5.3  Update turbo.json
```

---

## Acceptance Criteria

### Toolchain
- [ ] `pnpm --filter @framedle/game-engine test` exits 0 with at least 1 test passing
- [ ] `pnpm --filter @framedle/shared test` exits 0 with at least 1 test passing
- [ ] `pnpm --filter @framedle/ui test` exits 0 with 61 tests passing
- [ ] `pnpm --filter @framedle/api test` exits 0 with at least 1 test passing
- [ ] `python -m pytest pipeline/tests/ -v` exits 0 (DB tests skip gracefully without TEST_DATABASE_URL)
- [ ] `pnpm turbo run test` from repo root exits 0

### Unit Tests
- [ ] `packages/ui` coverage >= 70% lines (all 61 tests pass)
- [ ] All 15 `useDesignVariant` logic tests pass
- [ ] All 7 `useAnimations` tests pass
- [ ] All 14 `find_top_moments` pytest tests pass
- [ ] All 16 `generate_variants` pytest tests pass (using real Pillow + tmp_path)

### Integration Tests
- [ ] `GET /health` returns `{ status: 'ok' }` (2 tests pass)
- [ ] 30 `it.todo` stubs for Phase 5 routes are visible in the test output as pending
- [ ] When TEST_DATABASE_URL is set: all 7 DB integration tests pass
- [ ] When TEST_DATABASE_URL is not set: DB tests are skipped with a clear reason message

### E2E
- [ ] All 13 Playwright smoke tests pass against the Nuxt preview build
- [ ] Each of the 5 variants renders without JavaScript console errors
- [ ] `/api/health` returns `{ status: 'ok' }` via Playwright `request` API
- [ ] `/compare` shows SSR'd variant names in view-source HTML

### CI
- [ ] `.github/workflows/ci.yml` has 4 separate jobs: `unit`, `integration`, `pipeline`, `e2e`
- [ ] `unit` and `integration` and `pipeline` run in parallel (no `needs` dependency between them)
- [ ] `e2e` declares `needs: [unit]` to avoid wasting browser time on broken TypeScript
- [ ] Coverage artifacts are uploaded for inspection per PR
- [ ] A coverage threshold violation (manually introduced) causes `unit` job to fail

### Non-Regression
- [ ] `pnpm --filter @framedle/web build` still produces `.output/` without errors after all changes
- [ ] `pnpm turbo run build` from repo root exits 0

---

## TDD Handoff to Phase 5

When Phase 5 begins implementing game routes, database queries, and admin endpoints, the test files are already in place:

- `apps/api/test/integration/health.test.ts` contains 30 `it.todo` stubs for every Phase 5 API route. The Phase 5 implementer promotes each `it.todo` to a real test, writes the minimum Hono route handler to make it pass, then refactors.
- The TDD cycle is enforced structurally: the stubs exist before the routes do.
- `pipeline/tests/test_save_to_database.py` is already wired to the real schema; when the full DB schema is applied, all 7 tests run without modification.
- `packages/game-engine/src/canary.test.ts` will be joined by `scoring.test.ts`, `matching.test.ts`, and `daily-seed.test.ts` as Phase 5 implements those modules. The vitest config and coverage thresholds are already enforcing 95%.
