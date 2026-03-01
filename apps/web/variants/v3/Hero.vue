<template>
  <section class="vapor-hero">
    <!-- Massive gradient orb behind title -->
    <div class="hero-orb" aria-hidden="true" />

    <!-- Decorative geometric accents -->
    <div class="geo-line geo-line--top-left" aria-hidden="true" />
    <div class="geo-line geo-line--bottom-right" aria-hidden="true" />
    <div class="geo-diamond geo-diamond--1" aria-hidden="true" />
    <div class="geo-diamond geo-diamond--2" aria-hidden="true" />
    <div class="geo-circle geo-circle--1" aria-hidden="true" />
    <div class="geo-circle geo-circle--2" aria-hidden="true" />

    <!-- Chrome accent lines -->
    <div class="chrome-line chrome-line--1" aria-hidden="true" />
    <div class="chrome-line chrome-line--2" aria-hidden="true" />

    <!-- Title block -->
    <div class="hero-title-block">
      <div class="hero-eyebrow">
        <span class="eyebrow-tick" />
        <span class="eyebrow-text">EST. 2088 // SECTOR 7</span>
        <span class="eyebrow-tick" />
      </div>

      <h1 class="hero-title">
        <span class="title-shadow" aria-hidden="true">FRAMEDLE</span>
        FRAMEDLE
      </h1>

      <p class="hero-tagline">
        <span class="tagline-segment">DAILY</span>
        <span class="tagline-sep">//</span>
        <span class="tagline-segment">YOUTUBE</span>
        <span class="tagline-sep">//</span>
        <span class="tagline-segment">GUESSING</span>
        <span class="tagline-sep">//</span>
        <span class="tagline-segment">GAME</span>
      </p>
    </div>

    <!-- CTA button -->
    <div class="hero-cta-block">
      <button class="cta-button" @click="handleEnter">
        <span class="cta-button__gradient-border" aria-hidden="true" />
        <span class="cta-button__text">ENTER THE GRID</span>
        <span class="cta-button__arrow">▶</span>
      </button>
      <p class="cta-subtext">NO ACCOUNT REQUIRED // PLAY INSTANTLY</p>
    </div>

    <!-- Mode selection grid -->
    <div class="hero-modes">
      <div class="modes-label">
        <span class="modes-label__line" />
        <span class="modes-label__text">SELECT TRANSMISSION</span>
        <span class="modes-label__line" />
      </div>
      <div class="modes-grid">
        <button
          v-for="(mode, i) in gameModes"
          :key="mode.id"
          class="mode-card"
          :class="{ 'mode-card--active': selectedMode === mode.id }"
          :style="{ '--tilt': `${modeTilts[i]}deg` }"
          @click="selectedMode = mode.id"
        >
          <span class="mode-card__icon">{{ mode.icon }}</span>
          <span class="mode-card__name">{{ mode.name }}</span>
          <span class="mode-card__desc">{{ mode.desc }}</span>
          <span class="mode-card__glow" aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDesignVariant } from '../../composables/useDesignVariant'

useDesignVariant('v3')

const selectedMode = ref('classic')

const gameModes = [
  { id: 'classic',   icon: '🎬', name: 'CLASSIC',   desc: '6 frames // 6 guesses' },
  { id: 'speedrun',  icon: '⚡', name: 'SPEEDRUN',  desc: 'Beat the clock' },
  { id: 'audio',     icon: '🎵', name: 'AUDIO',     desc: 'Sound only' },
  { id: 'thumbnail', icon: '🖼', name: 'THUMBNAIL', desc: 'Cover art clues' },
  { id: 'title',     icon: '📝', name: 'TITLE',     desc: 'Words only' },
  { id: 'channel',   icon: '📡', name: 'CHANNEL',   desc: 'Creator series' },
]

// Pre-computed tilts so the grid feels hand-placed, not robotic
const modeTilts = [-3, 2, -1, 3, -2, 1]

function handleEnter() {
  navigateTo('/play/daily-frame')
}
</script>

<style scoped>
/* ─── Hero Root ─────────────────────────────────────────── */
.vapor-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem 6rem;
  gap: 3.5rem;
  overflow: hidden;
}

