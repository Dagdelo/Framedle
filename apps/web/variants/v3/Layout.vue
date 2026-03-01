<template>
  <div class="vapor-root">
    <!-- CRT scanline overlay -->
    <div class="scanlines" aria-hidden="true" />

    <!-- Perspective grid floor -->
    <div class="grid-floor" aria-hidden="true" />

    <!-- Ambient glow blobs -->
    <div class="ambient-blob ambient-blob--left" aria-hidden="true" />
    <div class="ambient-blob ambient-blob--right" aria-hidden="true" />

    <!-- Navigation -->
    <nav class="vapor-nav">
      <div class="vapor-nav__brand">
        <span class="brand-text">FRAMEDLE</span>
        <span class="brand-dot" />
      </div>
      <div class="vapor-nav__links">
        <a
          v-for="link in navLinks"
          :key="link.label"
          :href="link.href"
          class="nav-pill"
        >
          {{ link.label }}
        </a>
      </div>
    </nav>

    <!-- Main content -->
    <main class="vapor-content">
      <div class="chromatic-frame">
        <slot />
      </div>
    </main>

    <!-- Footer -->
    <footer class="vapor-footer">
      <span class="footer-text">© 2088 FRAMEDLE CORP // ALL RIGHTS RESERVED // SYSTEM ONLINE</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useDesignVariant } from '../../composables/useDesignVariant'
useDesignVariant('v3')

const navLinks = [
  { label: 'PLAY', href: '/play' },
  { label: 'SCORES', href: '/leaderboard' },
  { label: 'ARCHIVE', href: '/archive' },
  { label: 'ABOUT', href: '/about' },
]
</script>

<style scoped>
/* ─── Root ─────────────────────────────────────────────── */
.vapor-root {
  position: relative;
  min-height: 100dvh;
  background-color: #1a0030;
  background-image:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(196, 77, 255, 0.35) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 90%, rgba(255, 107, 157, 0.2) 0%, transparent 55%);
  overflow-x: hidden;
  font-family: 'Space Grotesk', sans-serif;
  color: #f0e6ff;
}

/* ─── CRT Scanlines ────────────────────────────────────── */
.scanlines {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 100;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.18) 2px,
    rgba(0, 0, 0, 0.18) 4px
  );
  animation: animate-scanlines 8s linear infinite;
}

@keyframes animate-scanlines {
  0%   { background-position: 0 0; }
  100% { background-position: 0 100px; }
}

/* ─── Perspective Grid Floor ───────────────────────────── */
.grid-floor {
  pointer-events: none;
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) perspective(600px) rotateX(55deg);
  width: 260vw;
  height: 70vh;
  z-index: 0;
  background-image:
    linear-gradient(rgba(255, 107, 157, 0.55) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 107, 157, 0.55) 1px, transparent 1px);
  background-size: 60px 60px;
  background-position: center bottom;
  mask-image: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 70%);
  -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 70%);
}

/* ─── Ambient Glow Blobs ───────────────────────────────── */
.ambient-blob {
  pointer-events: none;
  position: fixed;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  filter: blur(120px);
  z-index: 0;
  opacity: 0.25;
}

.ambient-blob--left {
  top: 10%;
  left: -15%;
  background: radial-gradient(circle, #c44dff, transparent 70%);
}

.ambient-blob--right {
  bottom: 15%;
  right: -15%;
  background: radial-gradient(circle, #ff6b9d, transparent 70%);
}

/* ─── Navigation ───────────────────────────────────────── */
.vapor-nav {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2.5rem;
  border-bottom: 1px solid rgba(196, 77, 255, 0.3);
  background: linear-gradient(
    180deg,
    rgba(26, 0, 48, 0.95) 0%,
    rgba(26, 0, 48, 0.6) 100%
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.vapor-nav__brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  background: linear-gradient(90deg, #ff6b9d, #c44dff, #4d79ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff6b9d;
  box-shadow: 0 0 8px #ff6b9d, 0 0 16px #ff6b9d;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.7); }
}

.vapor-nav__links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-pill {
  display: inline-block;
  padding: 0.35rem 1rem;
  border-radius: 999px;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #f0e6ff;
  text-decoration: none;
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.2), rgba(196, 77, 255, 0.2));
  border: 1px solid rgba(196, 77, 255, 0.4);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.nav-pill::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.5), rgba(196, 77, 255, 0.5));
  opacity: 0;
  transition: opacity 0.2s ease;
}

.nav-pill:hover::before {
  opacity: 1;
}

.nav-pill:hover {
  border-color: rgba(255, 107, 157, 0.8);
  box-shadow: 0 0 18px rgba(255, 107, 157, 0.4), 0 0 36px rgba(196, 77, 255, 0.2);
  color: #fff;
}

/* ─── Content ──────────────────────────────────────────── */
.vapor-content {
  position: relative;
  z-index: 5;
  min-height: calc(100dvh - 5rem - 3rem);
}

/* Chromatic aberration frame feel */
.chromatic-frame {
  position: relative;
}

.chromatic-frame::before,
.chromatic-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.chromatic-frame::before {
  box-shadow:
    inset 3px 0 0 rgba(255, 107, 157, 0.08),
    inset -3px 0 0 rgba(77, 121, 255, 0.08);
}

/* ─── Footer ───────────────────────────────────────────── */
.vapor-footer {
  position: relative;
  z-index: 10;
  padding: 1rem 2.5rem;
  border-top: 1px solid rgba(196, 77, 255, 0.25);
  text-align: center;
}

.footer-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: rgba(196, 77, 255, 0.6);
}
</style>
