<template>
  <div class="neon-game-board">

    <!-- Section: Frame Viewer -->
    <div class="board-section">
      <div class="section-label font-mono-brutal text-variant-fg-muted">
        <span class="label-bracket text-variant-accent">[</span>
        FRAME
        <span class="label-bracket text-variant-accent">]</span>
      </div>

      <!-- FrameViewer wrapped in neon-glow border -->
      <div class="frame-viewer-wrapper">
        <div class="frame-corner frame-corner-tl" aria-hidden="true" />
        <div class="frame-corner frame-corner-tr" aria-hidden="true" />
        <div class="frame-corner frame-corner-bl" aria-hidden="true" />
        <div class="frame-corner frame-corner-br" aria-hidden="true" />

        <div class="frame-viewer-inner">
          <FrameViewer
            :frame-url="currentFrameUrl"
            :blur-level="currentBlur"
            :reveal-progress="revealProgress"
            class="frame-viewer-component"
          />
        </div>

        <!-- Scanline overlay for CRT effect -->
        <div class="scanlines" aria-hidden="true" />
      </div>

      <!-- Frame reveal progress bar -->
      <div class="reveal-bar font-mono-brutal">
        <span class="reveal-label text-variant-fg-muted">REVEAL</span>
        <div class="reveal-track">
          <div
            class="reveal-fill"
            :style="{ width: `${revealProgress * 100}%` }"
          />
        </div>
        <span class="reveal-pct text-variant-accent">{{ Math.round(revealProgress * 100) }}%</span>
      </div>
    </div>

    <!-- Neon divider -->
    <div class="neon-divider" aria-hidden="true" />

    <!-- Section: Guess History -->
    <div class="board-section">
      <div class="section-label font-mono-brutal text-variant-fg-muted">
        <span class="label-bracket text-variant-accent">[</span>
        GUESSES
        <span class="label-bracket text-variant-accent">]</span>
        <span class="guess-count text-variant-accent-2">{{ displayGuesses.length }}/6</span>
      </div>

      <div class="guess-history-wrapper">
        <div
          v-for="(guess, index) in displayGuesses"
          :key="guess.id"
          class="guess-row"
          :class="{
            'guess-row-correct': guess.correct,
            'guess-row-incorrect': !guess.correct,
            'animate-glitch': guess.animateGlitch,
          }"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >
          <span class="guess-index font-mono-brutal text-variant-fg-muted">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span class="guess-text font-mono-brutal">{{ guess.text }}</span>
          <span class="guess-result font-mono-brutal" :class="guess.correct ? 'text-variant-correct' : 'text-variant-incorrect'">
            {{ guess.correct ? 'MATCH' : 'MISS' }}
          </span>
          <span class="guess-icon" aria-hidden="true">
            {{ guess.correct ? '&#10003;' : '&#10007;' }}
          </span>
        </div>

        <!-- Empty slots -->
        <div
          v-for="i in emptySlots"
          :key="`empty-${i}`"
          class="guess-row guess-row-empty"
        >
          <span class="guess-index font-mono-brutal text-variant-fg-muted">
            {{ String(displayGuesses.length + i).padStart(2, '0') }}
          </span>
          <span class="guess-text-empty font-mono-brutal text-variant-fg-muted">
            &#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;&#95;
          </span>
        </div>
      </div>

      <!-- GuessHistory component (hidden, provides state) -->
      <GuessHistory
        :guesses="[...displayGuesses]"
        class="sr-only"
      />
    </div>

    <!-- Neon divider -->
    <div class="neon-divider neon-divider-magenta" aria-hidden="true" />

    <!-- Section: Input -->
    <div class="board-section">
      <div class="section-label font-mono-brutal text-variant-fg-muted">
        <span class="label-bracket text-variant-accent">[</span>
        INPUT
        <span class="label-bracket text-variant-accent">]</span>
      </div>

      <div class="guess-input-wrapper">
        <!-- Terminal prompt decoration -->
        <div class="terminal-prompt font-mono-brutal text-variant-accent" aria-hidden="true">
          &gt;_
        </div>

        <GuessInput
          v-model="currentGuess"
          placeholder="ENTER VIDEO TITLE..."
          :disabled="false"
          class="guess-input-component font-mono-brutal"
          @submit="onSubmitGuess"
        />

        <button
          class="submit-button font-display-condensed"
          :disabled="!currentGuess.trim()"
          @click="onSubmitGuess"
        >
          FIRE
        </button>
      </div>

      <div class="input-hint font-mono-brutal text-variant-fg-muted">
        PRESS ENTER OR CLICK FIRE TO SUBMIT &nbsp; &#8212; &nbsp; SKIPS COST 1 GUESS
      </div>
    </div>

    <!-- Neon divider -->
    <div class="neon-divider" aria-hidden="true" />

    <!-- Section: Score + Share -->
    <div class="board-section board-section-bottom">
      <div class="score-share-row">
        <div class="score-wrapper">
          <div class="section-label font-mono-brutal text-variant-fg-muted">
            <span class="label-bracket text-variant-accent">[</span>
            SCORE
            <span class="label-bracket text-variant-accent">]</span>
          </div>
          <ScoreDisplay
            :score="score"
            :streak="0"
            :xp="0"
            class="score-component"
          />
        </div>

        <div class="share-wrapper">
          <div class="section-label font-mono-brutal text-variant-fg-muted">
            <span class="label-bracket text-variant-accent">[</span>
            SHARE
            <span class="label-bracket text-variant-accent">]</span>
          </div>
          <ShareButton
            :score="score"
            :guesses="displayGuesses.length"
            :game-mode="'daily'"
            class="share-button-component font-display-condensed"
          />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  FrameViewer,
  GuessInput,
  GuessHistory,
  ScoreDisplay,
  ShareButton,
} from '@framedle/ui'
const MAX_GUESSES = 6