/* ─── Giant Orb ─────────────────────────────────────────── */
.hero-orb {
  pointer-events: none;
  position: absolute;
  top: -120px;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  height: 700px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 50% 40%,
    rgba(196, 77, 255, 0.55) 0%,
    rgba(255, 107, 157, 0.35) 35%,
    rgba(77, 121, 255, 0.15) 60%,
    transparent 75%
  );
  filter: blur(48px);
  z-index: 0;
}

/* ─── Geometric Decorations ─────────────────────────────── */
.geo-line {
  pointer-events: none;
  position: absolute;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(196, 77, 255, 0.8), transparent);
  z-index: 1;
}

.geo-line--top-left {
  top: 15%;
  left: 0;
  width: 35%;
  transform: rotate(-15deg) translateY(-20px);
}

.geo-line--bottom-right {
  bottom: 25%;
  right: 0;
  width: 35%;
  transform: rotate(15deg) translateY(20px);
}

.geo-diamond {
  pointer-events: none;
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid;
  transform: rotate(45deg);
  z-index: 1;
}

.geo-diamond--1 {
  top: 20%;
  left: 12%;
  border-color: rgba(255, 107, 157, 0.7);
  box-shadow: 0 0 10px rgba(255, 107, 157, 0.5);
  animation: float-diamond 4s ease-in-out infinite;
}

.geo-diamond--2 {
  top: 35%;
  right: 10%;
  border-color: rgba(77, 121, 255, 0.7);
  box-shadow: 0 0 10px rgba(77, 121, 255, 0.5);
  animation: float-diamond 5s ease-in-out infinite reverse;
}

@keyframes float-diamond {
  0%, 100% { transform: rotate(45deg) translateY(0); }
  50%       { transform: rotate(45deg) translateY(-8px); }
}

.geo-circle {
  pointer-events: none;
  position: absolute;
  border-radius: 50%;
  border: 1px solid;
  z-index: 1;
}

.geo-circle--1 {
  top: 8%;
  right: 15%;
  width: 80px;
  height: 80px;
  border-color: rgba(196, 77, 255, 0.4);
  box-shadow: inset 0 0 20px rgba(196, 77, 255, 0.15);
}

.geo-circle--2 {
  bottom: 30%;
  left: 8%;
  width: 40px;
  height: 40px;
  border-color: rgba(255, 107, 157, 0.4);
  box-shadow: inset 0 0 10px rgba(255, 107, 157, 0.15);
}

/* ─── Chrome Accent Lines ───────────────────────────────── */
.chrome-line {
  pointer-events: none;
  position: absolute;
  z-index: 1;
}

.chrome-line--1 {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 80px;
  background: linear-gradient(180deg, transparent, rgba(196, 77, 255, 0.8), transparent);
}

.chrome-line--2 {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 120px;
  background: linear-gradient(180deg, transparent, rgba(255, 107, 157, 0.8), transparent);
}

/* ─── Title Block ───────────────────────────────────────── */
.hero-title-block {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.eyebrow-tick {
  display: inline-block;
  width: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(196, 77, 255, 0.8));
}

.eyebrow-tick:last-child {
  background: linear-gradient(90deg, rgba(196, 77, 255, 0.8), transparent);
}

.eyebrow-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.25em;
  color: rgba(196, 77, 255, 0.8);
}

/* Chrome/metallic gradient title */
.hero-title {
  position: relative;
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(3.5rem, 12vw, 8rem);
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1;
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #f0cfff 20%,
    #c44dff 45%,
    #ff6b9d 70%,
    #4d79ff 90%,
    #a0b4ff 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
  /* Layered glow via filter */
  filter: drop-shadow(0 0 40px rgba(196, 77, 255, 0.7))
          drop-shadow(0 0 80px rgba(255, 107, 157, 0.4));
}

/* Slightly offset ghost for depth */
.title-shadow {
  position: absolute;
  top: 3px;
  left: 3px;
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(3.5rem, 12vw, 8rem);
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1;
  background: linear-gradient(180deg, rgba(77, 121, 255, 0.4), rgba(255, 107, 157, 0.4));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  pointer-events: none;
  user-select: none;
}

/* ─── Tagline ────────────────────────────────────────────── */
.hero-tagline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  letter-spacing: 0.18em;
  font-size: clamp(0.7rem, 2vw, 0.95rem);
}

