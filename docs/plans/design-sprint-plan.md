# Framedle Design Sprint Plan

## Nuxt 3 Migration + 5 Design Variants + Production Deployment

**Created:** 2026-03-01
**Status:** APPROVED -- Consensus reached (Architect + Critic)
**Complexity:** MEDIUM-HIGH
**Estimated scope:** 6 phases, ~15 files changed/created, 2 packages rewritten, 17 documentation files updated (74 occurrences)

---

## RALPLAN-DR Summary

### Principles

1. **Zero-code advantage** -- No application code exists yet; this is a framework swap, not a migration. Exploit the clean slate fully.
2. **Shared logic isolation** -- Game engine, API client, and shared types remain framework-agnostic TypeScript. Only the UI layer and web app change.
3. **Design-first iteration** -- Use the Anthropic frontend-design skill to produce distinctive, non-generic designs. Each variant must be immediately distinguishable from the others.
4. **Infrastructure reuse** -- The VPS, Coolify, Cloudflare DNS, and API are already deployed and working. Minimize deployment changes.
5. **Reversibility** -- Keep all 5 design variants in the repo as switchable themes/layouts so the chosen design can be changed later without rework.

### Decision Drivers (Top 3)

1. **Speed to visual output** -- The user wants to see 5 distinct designs running locally as fast as possible. Every decision should optimize for time-to-first-render.
2. **Design distinctiveness** -- Each variant must look fundamentally different (not just color swaps). Typography, layout structure, animation style, and visual metaphor must vary.
3. **Production-readiness** -- The chosen design must deploy cleanly to the existing Coolify/Traefik infrastructure at framedle.wtf with minimal config changes.

### Viable Options

#### Option A: Nuxt 3 + shadcn-vue (RECOMMENDED)

| Pros | Cons |
|------|------|
| shadcn-vue components are unstyled primitives -- easy to theme drastically differently per variant | Smaller ecosystem than React shadcn (fewer community components) |
| Nuxt 3 has excellent SSR, auto-imports, file-based routing out of the box | Team must learn Vue 3 Composition API if unfamiliar |
| Nitro server produces a self-contained .output/ directory -- simpler Dockerfile than Next.js standalone | shadcn-vue is community-maintained (not Anthropic/Vercel backed) |
| Tailwind CSS v4 integration is first-class in Nuxt | -- |
| Tauri v2 documents Nuxt as a supported frontend framework via standard configuration (SSR disabled for Tauri builds) | -- |

#### Option B: Nuxt 3 + Nuxt UI v3

| Pros | Cons |
|------|------|
| Official Nuxt team library, deeply integrated with Nuxt module system | Opinionated component styling makes radical visual differentiation harder |
| Built-in dark mode, color system, and design tokens | Heavier dependency footprint |
| App Config-based theming allows variant switching via config | Components have a recognizable "Nuxt UI look" that may limit design distinctiveness |
| Excellent DX with auto-imports | Less control over low-level component markup |

#### Why Option A wins

The primary goal is **5 visually distinct designs**. shadcn-vue's unstyled primitive approach gives maximum control over every visual aspect, while Nuxt UI's opinionated styling would make variants look like theme variations of the same design system rather than truly different designs. The Anthropic frontend-design skill specifically encourages bold, unconventional design choices that are easier to achieve with unstyled primitives.

#### Invalidated Alternatives

- **Keep Next.js / React**: No code exists yet, and the user explicitly requested Nuxt 3. No migration cost, only swap cost. Invalidated by explicit user requirement.
- **Nuxt 3 + Vuetify**: Material Design language would make all 5 variants look like Material apps with different colors. Invalidated by design distinctiveness driver.
- **Nuxt 3 + PrimeVue**: Similar problem to Vuetify -- strong visual identity in the component library fights against variant distinctiveness.

#### ADR-001 Impact Note

ADR-001 ("Tauri over Electron") premises a "single React codebase" shared across web, desktop, and mobile. This framework swap invalidates that premise: the codebase will use Vue 3 / Nuxt 3 instead of React. ADR-001 must receive an addendum in Phase 2 (task 2.8) documenting that the "single codebase" benefit still holds (Tauri v2 supports Nuxt via standard configuration with SSR disabled for Tauri builds), but the framework is now Vue 3, not React.

---

## Context