const {
  loading, error, dailyGame, currentFrameUrl, revealedFrames,
  guesses, guessesRemaining, score, gameOver, won, answer,
  loadGame, submitGuess, shareResult,
} = useGameState()

const { results: searchResults, search: searchVideos } = useVideoSearch()

const currentGuess = ref('')

const revealProgress = computed(() => {
  if (!dailyGame.value) return 0
  return revealedFrames.value.length / dailyGame.value.frames.length
})

const currentBlur = computed(() => {
  return Math.max(0, 6 - revealedFrames.value.length * 2)
})

const displayGuesses = computed(() =>
  guesses.value.map((g) => ({
    ...g,
    animateGlitch: false,
  }))
)

const emptySlots = computed(() => Math.max(0, MAX_GUESSES - guesses.value.length))

async function onSubmitGuess() {
  if (!currentGuess.value.trim() || gameOver.value) return
  await submitGuess(currentGuess.value)
  currentGuess.value = ''
}

onMounted(() => { loadGame() })
</script>

<style scoped>
.neon-game-board {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}

/* Section */
.board-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem 0;
}

.board-section-bottom {
  padding-bottom: 0;
}

/* Section label */
.section-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.65rem;
  letter-spacing: 0.2em;
  color: var(--variant-fg-muted);
}

.label-bracket {
  font-size: 0.8rem;
  opacity: 0.7;
}

.guess-count {
  margin-left: auto;
  font-size: 0.65rem;
  letter-spacing: 0.12em;
}

/* Frame viewer wrapper */
.frame-viewer-wrapper {
  position: relative;
  border: 1px solid rgba(0, 240, 255, 0.25);
  border-radius: 4px;
  overflow: hidden;
  background: #0d0d0d;
  box-shadow:
    0 0 20px rgba(0, 240, 255, 0.1),
    0 0 40px rgba(0, 240, 255, 0.05),
    inset 0 0 20px rgba(0, 0, 0, 0.5);
  animation: neon-border-pulse 3s ease-in-out infinite;
}

@keyframes neon-border-pulse {
  0%, 100% {
    box-shadow:
      0 0 15px rgba(0, 240, 255, 0.1),
      0 0 30px rgba(0, 240, 255, 0.05),
      inset 0 0 20px rgba(0, 0, 0, 0.5);
    border-color: rgba(0, 240, 255, 0.25);
  }
  50% {
    box-shadow:
      0 0 25px rgba(0, 240, 255, 0.2),
      0 0 50px rgba(0, 240, 255, 0.1),
      inset 0 0 20px rgba(0, 0, 0, 0.5);
    border-color: rgba(0, 240, 255, 0.45);
  }
}

/* Corner accents */
.frame-corner {
  position: absolute;
  width: 16px;
  height: 16px;
  z-index: 2;
  border-color: var(--variant-accent);
  border-style: solid;
}

.frame-corner-tl {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}

.frame-corner-tr {
  top: -1px;
  right: -1px;
  border-width: 2px 2px 0 0;
}

.frame-corner-bl {
  bottom: -1px;
  left: -1px;
  border-width: 0 0 2px 2px;
}

.frame-corner-br {
  bottom: -1px;
  right: -1px;
  border-width: 0 2px 2px 0;
}

.frame-viewer-inner {
  position: relative;
  z-index: 1;
  aspect-ratio: 16 / 9;
  width: 100%;
}

