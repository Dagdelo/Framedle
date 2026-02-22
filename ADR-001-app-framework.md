# ADR-001: Application Framework — Tauri v2

**Status**: Accepted
**Date**: 2025-02-22
**Deciders**: Core team
**Category**: Client Architecture

## Context

Framedle needs to ship on **Web, Windows, macOS, Linux, iOS, and Android** from a single React codebase. The two primary contenders for the desktop/mobile wrapper are **Electron** and **Tauri v2**.

## Options Considered

### Option A: Electron
- Mature ecosystem, proven at scale (VS Code, Discord, Slack)
- Chromium-based — guaranteed rendering consistency
- Large binary size (~150MB minimum)
- High memory usage (~200-300MB baseline)
- No mobile support (would need React Native separately)

### Option B: Tauri v2 ✅ (Selected)
- Uses OS-native webview (WebView2/WebKit/WKWebView)
- Tiny binary size (~5-15MB)
- Low memory footprint (~30-50MB)
- Tauri v2 supports iOS and Android (stable since late 2024)
- Rust backend for native functionality
- Single codebase → Web + Desktop + Mobile

### Option C: React Native + Electron
- React Native for mobile, Electron for desktop
- Two separate native layers to maintain
- Different rendering engines (RN Fabric vs Chromium)
- Code sharing limited to business logic only

## Decision

**Tauri v2** — it gives us all six platforms from one codebase with dramatically better performance characteristics than Electron. The mobile support (iOS/Android) eliminates the need for React Native entirely.

## Consequences

### Positive
- 10× smaller app size than Electron
- 5× lower memory usage
- True native feel on all platforms
- Single codebase for web + desktop + mobile
- Rust backend enables high-performance native features (local caching, offline support)

### Negative
- Tauri mobile is newer — may encounter edge cases
- WebView rendering differences across OS versions (Safari on iOS vs Chrome on Android vs Edge WebView2 on Windows)
- Smaller ecosystem of plugins compared to Electron
- Team needs basic Rust knowledge for native plugins

### Mitigations
- Use feature detection for WebView differences
- Automated cross-platform testing via CI
- Wrap Rust-specific code in a thin adapter layer
- Most game logic is pure TypeScript (platform-agnostic)

## References
- [Tauri v2 Release Notes](https://v2.tauri.app)
- [Tauri v2 Mobile Support](https://v2.tauri.app/blog/tauri-2-0-0-stable-release/)
- [Tauri vs Electron Benchmark](https://github.com/nicehash/nicehash-lp/blob/main/tauri-vs-electron.md)