.tagline-segment {
  color: #f0e6ff;
}

.tagline-sep {
  color: #ff6b9d;
  font-weight: 700;
  opacity: 0.9;
}

/* ─── CTA Block ─────────────────────────────────────────── */
.hero-cta-block {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.cta-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 2.5rem;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #fff;
  background: linear-gradient(135deg, #c44dff 0%, #ff6b9d 50%, #4d79ff 100%);
  background-size: 200% 200%;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  transition: background-position 0.4s ease, transform 0.15s ease, box-shadow 0.2s ease;
  box-shadow:
    0 0 20px rgba(196, 77, 255, 0.5),
    0 0 40px rgba(255, 107, 157, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.cta-button:hover {
  background-position: 100% 100%;
  transform: translateY(-2px) scale(1.02);
  box-shadow:
    0 0 30px rgba(196, 77, 255, 0.7),
    0 0 60px rgba(255, 107, 157, 0.4),
    0 4px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.cta-button:active {
  transform: translateY(0) scale(0.99);
}

/* Animated gradient border ring */
.cta-button__gradient-border {
  position: absolute;
  inset: -2px;
  border-radius: 5px;
  background: linear-gradient(90deg, #ff6b9d, #c44dff, #4d79ff, #ff6b9d);
  background-size: 300% 100%;
  animation: animate-gradient-shift 3s linear infinite;
  z-index: -1;
}

@keyframes animate-gradient-shift {
  0%   { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}

.cta-button__text {
  position: relative;
  z-index: 1;
}

.cta-button__arrow {
  position: relative;
  z-index: 1;
  font-size: 0.75rem;
  opacity: 0.9;
}

.cta-subtext {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: rgba(196, 77, 255, 0.6);
}

/* ─── Mode Selection ─────────────────────────────────────── */
.hero-modes {
  position: relative;
  z-index: 5;
  width: 100%;
  max-width: 780px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modes-label {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.modes-label__line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(196, 77, 255, 0.5), transparent);
}

.modes-label__text {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.25em;
  color: rgba(196, 77, 255, 0.7);
  white-space: nowrap;
}

.modes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

/* 3D perspective card */
.mode-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 1.2rem 1rem;
  background: linear-gradient(
    145deg,
    rgba(196, 77, 255, 0.12) 0%,
    rgba(26, 0, 48, 0.8) 60%,
    rgba(77, 121, 255, 0.08) 100%
  );
  border: 1px solid rgba(196, 77, 255, 0.25);
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transform: perspective(600px) rotateY(var(--tilt, 2deg));
  transition: transform 0.25s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.mode-card:hover {
  transform: perspective(600px) rotateY(0deg) translateY(-4px);
  border-color: rgba(255, 107, 157, 0.6);
  box-shadow:
    0 8px 32px rgba(196, 77, 255, 0.3),
    0 0 0 1px rgba(255, 107, 157, 0.3);
}

.mode-card--active {
  border-color: rgba(255, 107, 157, 0.8);
  background: linear-gradient(
    145deg,
    rgba(255, 107, 157, 0.2) 0%,
    rgba(26, 0, 48, 0.85) 50%,
    rgba(196, 77, 255, 0.15) 100%
  );
  box-shadow:
    0 0 24px rgba(255, 107, 157, 0.35),
    0 0 48px rgba(196, 77, 255, 0.2),
    inset 0 0 16px rgba(196, 77, 255, 0.08);
}

.mode-card__icon {
  font-size: 1.75rem;
  line-height: 1;
  filter: drop-shadow(0 0 8px rgba(255, 107, 157, 0.7));
}

.mode-card__name {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #f0e6ff;
}

.mode-card__desc {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.65rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  color: rgba(196, 77, 255, 0.7);
}

/* Hover glow spread */
.mode-card__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(196, 77, 255, 0.15),
    transparent 65%
  );
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.mode-card:hover .mode-card__glow,
.mode-card--active .mode-card__glow {
  opacity: 1;
}

/* ─── Responsive ─────────────────────────────────────────── */
@media (max-width: 600px) {
  .modes-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .mode-card {
    transform: perspective(600px) rotateY(0deg);
  }
}
</style>