Framedle is a daily YouTube guessing game (Wordle meets YouTube) with 12 game modes. The monorepo is scaffolded with Turborepo + pnpm but contains zero application code. The `apps/web/` directory has only a Next.js package.json, Dockerfile, and config -- no pages, components, or layouts. The `packages/ui/` directory has an empty `src/index.ts`. This is the ideal moment to swap frameworks before any code investment.

The API (`apps/api/` with Hono) is already deployed at `api.framedle.wtf`. Infrastructure (PostgreSQL, Valkey, Logto) runs on the VPS via Coolify. The frontend just needs to be built and deployed.

---

## Work Objectives

1. Install the Anthropic frontend-design skill globally so Claude Code sessions produce distinctive UI
2. Replace the Next.js scaffold with Nuxt 3 in `apps/web/`
3. Rewrite `packages/ui/` as Vue 3 SFC components with shadcn-vue primitives
4. Create 5 visually distinct design variants for the Framedle homepage and game board
5. Run all 5 variants locally for side-by-side comparison
6. Deploy the chosen variant to production at framedle.wtf via Coolify

---

## Guardrails

### Must Have

- All 5 designs must render the same game board layout (frame image area, guess input, guess history, score display)
- Each design must use different: color palette, typography pairing, layout approach, animation style
- The game engine (XState v5) and API client packages must remain unchanged (framework-agnostic TypeScript)
- Nuxt 3 must use SSR mode (not SPA) for SEO and social sharing meta tags
- The Dockerfile must produce a working Nitro production build
- Tailwind CSS must be the styling foundation for all variants

### Must NOT Have

- No React code anywhere in the final output (clean Vue 3 only)
- No heavyweight UI framework (Vuetify, PrimeVue, Element Plus) that would homogenize the designs
- No changes to `apps/api/`, `packages/shared/`, `packages/game-engine/`, `packages/api-client/`, or `pipeline/`
- No changes to the VPS infrastructure, Coolify server config, or DNS records
- No database schema changes

---

## Task Flow

```
Phase 1 (Skill Install)
    |
    v
Phase 2 (Framework Swap + ADR Updates)
    |
    v
Phase 3 (Design Infrastructure)
    |
    v
Phase 4 (5 Design Variants) -- can parallelize variant creation
    |
    v
Phase 5 (Local Deployment)
    |
    v
Phase 6 (Production Deployment + Documentation Blast Radius) -- after user picks a winner
```

---

## Phase 1: Install Anthropic Frontend-Design Skill

**Objective:** Make the frontend-design skill available globally for all Claude Code sessions.

### Tasks

1.1. Create the skill directory and download the SKILL.md file:
```bash
mkdir -p ~/.claude/skills/frontend-design
curl -o ~/.claude/skills/frontend-design/SKILL.md \
  https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md
```

1.2. Verify the skill is loaded by checking Claude Code recognizes it.

### Acceptance Criteria

- [ ] File exists at `~/.claude/skills/frontend-design/SKILL.md`
- [ ] Claude Code sessions have access to frontend-design principles (bold typography, unexpected palettes, asymmetric layouts, visual depth)

---

## Phase 2: Framework Swap (Next.js to Nuxt 3)

**Objective:** Replace the empty Next.js scaffold with a working Nuxt 3 project. Update `packages/ui/` from React to Vue 3. Record the framework decision in ADRs immediately.

### Tasks

2.1. **Scaffold Nuxt 3 in `apps/web/`**
- Remove Next.js files: `next.config.ts`, existing `package.json` dependencies (next, react, react-dom)
- Initialize Nuxt 3 with: `nuxt`, `vue`, `vue-router` (auto-included)
- Create `nuxt.config.ts` with SSR enabled, Tailwind CSS module, auto-imports
- Create minimal directory structure: `pages/index.vue`, `layouts/default.vue`, `app.vue`
- Update `tsconfig.json` to extend `.nuxt/tsconfig.json`

2.2. **Set up `packages/ui/` for Vue 3**
- Add Vue 3, `@vueuse/core`, `motion` (motion.dev -- Vue 3 support with spring physics), and shadcn-vue to `packages/ui/package.json`
- Note: `packages/ui/package.json` currently has zero React dependencies; this task adds Vue deps, it does not remove React deps
- Set up shadcn-vue primitives (radix-vue based)
- Create `src/index.ts` re-exporting Vue components
- Update `tsconfig.json` for Vue SFC support

