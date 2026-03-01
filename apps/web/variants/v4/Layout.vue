<template>
  <div class="brutal-mono-layout" :style="cssVariables">
    <!-- Header -->
    <header class="brutal-header">
      <div class="brutal-header-inner">
        <div class="brutal-logo">
          <span class="brutal-logo-text font-mono-brutal">FRAMEDLE</span>
          <div class="brutal-logo-underline" aria-hidden="true" />
        </div>

        <nav class="brutal-nav font-mono-brutal">
          <a href="#" class="brutal-nav-link">HOW_TO_PLAY</a>
          <span class="brutal-nav-sep" aria-hidden="true">/</span>
          <a href="#" class="brutal-nav-link">LEADERBOARD</a>
          <span class="brutal-nav-sep" aria-hidden="true">/</span>
          <a href="#" class="brutal-nav-link">SIGN_IN</a>
        </nav>
      </div>
    </header>

    <!-- Horizontal rule — thick, full width -->
    <div class="brutal-rule" aria-hidden="true" />

    <!-- Main content -->
    <main class="brutal-main">
      <slot />
    </main>

    <!-- Footer rule -->
    <div class="brutal-rule" aria-hidden="true" />

    <!-- Footer -->
    <footer class="brutal-footer font-mono-brutal">
      <span>FRAMEDLE &copy; 2026</span>
      <span class="brutal-footer-sep" aria-hidden="true">|</span>
      <a href="#" class="brutal-footer-link">PRIVACY</a>
      <span class="brutal-footer-sep" aria-hidden="true">|</span>
      <a href="#" class="brutal-footer-link">TERMS</a>
      <span class="brutal-footer-sep" aria-hidden="true">|</span>
      <span class="brutal-footer-version text-variant-fg-muted">v0.1.0-alpha</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useDesignVariant } from '~/composables/useDesignVariant'

const { cssVariables } = useDesignVariant()
</script>

<style scoped>
.brutal-mono-layout {
  position: relative;
  min-height: 100vh;
  background-color: var(--variant-bg);
  color: var(--variant-fg);
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* Header */
.brutal-header {
  position: relative;
  z-index: 10;
  padding: 0 1.5rem;
}

.brutal-header-inner {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-top: 1.25rem;
  padding-bottom: 1rem;
}

/* Logo */
.brutal-logo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}

.brutal-logo-text {
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.04em;
  color: var(--variant-fg);
}

.brutal-logo-underline {
  height: 4px;
  width: 100%;
  background-color: var(--variant-fg);
}

/* Nav */
.brutal-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.brutal-nav-link {
  color: var(--variant-fg);
  text-decoration: none;
  padding-bottom: 1px;
  border-bottom: 2px solid transparent;
  transition: border-color 0.1s ease;
}

.brutal-nav-link:hover {
  border-bottom-color: var(--variant-fg);
}

.brutal-nav-sep {
  color: var(--variant-fg-muted);
  font-weight: 400;
  user-select: none;
}

/* Full-width rule */
.brutal-rule {
  width: 100%;
  height: 4px;
  background-color: var(--variant-fg);
  flex-shrink: 0;
}

/* Main */
.brutal-main {
  flex: 1;
  padding: 2.5rem 1.5rem;
}

/* Footer */
.brutal-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.brutal-footer-link {
  color: var(--variant-fg);
  text-decoration: none;
}

.brutal-footer-link:hover {
  text-decoration: underline;
}

.brutal-footer-sep {
  color: var(--variant-fg-muted);
  user-select: none;
}

.brutal-footer-version {
  margin-left: auto;
  font-weight: 400;
}
</style>
