# ADR-010: Framework Swap — Nuxt 3 + Vue 3

**Status**: Accepted
**Date**: 2026-03-01
**Deciders**: Core team
**Category**: Frontend Architecture

## Context

Framedle's `apps/web/` was scaffolded with Next.js 15 + React 19 but contained zero application code — only a `package.json`, `next.config.ts`, `Dockerfile`, and `tsconfig.json`. The `packages/ui/` package had an empty `src/index.ts` with no React components. A design sprint required creating 5 visually distinct design variants, making this the ideal moment to swap frameworks before any code investment.

## Decision

Swap the empty Next.js 15 scaffold for **Nuxt 3** with **Vue 3**, using:

- **shadcn-vue** for unstyled component primitives (maximum design flexibility)
- **motion** (motion.dev) for animations with spring physics, scroll-linked animations, and gesture support
- **Tailwind CSS v4** for styling
- **@vueuse/core** for Vue 3 composition utilities

## Drivers

1. **User explicitly requested** Nuxt 3 / Vue 3
2. **No existing application code** to migrate (zero switching cost)
3. **Design sprint requires maximum visual flexibility** — shadcn-vue's unstyled primitives allow 5 radically different designs without fighting a component library's identity
4. **Nuxt 3's Nitro server** produces simpler production builds than Next.js standalone (self-contained `.output/` directory, no `node_modules` at runtime)
5. **ADR-001's cross-platform premise** (Tauri v2 shared codebase) remains valid with Vue 3

## Alternatives Considered

| Alternative | Why Not Chosen |
|-------------|----------------|
| Keep Next.js 15 + React 19 | User explicitly requested Vue/Nuxt. No code exists to preserve. |
| Nuxt 3 + Nuxt UI v3 | Opinionated styling reduces design distinctiveness across 5 variants |
| Nuxt 3 + Vuetify 3 | Material Design language homogenizes variants |
| Nuxt 3 + PrimeVue | Strong component identity fights variant diversity |

## Consequences

### Positive

- Zero migration cost — only scaffold files replaced
- shadcn-vue gives maximum control for 5 distinct design variants
- Nitro server simplifies Docker deployment (`.output/server/index.mjs` — no `node_modules`)
- Vue 3 Composition API + `<script setup>` is concise and productive
- Tauri v2 supports Nuxt as a frontend framework via standard configuration (SSR disabled for Tauri builds)

### Negative

- `packages/ui/` must export Vue SFCs instead of React components
- All future frontend contributors need Vue 3 knowledge
- XState integration uses `@xstate/vue` instead of `@xstate/react`
- Animation library is motion (motion.dev) instead of Framer Motion
- shadcn-vue is community-maintained (smaller ecosystem than React shadcn)

### Documentation Impact

74 React/Next.js references across 17 files must be updated (tracked in design sprint plan Phase 6, task 6.6).

### Related ADRs

- **ADR-001** (Tauri over Electron): Status Update addendum added — "single React codebase" is now "single Vue 3 codebase." Cross-platform benefit preserved.
- **ADR-002** (Auth Provider): React SDK references will be updated to Vue SDK in Phase 6 documentation sweep.

## References

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [shadcn-vue](https://www.shadcn-vue.com/)
- [motion.dev Vue 3 Support](https://motion.dev/docs/vue-quick-start)
- [Tauri v2 + Nuxt Configuration](https://v2.tauri.app/start/frontend/nuxt/)