2.3. **Update `turbo.json`**
- Change build outputs from `.next/**` to `.output/**`, `.nuxt/**`
- Note: CI workflow (`.github/workflows/ci.yml`) is framework-agnostic (runs `turbo build/test/lint`), so no CI changes are needed beyond `turbo.json` outputs

2.4. **Update `apps/web/Dockerfile`**
- Rewrite for Nitro standalone output (simpler than Next.js standalone)
- Nitro produces `.output/` with `server/index.mjs` -- no `node_modules` needed in prod image

2.5. **Update `docker-compose.coolify.yml` and `.env.template`**
- Change environment variables from `NEXT_PUBLIC_*` to `NUXT_PUBLIC_*` in `docker-compose.coolify.yml`
- Update `.env.template` lines 51-63: rename `NEXT_PUBLIC_*` vars to `NUXT_PUBLIC_*` and update associated comments
- Update health check path if needed

2.6. **Create health check endpoint**
- Create `apps/web/server/api/health.get.ts` returning `{ status: 'ok' }`
- The `docker-compose.coolify.yml` health check hits `/api/health` -- Nuxt 3's Nitro server routes map `server/api/health.get.ts` to `GET /api/health` automatically

2.7. **Update `apps/web/AGENTS.md`**
- Replace Next.js references with Nuxt 3 conventions

2.8. **Write ADR addendum and create ADR-010 (record decision at time of swap)**
- Add a "Status Update" addendum to `docs/adr/001-tauri-over-electron.md` noting that the "single React codebase" premise is now "single Vue 3 codebase." The cross-platform benefit remains valid: Tauri v2 supports Nuxt as a frontend framework via standard configuration (SSR disabled for Tauri builds). The shared-codebase argument still holds; only the framework has changed.
- Create `docs/adr/010-nuxt3-framework-swap.md` with the full ADR from this plan's ADR section below. Record the decision now, when it happens, not retroactively in Phase 6.

2.9. **Run `pnpm install` and verify `pnpm dev` starts without errors**

### Acceptance Criteria

- [ ] `pnpm --filter @framedle/web dev` starts Nuxt dev server on port 3000
- [ ] Visiting `http://localhost:3000` renders a basic page
- [ ] `pnpm --filter @framedle/web build` produces `.output/` directory
- [ ] `GET /api/health` returns `{ status: 'ok' }` on the dev server
- [ ] `packages/ui/` exports at least one Vue component
- [ ] `turbo.json` outputs include `.output/**` and `.nuxt/**`
- [ ] Dockerfile builds successfully with `docker build -f apps/web/Dockerfile .`
- [ ] No React imports remain anywhere in `apps/web/` or `packages/ui/`
- [ ] `.env.template` uses `NUXT_PUBLIC_*` naming (no remaining `NEXT_PUBLIC_*`)
- [ ] ADR-001 addendum is written in `docs/adr/001-tauri-over-electron.md`
- [ ] ADR-010 exists at `docs/adr/010-nuxt3-framework-swap.md`

---

## Phase 3: Design Infrastructure

**Objective:** Set up the shared design system foundation that all 5 variants will build on.

### Tasks

3.1. **Tailwind CSS v4 configuration**
- Install `@nuxtjs/tailwindcss` module
- Create `tailwind.config.ts` with design token structure that supports variant switching
- Set up CSS custom properties for variant-specific tokens (colors, fonts, spacing scale, border-radius)
- Configure `@font-source` or Google Fonts for multiple typeface pairings

3.2. **Animation infrastructure**
- Install `motion` (motion.dev) for declarative animations with Vue 3 support
- motion.dev provides spring physics, scroll-linked animations, and gesture support -- capabilities needed by Variant 5 (spring physics) and Variant 1 (glitch effects) that `@vueuse/motion` lacks
- Create shared animation presets (entrance, exit, hover, stagger, spring) as composables
- Set up CSS `@keyframes` for variant-specific motion styles (neon flicker, paper unfold, scanlines, typewriter, parallax)

3.3. **Component primitives via shadcn-vue**
- Initialize shadcn-vue with `npx shadcn-vue@latest init`
- Add base components: Button, Input, Card, Dialog, Badge, Skeleton
- These are unstyled primitives that each variant will style differently

