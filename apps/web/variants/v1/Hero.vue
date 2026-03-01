<template>
  <section class="neon-hero">
    <!-- Film strip left -->
    <div class="film-strip film-strip-left" aria-hidden="true">
      <div v-for="i in 12" :key="i" class="film-frame" />
    </div>

    <!-- Film strip right -->
    <div class="film-strip film-strip-right" aria-hidden="true">
      <div v-for="i in 12" :key="i" class="film-frame" />
    </div>

    <!-- Hero content -->
    <div class="hero-content">

      <!-- Marquee top decoration -->
      <div class="marquee-decoration marquee-top" aria-hidden="true">
        <span v-for="i in 6" :key="i" class="marquee-star">&#9733;</span>
      </div>

      <!-- Main title -->
      <div class="title-wrapper">
        <h1 class="hero-title font-display-condensed animate-neon-glow">
          FRAMEDLE
        </h1>
        <div class="title-underline" aria-hidden="true" />
      </div>

      <!-- Tagline -->
      <p class="hero-tagline font-mono-brutal">
        GUESS THE FRAME.
        <span class="tagline-sep text-variant-accent-2">&nbsp;//&nbsp;</span>
        BEAT THE CLOCK.
      </p>

      <!-- CTA area with glowing border -->
      <div class="cta-box">
        <!-- Today's game mode badge -->
        <div class="mode-badges">
          <span class="mode-badge font-mono-brutal">
            <span class="badge-dot" />
            DAILY CHALLENGE
          </span>
          <span class="mode-badge mode-badge-alt font-mono-brutal">
            <span class="badge-dot badge-dot-alt" />
            6 GUESSES
          </span>
          <span class="mode-badge mode-badge-yellow font-mono-brutal">
            <span class="badge-dot badge-dot-yellow" />
            #{{ dayNumber }}
          </span>
        </div>

        <!-- CTA description -->
        <p class="cta-description font-mono-brutal text-variant-fg-muted">
          A new frame drops every midnight. How many guesses will you need?
        </p>

        <!-- Play button -->
        <button
          class="play-button font-display-condensed animate-neon-glow"
          @mouseenter="buttonHovered = true"
          @mouseleave="buttonHovered = false"
          @click="navigateTo('/play/daily-frame')"
        >
          <span class="play-button-bg" :class="{ 'play-button-bg-hovered': buttonHovered }" />
          <span class="play-button-text">PLAY NOW</span>
          <span class="play-arrow">&#9658;</span>
        </button>

        <!-- Secondary actions -->
        <div class="secondary-actions font-mono-brutal">
          <a href="#" class="secondary-link text-variant-fg-muted hover:text-variant-accent">
            VIEW LEADERBOARD
          </a>
          <span class="text-variant-border">&#8212;</span>
          <a href="#" class="secondary-link text-variant-fg-muted hover:text-variant-accent">
            HOW TO PLAY
          </a>
        </div>
      </div>

      <!-- Stats row -->
      <div class="stats-row font-mono-brutal">
        <div class="stat-item">
          <span class="stat-number text-variant-accent">{{ stats.players }}</span>
          <span class="stat-label text-variant-fg-muted">PLAYERS TODAY</span>
        </div>
        <div class="stat-divider text-variant-border">|</div>
        <div class="stat-item">
          <span class="stat-number text-variant-accent-2">{{ stats.avgGuesses }}</span>
          <span class="stat-label text-variant-fg-muted">AVG GUESSES</span>
        </div>
        <div class="stat-divider text-variant-border">|</div>
        <div class="stat-item">
          <span class="stat-number text-variant-accent-3">{{ stats.winRate }}%</span>
          <span class="stat-label text-variant-fg-muted">WIN RATE</span>
        </div>
      </div>

      <!-- Marquee bottom decoration -->
      <div class="marquee-decoration marquee-bottom" aria-hidden="true">
        <span v-for="i in 6" :key="i" class="marquee-star">&#9733;</span>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const buttonHovered = ref(false)

// Day number based on a fixed epoch (2026-01-01)
const dayNumber = computed(() => {
  const epoch = new Date('2026-01-01').getTime()
  const now = new Date().getTime()
  return Math.floor((now - epoch) / (1000 * 60 * 60 * 24)) + 1
})

// Mock stats for display
const stats = {
  players: '2,847',
  avgGuesses: '3.4',
  winRate: '68',
}
</script>

<style scoped>
.neon-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
  overflow: hidden;
}

/* Film strips */
.film-strip {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 48px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  overflow: hidden;
}

.film-strip-left {
  left: 0;
}

.film-strip-right {
  right: 0;
}

.film-frame {
  flex: 1;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 2px;
}