.frame-viewer-component {
  width: 100%;
  height: 100%;
}

/* CRT scanlines overlay */
.scanlines {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
}

/* Reveal progress bar */
.reveal-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.6rem;
  letter-spacing: 0.15em;
}

.reveal-label {
  min-width: 4rem;
}

.reveal-track {
  flex: 1;
  height: 3px;
  background: rgba(0, 240, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.reveal-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--variant-accent), rgba(0, 240, 255, 0.6));
  box-shadow: 0 0 6px rgba(0, 240, 255, 0.6);
  transition: width 0.4s ease;
}

.reveal-pct {
  min-width: 2.5rem;
  text-align: right;
}

/* Neon divider */
.neon-divider {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 240, 255, 0.4) 30%,
    rgba(0, 240, 255, 0.6) 50%,
    rgba(0, 240, 255, 0.4) 70%,
    transparent 100%
  );
  position: relative;
}

.neon-divider::after {
  content: '';
  position: absolute;
  inset: -2px 15%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(0, 240, 255, 0.1) 50%,
    transparent 100%
  );
  filter: blur(3px);
}

.neon-divider-magenta {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 0, 170, 0.4) 30%,
    rgba(255, 0, 170, 0.6) 50%,
    rgba(255, 0, 170, 0.4) 70%,
    transparent 100%
  );
}

.neon-divider-magenta::after {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 0, 170, 0.1) 50%,
    transparent 100%
  );
}

/* Guess history */
.guess-history-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.guess-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 2px;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
}

.guess-row-correct {
  border-color: rgba(0, 255, 136, 0.3);
  background: rgba(0, 255, 136, 0.05);
  color: var(--variant-correct);
}

.guess-row-incorrect {
  border-color: rgba(255, 51, 51, 0.2);
  background: rgba(255, 51, 51, 0.03);
  color: var(--variant-fg);
}

.guess-row-empty {
  border-color: rgba(255, 255, 255, 0.04);
  background: rgba(255, 255, 255, 0.01);
  opacity: 0.4;
}

.guess-index {
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  min-width: 1.5rem;
  opacity: 0.5;
}

.guess-text {
  flex: 1;
}

.guess-text-empty {
  flex: 1;
  letter-spacing: 0.06em;
  opacity: 0.3;
}

.guess-result {
  font-size: 0.6rem;
  letter-spacing: 0.15em;
}

.guess-icon {
  font-size: 0.9rem;
  width: 1rem;
  text-align: center;
}

.guess-row-correct .guess-icon {
  color: var(--variant-correct);
  text-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
}

.guess-row-incorrect .guess-icon {
  color: var(--variant-incorrect);
}

/* Input area */
.guess-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 2px;
  background: rgba(0, 240, 255, 0.03);
  padding: 0 0.75rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.guess-input-wrapper:focus-within {
  border-color: rgba(0, 240, 255, 0.7);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.15);
}

.terminal-prompt {
  font-size: 1rem;
  letter-spacing: 0;
  opacity: 0.7;
  user-select: none;
  flex-shrink: 0;
}

.guess-input-component {
  flex: 1;
  background: transparent !important;
  border: none !important;
  color: var(--variant-fg) !important;
  font-size: 0.85rem !important;
  letter-spacing: 0.05em !important;
  padding: 0.85rem 0 !important;
  outline: none !important;
}

.submit-button {
  flex-shrink: 0;
  padding: 0.35rem 1rem;
  background: transparent;
  border: 1px solid rgba(255, 0, 170, 0.5);
  color: var(--variant-accent-2);
  font-size: 1.1rem;
  letter-spacing: 0.12em;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  background: rgba(255, 0, 170, 0.1);
  border-color: rgba(255, 0, 170, 0.8);
  box-shadow: 0 0 12px rgba(255, 0, 170, 0.3);
}

.submit-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.input-hint {
  font-size: 0.55rem;
  letter-spacing: 0.12em;
  text-align: center;
  opacity: 0.5;
}

/* Score + Share row */
.score-share-row {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.score-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.share-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
}

.score-component {
  font-family: 'Bebas Neue', sans-serif;
  color: var(--variant-accent-3);
  text-shadow: 0 0 10px rgba(240, 255, 0, 0.4);
}

.share-button-component {
  padding: 0.5rem 1.25rem;
  background: transparent;
  border: 1px solid rgba(0, 240, 255, 0.4);
  color: var(--variant-accent);
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.share-button-component:hover {
  background: rgba(0, 240, 255, 0.08);
  border-color: rgba(0, 240, 255, 0.8);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.2);
}

/* Accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