3.4. **Game board layout components (variant-agnostic)**
- `FrameViewer.vue` -- displays the YouTube frame image with progressive reveal
- `GuessInput.vue` -- search-as-you-type input for video title guessing
- `GuessHistory.vue` -- shows previous guesses with correct/incorrect indicators
- `ScoreDisplay.vue` -- points, streak, timer
- `ShareButton.vue` -- generates and copies emoji share grid
- These components handle logic and structure; visual styling comes from variants

3.5. **Variant switching mechanism**
- Create a `useDesignVariant()` composable that reads from URL query param (`?variant=1..5`) or env var
- Each variant provides its own Tailwind theme extension, layout component, and animation config
- Variant assets stored in `apps/web/variants/v1/` through `apps/web/variants/v5/`

### Acceptance Criteria

- [ ] Tailwind CSS compiles with custom design tokens
- [ ] shadcn-vue primitives render correctly in dev
- [ ] `useDesignVariant()` composable switches themes based on `?variant=N`
- [ ] Game board components render with placeholder/mock data
- [ ] Animation composables produce visible motion effects (including spring physics)
- [ ] 5 variant directories exist under `apps/web/variants/`

---

## Phase 4: Five Design Variants

**Objective:** Create 5 visually distinct designs, each with its own identity, using the Anthropic frontend-design skill for creative direction.

Each variant must implement: homepage hero, game board page, results/share modal. All share the same game logic components from Phase 3.