.film-strip-left .film-frame:nth-child(odd),
.film-strip-right .film-frame:nth-child(even) {
  background: #222;
  border-color: rgba(0, 240, 255, 0.08);
}

/* Hero content */
.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  max-width: 680px;
  width: 100%;
  text-align: center;
}

/* Marquee decorations */
.marquee-decoration {
  display: flex;
  gap: 1.5rem;
  color: var(--variant-accent);
  opacity: 0.4;
  font-size: 0.7rem;
}

/* Title */
.title-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.hero-title {
  font-size: clamp(5rem, 14vw, 10rem);
  line-height: 0.9;
  letter-spacing: 0.05em;
  color: var(--variant-accent);
  text-shadow:
    0 0 15px rgba(0, 240, 255, 0.9),
    0 0 30px rgba(0, 240, 255, 0.6),
    0 0 60px rgba(0, 240, 255, 0.3),
    0 0 100px rgba(0, 240, 255, 0.15);
  margin: 0;
}

.title-underline {
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 0, 170, 0.6) 15%,
    rgba(0, 240, 255, 0.9) 50%,
    rgba(255, 0, 170, 0.6) 85%,
    transparent 100%
  );
  filter: drop-shadow(0 0 6px rgba(0, 240, 255, 0.6));
}

/* Tagline */
.hero-tagline {
  font-size: clamp(0.85rem, 2.5vw, 1.1rem);
  letter-spacing: 0.25em;
  color: var(--variant-fg);
  margin: 0;
  line-height: 1.4;
}

.tagline-sep {
  opacity: 0.7;
}

/* CTA box */
.cta-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 2.5rem;
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 4px;
  background: rgba(0, 240, 255, 0.03);
  box-shadow:
    0 0 20px rgba(0, 240, 255, 0.08),
    inset 0 0 30px rgba(0, 240, 255, 0.03);
  width: 100%;
  position: relative;
}

/* Corner accents on CTA box */
.cta-box::before,
.cta-box::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--variant-accent-2);
  border-style: solid;
}

.cta-box::before {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}

.cta-box::after {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}

/* Mode badges */
.mode-badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.mode-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 2px;
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  color: var(--variant-accent);
  background: rgba(0, 240, 255, 0.05);
}

.mode-badge-alt {
  border-color: rgba(255, 0, 170, 0.3);
  color: var(--variant-accent-2);
  background: rgba(255, 0, 170, 0.05);
}

.mode-badge-yellow {
  border-color: rgba(240, 255, 0, 0.3);
  color: var(--variant-accent-3);
  background: rgba(240, 255, 0, 0.05);
}

.badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--variant-accent);
  box-shadow: 0 0 6px rgba(0, 240, 255, 0.8);
  animation: pulse-dot 2s ease-in-out infinite;
}

.badge-dot-alt {
  background: var(--variant-accent-2);
  box-shadow: 0 0 6px rgba(255, 0, 170, 0.8);
}

.badge-dot-yellow {
  background: var(--variant-accent-3);
  box-shadow: 0 0 6px rgba(240, 255, 0, 0.8);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

/* CTA description */
.cta-description {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  line-height: 1.6;
  max-width: 400px;
  margin: 0;
}

/* Play button */
.play-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 3rem;
  font-size: 2rem;
  letter-spacing: 0.12em;
  color: #0a0a0a;
  border: none;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.15s ease;
  background: transparent;
}

.play-button:hover {
  transform: scale(1.03);
}

.play-button:active {
  transform: scale(0.98);
}

.play-button-bg {
  position: absolute;
  inset: 0;
  background: var(--variant-accent);
  transition: box-shadow 0.3s ease, background 0.3s ease;
  box-shadow:
    0 0 15px rgba(0, 240, 255, 0.5),
    0 0 30px rgba(0, 240, 255, 0.3);
}

.play-button-bg-hovered {
  background: #40f8ff;
  box-shadow:
    0 0 25px rgba(0, 240, 255, 0.8),
    0 0 50px rgba(0, 240, 255, 0.4),
    0 0 80px rgba(0, 240, 255, 0.2);
}

.play-button-text {
  position: relative;
  z-index: 1;
}

.play-arrow {
  position: relative;
  z-index: 1;
  font-size: 1.2rem;
}

/* Secondary actions */
.secondary-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.65rem;
  letter-spacing: 0.12em;
}

.secondary-link {
  text-decoration: none;
  transition: color 0.2s ease;
}

/* Stats row */
.stats-row {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-number {
  font-size: 1.5rem;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px currentColor;
}

.stat-label {
  font-size: 0.6rem;
  letter-spacing: 0.15em;
}

.stat-divider {
  font-size: 1.2rem;
  opacity: 0.2;
}
</style>
