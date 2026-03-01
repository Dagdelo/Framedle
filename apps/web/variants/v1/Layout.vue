<template>
  <div class="neon-cinema-layout" :style="cssVariables">
    <!-- Grid overlay -->
    <div class="grid-overlay" aria-hidden="true" />

    <!-- Top bar -->
    <header class="top-bar">
      <div class="top-bar-inner">
        <div class="logo-lockup">
          <span class="logo-bracket text-variant-accent-2">[</span>
          <span class="logo-text animate-neon-flicker font-display-condensed text-variant-accent">
            FRAMEDLE
          </span>
          <span class="logo-bracket text-variant-accent-2">]</span>
        </div>

        <nav class="top-nav font-mono-brutal">
          <a href="#" class="nav-link text-variant-fg-muted hover:text-variant-accent">HOW TO PLAY</a>
          <span class="nav-sep text-variant-border">|</span>
          <a href="#" class="nav-link text-variant-fg-muted hover:text-variant-accent">LEADERBOARD</a>
          <span class="nav-sep text-variant-border">|</span>
          <a href="#" class="nav-link text-variant-fg-muted hover:text-variant-accent">SIGN IN</a>
        </nav>
      </div>

      <!-- Neon accent line -->
      <div class="header-line" aria-hidden="true">
        <div class="header-line-glow" />
      </div>
    </header>

    <!-- Main content -->
    <main class="main-content">
      <slot />
    </main>

    <!-- Footer accent line -->
    <div class="footer-line" aria-hidden="true">
      <div class="footer-line-glow" />
    </div>

    <!-- Footer -->
    <footer class="site-footer font-mono-brutal text-variant-fg-muted">
      <span>FRAMEDLE &copy; 2026</span>
      <span class="footer-sep text-variant-accent">&#9670;</span>
      <a href="#" class="hover:text-variant-accent">PRIVACY</a>
      <span class="footer-sep text-variant-accent">&#9670;</span>
      <a href="#" class="hover:text-variant-accent">TERMS</a>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useDesignVariant } from '~/composables/useDesignVariant'

const { cssVariables } = useDesignVariant()
</script>

<style scoped>
.neon-cinema-layout {
  position: relative;
  min-height: 100vh;
  background-color: var(--variant-bg);
  background-image: radial-gradient(ellipse at center, #111111 0%, #050505 100%);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* Subtle grid overlay */
.grid-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 39px,
      rgba(0, 240, 255, 0.03) 39px,
      rgba(0, 240, 255, 0.03) 40px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 39px,
      rgba(0, 240, 255, 0.03) 39px,
      rgba(0, 240, 255, 0.03) 40px
    );
}

/* Top bar */
.top-bar {
  position: relative;
  z-index: 10;
  padding: 0 2rem;
}

.top-bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1.25rem;
  padding-bottom: 1.25rem;
}

.logo-lockup {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.logo-bracket {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2rem;
  line-height: 1;
  opacity: 0.7;
}

.logo-text {
  font-size: 2rem;
  line-height: 1;
  letter-spacing: 0.08em;
  text-shadow:
    0 0 10px rgba(0, 240, 255, 0.8),
    0 0 20px rgba(0, 240, 255, 0.4),
    0 0 40px rgba(0, 240, 255, 0.2);
}

.top-nav {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
}

.nav-link {
  transition: color 0.2s ease;
  text-decoration: none;
}

.nav-sep {
  opacity: 0.3;
  font-size: 0.6rem;
}

/* Neon divider lines */
.header-line,
.footer-line {
  position: relative;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 240, 255, 0.6) 20%,
    rgba(0, 240, 255, 0.9) 50%,
    rgba(0, 240, 255, 0.6) 80%,
    transparent 100%
  );
}

.header-line-glow,
.footer-line-glow {
  position: absolute;
  inset: -2px 10% -2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 240, 255, 0.15) 50%,
    transparent 100%
  );
  filter: blur(4px);
}

/* Main content */
.main-content {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: 4rem 1.5rem;
}

/* Footer */
.footer-line {
  margin-top: auto;
}

.site-footer {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  font-size: 0.65rem;
  letter-spacing: 0.12em;
}

.site-footer a {
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-sep {
  font-size: 0.5rem;
  opacity: 0.5;
}
</style>