### Variant 1: "Neon Cinema"
- **Visual metaphor:** Late-night movie theater marquee
- **Palette:** Deep black (#0a0a0a) with electric neon accents (cyan #00f0ff, magenta #ff00aa, yellow #f0ff00)
- **Typography:** Bold condensed sans-serif headers (e.g., Bebas Neue), monospace body text
- **Layout:** Center-weighted, dramatic vertical spacing, frame image as hero with neon glow border
- **Animation:** Neon flicker on load, smooth slide-up reveals, glitch effects on wrong guesses (CSS `@keyframes` + motion.dev for orchestration)
- **Mood:** Arcade, cinematic, nocturnal

### Variant 2: "Paper Cut"
- **Visual metaphor:** Handcrafted paper collage / scrapbook
- **Palette:** Warm cream (#faf3e0), muted earth tones (terracotta #c46d3e, olive #6b7c4e, dusty blue #6b8fad)
- **Typography:** Handwritten-style headers (e.g., Caveat), clean serif body (e.g., Lora)
- **Layout:** Asymmetric, slightly rotated cards, torn-edge borders, layered depth with shadows
- **Animation:** Paper unfold reveals, gentle float/sway on hover, stamp effect on correct guess
- **Mood:** Warm, tactile, analog nostalgia

### Variant 3: "Vapor Grid"
- **Visual metaphor:** Retro-futurism / vaporwave / CRT monitor
- **Palette:** Gradient-heavy (sunset pink #ff6b9d to purple #c44dff to blue #4d79ff), chrome silver accents
- **Typography:** Geometric sans-serif (e.g., Orbitron or Space Grotesk), all-caps headers
- **Layout:** Grid-dominant, floating cards with perspective transforms, scanline overlays
- **Animation:** Smooth 3D card flips, gradient shifts, retro TV static on transitions
- **Mood:** Synthwave, nostalgic future, playful excess

### Variant 4: "Brutal Mono"
- **Visual metaphor:** Developer terminal / brutalist web
- **Palette:** Pure white (#ffffff) and pure black (#000000) with a single accent (electric blue #0066ff or red #ff3333)
- **Typography:** Monospace everything (e.g., JetBrains Mono), heavy weight headers, tight letter-spacing
- **Layout:** Strict grid, visible borders, raw structure, no border-radius, dense information layout
- **Animation:** Minimal -- instant state changes, cursor blink, typewriter text reveals
- **Mood:** Raw, functional, anti-design, developer-chic

### Variant 5: "Soft Focus"
- **Visual metaphor:** Premium streaming app / modern media player
- **Palette:** Deep charcoal (#1a1a2e) with soft gradients, frosted glass effects, subtle warm accents (amber #f4a261, soft coral #e76f51)
- **Typography:** Clean geometric sans-serif (e.g., Inter or Plus Jakarta Sans), generous letter-spacing, light weights for body
- **Layout:** Spacious, centered content, generous padding, rounded corners (16px+), backdrop-blur cards
- **Animation:** Spring physics on interactions (motion.dev `spring()`), smooth parallax (motion.dev `scroll()`), elegant fade-crossfade transitions
- **Mood:** Premium, calm, polished, streaming-app quality

### Tasks per variant (x5)

4.N.1. Create variant directory: `apps/web/variants/vN/`
4.N.2. Define Tailwind theme extension (colors, fonts, border-radius, shadows) in `theme.ts`
4.N.3. Create variant layout component with unique structural approach
4.N.4. Style all game board components with variant-specific classes
4.N.5. Implement variant-specific animations and transitions
4.N.6. Create homepage hero section with variant visual identity
4.N.7. Test the variant renders correctly with mock game data

### Acceptance Criteria

- [ ] Each variant is visually distinct -- a screenshot of each would look like 5 different apps
- [ ] All variants render the same game board functionality (frame reveal, guess input, history, score)
- [ ] Switching `?variant=1` through `?variant=5` loads the correct design
- [ ] Each variant has: unique color palette, unique typography pairing, unique layout structure, unique animation style
- [ ] All variants are responsive (mobile, tablet, desktop)
- [ ] No variant uses default/generic Tailwind styling (no "AI slop")

---

## Phase 5: Local Deployment for Review

**Objective:** Run all 5 variants locally so the user can compare them side-by-side.

### Tasks

5.1. **Dev server with variant switching**
- Start `pnpm --filter @framedle/web dev` on port 3000
- Access variants at:
  - `http://localhost:3000?variant=1` (Neon Cinema)
  - `http://localhost:3000?variant=2` (Paper Cut)
  - `http://localhost:3000?variant=3` (Vapor Grid)
  - `http://localhost:3000?variant=4` (Brutal Mono)
  - `http://localhost:3000?variant=5` (Soft Focus)

5.2. **Create a comparison landing page**
- Build `pages/compare.vue` that shows all 5 variants in iframe panels or linked cards
- Each card shows variant name, description, and a thumbnail/preview
- Click to open full-screen preview of that variant

5.3. **Verify production build**
- Run `pnpm --filter @framedle/web build` and start the Nitro preview server
- Confirm all 5 variants work in production mode

### Acceptance Criteria

- [ ] All 5 variants are accessible via URL parameter in dev mode
- [ ] Comparison page renders at `/compare` with links to all 5 variants
- [ ] Production build completes without errors
- [ ] Production preview server renders all variants correctly
- [ ] User can visually compare all 5 designs

---

## Phase 6: Production Deployment + Documentation Update

**Objective:** Deploy the user's chosen design variant to framedle.wtf via Coolify. Update all documentation across the repository to reflect the React-to-Vue/Nuxt framework change.

### Tasks

6.1. **Set chosen variant as default**
- Update `nuxt.config.ts` to set the default variant (remove query param requirement)
- Optionally strip variant switching code for production, or keep it for future A/B testing

6.2. **Configure Cloudflare caching for variant query params**
- If variant switching is kept for production/A/B testing, configure Cloudflare cache rules to include `?variant=N` query strings in the cache key
- Without this, Cloudflare may serve cached Variant 1 HTML to a `?variant=3` request
- If variant switching is stripped for production (single design), this step can be skipped

6.3. **Build and push Docker image**
- Verify Dockerfile builds correctly with `docker build -f apps/web/Dockerfile .`
- Push to the repo (Coolify will auto-deploy via push-to-deploy)

6.4. **Update Coolify environment variables**
- Set `NUXT_PUBLIC_API_URL=https://api.framedle.wtf`
- Set `NUXT_PUBLIC_LOGTO_ENDPOINT` and `NUXT_PUBLIC_LOGTO_APP_ID`
- Update `APP_DOMAIN=framedle.wtf` if not already set

6.5. **Verify production deployment**
- Confirm `https://framedle.wtf` serves the chosen design
- Confirm Traefik routes correctly (HTTPS, correct port)
- Confirm health check endpoint at `/api/health` responds with `{ status: 'ok' }`
- Test on mobile viewport

6.6. **Documentation update -- full blast radius (74 occurrences across 17 files)**

Update all React/Next.js references to Vue 3/Nuxt 3 across the repository. The Critic audit found 74 occurrences across 17 files:

- [ ] `CLAUDE.md` -- 4 occurrences (React 19, Next.js 15, Framer Motion, App Router references)
- [ ] `AGENTS.md` -- 10 occurrences (React, Next.js references in agent guides)
- [ ] `README.md` -- 5 occurrences (tech stack description, getting started)
- [ ] `apps/web/AGENTS.md` -- 3 occurrences (already partially handled in Phase 2 task 2.7, verify completeness)
- [ ] `docker-compose.yml` -- 1 comment referencing Next.js
- [ ] `.env.template` -- 1 comment + 4 `NEXT_PUBLIC_*` vars (already handled in Phase 2 task 2.5, verify completeness)
- [ ] `docs/architecture/system-architecture.md` -- 8 occurrences (frontend architecture section, component references)
- [ ] `docs/architecture/tech-stack.md` -- 6 occurrences (framework column, dependency list)
- [ ] `docs/architecture/vps-deployment.md` -- 12 occurrences (build process, Dockerfile references, resource estimates)
- [ ] `docs/architecture/cost-analysis.md` -- 1 occurrence
- [ ] `docs/architecture/test-strategy.md` -- 1 occurrence (testing framework references)
- [ ] `docs/project-overview.md` -- 2 occurrences (tech stack summary)
- [ ] `docs/project-management/roadmap.md` -- 3 occurrences (milestone descriptions)
- [ ] `docs/project-management/linear-issues.md` -- 5 occurrences (issue descriptions)
- [ ] `docs/project-management/linear-setup.md` -- 1 occurrence
- [ ] `docs/adr/001-tauri-over-electron.md` -- 8 occurrences (already has addendum from Phase 2 task 2.8; verify all inline React references are updated or annotated)
- [ ] `docs/adr/002-auth-provider.md` -- 2 occurrences (React SDK references)

### Acceptance Criteria

- [ ] `https://framedle.wtf` serves the chosen design variant
- [ ] Page loads with SSR (view-source shows rendered HTML)
- [ ] Traefik HTTPS certificate is valid
- [ ] Health check at `/api/health` returns 200 with `{ status: 'ok' }`
- [ ] Mobile viewport renders correctly
- [ ] All 17 documentation files listed above are updated (74 occurrences resolved)
- [ ] No stale React/Next.js references remain in documentation (verified via `grep -r "React\|Next\.js\|next\.js\|Framer Motion" docs/ CLAUDE.md AGENTS.md README.md` returning only historical/ADR context)
- [ ] Cloudflare cache configuration is documented or applied (if variant switching is kept)

---

## ADR (Architectural Decision Record)

### Decision

Swap the empty Next.js 15 scaffold for Nuxt 3 with Vue 3, using shadcn-vue for unstyled component primitives, motion (motion.dev) for animations, and Tailwind CSS v4 for styling.

### Drivers

1. User explicitly requested Nuxt 3 / Vue 3
2. No existing application code to migrate (zero switching cost)
3. Nuxt 3's Nitro server produces simpler production builds than Next.js standalone
4. Design sprint requires maximum visual flexibility (shadcn-vue unstyled primitives)
5. ADR-001's cross-platform premise (Tauri v2 shared codebase) remains valid with Vue 3

### Alternatives Considered

| Alternative | Why Not Chosen |
|-------------|----------------|
| Keep Next.js 15 + React 19 | User explicitly requested Vue/Nuxt. No code exists to preserve. |
| Nuxt 3 + Nuxt UI v3 | Opinionated styling reduces design distinctiveness across 5 variants |
| Nuxt 3 + Vuetify 3 | Material Design language homogenizes variants |
| Nuxt 3 + PrimeVue | Same problem -- strong component identity fights variant diversity |

### Why Chosen

- Zero migration cost (no code exists)
- shadcn-vue gives maximum control for 5 distinct design variants
- Nitro server simplifies Docker deployment
- Vue 3 Composition API + `<script setup>` is concise and productive
- Tauri v2 supports Nuxt as a frontend framework via standard configuration (SSR disabled for Tauri builds) -- the cross-platform codebase benefit from ADR-001 is preserved

### Consequences

- `packages/ui/` must export Vue SFCs instead of React components
- All future frontend contributors need Vue 3 knowledge
- XState integration uses `@xstate/vue` instead of `@xstate/react`
- Animation library is motion (motion.dev) instead of Framer Motion -- provides spring physics, scroll-linked animations, and gesture support for Vue 3
- ADR-001 premise of "single React codebase" is invalidated and replaced with "single Vue 3 codebase" (addendum required)
- 74 documentation occurrences across 17 files must be updated (see Phase 6 task 6.6 for full list)

### Follow-ups

- ADR-001 addendum written in Phase 2 (task 2.8), not deferred
- ADR-010 created in Phase 2 (task 2.8), not deferred
- Full documentation blast radius addressed in Phase 6 (task 6.6) -- 17 files, 74 occurrences
- CI workflow is framework-agnostic (`turbo build/test/lint`); no CI changes needed beyond `turbo.json` outputs
- Cloudflare cache rules may need query-string inclusion if variant switching is kept in production (Phase 6 task 6.2)

---

## Success Criteria (Overall)

1. The Anthropic frontend-design skill is installed globally and active
2. `apps/web/` runs Nuxt 3 with SSR, not Next.js
3. `packages/ui/` exports Vue 3 SFC components, not React
4. 5 visually distinct design variants are accessible locally via URL parameter
5. Each variant looks like a fundamentally different application (not just re-colored)
6. The user has chosen one variant and it is deployed to `https://framedle.wtf`
7. All 17 documentation files are updated to reflect the framework change (74 occurrences)
8. ADR-001 addendum and ADR-010 are written and committed

---

## Files Changed/Created Summary

### Deleted
- `apps/web/next.config.ts`

### Rewritten
- `apps/web/package.json` (Next.js deps -> Nuxt 3 deps)
- `apps/web/tsconfig.json` (extend .nuxt/tsconfig.json)
- `apps/web/Dockerfile` (Nitro build instead of Next.js standalone)
- `apps/web/AGENTS.md` (Nuxt 3 conventions)
- `packages/ui/package.json` (add Vue 3, @vueuse/core, motion, shadcn-vue deps)
- `packages/ui/src/index.ts` (Vue component exports)
- `packages/ui/tsconfig.json` (Vue SFC support)
- `turbo.json` (output paths)
- `docker-compose.coolify.yml` (env var naming)
- `.env.template` (NEXT_PUBLIC_* -> NUXT_PUBLIC_*)

### Created
- `apps/web/nuxt.config.ts`
- `apps/web/app.vue`
- `apps/web/layouts/default.vue`
- `apps/web/pages/index.vue`
- `apps/web/pages/compare.vue`
- `apps/web/server/api/health.get.ts`
- `apps/web/variants/v1/` through `apps/web/variants/v5/` (theme + layout per variant)
- `packages/ui/src/components/` (Vue SFC components)
- `docs/adr/010-nuxt3-framework-swap.md`

### Updated (Documentation -- Phase 6 blast radius)
- `CLAUDE.md` (4 occurrences)
- `AGENTS.md` (10 occurrences)
- `README.md` (5 occurrences)
- `docker-compose.yml` (1 comment)
- `docs/architecture/system-architecture.md` (8 occurrences)
- `docs/architecture/tech-stack.md` (6 occurrences)
- `docs/architecture/vps-deployment.md` (12 occurrences)
- `docs/architecture/cost-analysis.md` (1 occurrence)
- `docs/architecture/test-strategy.md` (1 occurrence)
- `docs/project-overview.md` (2 occurrences)
- `docs/project-management/roadmap.md` (3 occurrences)
- `docs/project-management/linear-issues.md` (5 occurrences)
- `docs/project-management/linear-setup.md` (1 occurrence)
- `docs/adr/001-tauri-over-electron.md` (addendum + 8 occurrences)
- `docs/adr/002-auth-provider.md` (2 occurrences)

### Unchanged (Zero-touch)
- `apps/api/` -- Hono API, already deployed
- `packages/shared/` -- Framework-agnostic TypeScript
- `packages/game-engine/` -- XState v5, framework-agnostic
- `packages/api-client/` -- HTTP client, framework-agnostic
- `pipeline/` -- Python ETL pipeline
- `docker-compose.yml` -- Local dev infrastructure (PostgreSQL, Valkey, Logto) (1 comment updated in Phase 6)
- `.github/workflows/ci.yml` -- Framework-agnostic (runs `turbo build/test/lint`), no changes needed
