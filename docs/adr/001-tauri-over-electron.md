# ADR-001: Application Framework — Tauri v2

**Status**: Accepted
**Date**: 2026-02-22
**Deciders**: Core team
**Category**: Client Architecture

## Context

Framedle needs to ship on **Web, Windows, macOS, Linux, iOS, and Android** from a single React codebase. The app is image-heavy (frame reveals, drag-and-drop), requires WebSocket support (Duels), and needs local storage for offline/anonymous play.

## Options Considered

### Option A: Electron

| Aspect | Details |
|--------|---------|
| Maturity | Proven at scale (VS Code, Discord, Slack) |
| Rendering | Chromium-based — guaranteed consistency |
| Binary size | ~150MB minimum |
| Memory | ~200-300MB baseline |
| Mobile | Not supported — would need React Native separately |
| Plugins | Large ecosystem |

### Option B: Tauri v2 ✅ Selected

| Aspect | Details |
|--------|---------|
| Maturity | v2 stable since late 2024, growing ecosystem |
| Rendering | OS-native webview (WebView2/WebKit/WKWebView) |
| Binary size | ~5-15MB |
| Memory | ~30-50MB |
| Mobile | iOS and Android supported (stable) |
| Backend | Rust — high performance native code |
| Plugins | Growing ecosystem, official plugins for core needs |

### Option C: React Native + Electron

| Aspect | Details |
|--------|---------|
| Codebase | Two separate native layers to maintain |
| Rendering | Different engines (RN Fabric vs Chromium) |
| Code sharing | Limited to business logic only |
| Maintenance | 2× the platform-specific bugs |

## Decision

**Tauri v2** — all six platforms from one codebase with dramatically better resource usage than Electron. Mobile support eliminates the need for React Native.

## Architecture Impact

```
apps/
├── web/           # Next.js 15 (SSR, SEO, share pages)
├── desktop/       # Tauri v2 → Windows, macOS, Linux
│   ├── src-tauri/ # Rust backend (native plugins)
│   └── src/       # React frontend (imports packages/)
└── mobile/        # Tauri v2 → iOS, Android
    ├── src-tauri/
    └── src/

packages/
├── ui/            # Shared React components (used by all 3 apps)
├── game-engine/   # Pure TypeScript game logic
└── shared/        # Constants, types, utils
```

The web app uses Next.js for SSR/SEO (share pages, landing page). Desktop and mobile apps use Tauri v2 wrapping the same React components from `packages/ui`.

## Consequences

### Positive

- 10× smaller app size than Electron (~10MB vs ~150MB)
- 5× lower memory usage (~40MB vs ~200MB)
- True native feel on all platforms
- Single codebase for web + desktop + mobile
- Rust backend enables high-performance native features (SQLite caching, image processing, push notifications)
- Smaller download → better conversion from "download" to "play"

### Negative

- Tauri mobile is newer — may encounter edge cases
- WebView rendering differences across OS versions (Safari on iOS vs Chrome on Android vs Edge WebView2 on Windows)
- Smaller plugin ecosystem compared to Electron
- Team needs basic Rust knowledge for native plugins
- WebView version fragmentation on older Android devices

### Mitigations

- Feature detection + CSS containment for WebView differences
- Automated cross-platform testing via CI (desktop: GitHub Actions matrix; mobile: device farms)
- Wrap Rust-specific code in a thin adapter layer (most plugins are thin wrappers)
- 95% of game logic is pure TypeScript in `packages/game-engine` — platform-agnostic
- Set minimum Android WebView version requirement (Chrome 90+)

## References

- [Tauri v2 Documentation](https://v2.tauri.app)
- [Tauri v2 Mobile Support](https://v2.tauri.app/blog/tauri-2-0-0-stable-release/)
- [Tauri vs Electron Benchmarks](https://github.com/nicehash/nicehash-lp/blob/main/tauri-vs-electron.md)

---

## Status Update — 2026-03-01: Vue 3 / Nuxt 3 Framework Swap

**Context**: The original ADR premises a "single React codebase" shared across web, desktop, and mobile via Tauri v2. A design sprint decision (see ADR-010) swapped the empty Next.js 15 scaffold for Nuxt 3 + Vue 3 before any application code was written. Zero migration cost — only scaffold files were replaced.

**Impact on this ADR**: The "single codebase" benefit described in the Architecture Impact and Consequences sections now refers to a **single Vue 3 codebase**, not React. Specifically:

- `packages/ui/` exports Vue 3 SFCs (Single File Components), not React components
- `apps/web/` runs Nuxt 3 with SSR, not Next.js 15
- `apps/desktop/` and `apps/mobile/` will use Tauri v2 wrapping Vue 3 components from `packages/ui/`
- Tauri v2 supports Nuxt as a frontend framework via standard configuration (SSR disabled for Tauri builds)
- The cross-platform codebase benefit remains fully valid — only the framework has changed

**What remains unchanged**: All other aspects of this ADR — the choice of Tauri v2 over Electron, the binary size and memory advantages, the mobile support, the Rust backend, and the mitigation strategies — are unaffected by this framework swap.

**See also**: ADR-010 (Nuxt 3 Framework Swap) for the full decision record.
