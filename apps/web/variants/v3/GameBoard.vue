<template>
  <div class="vapor-board">
    <!-- Ambient glows behind the board -->
    <div class="board-glow board-glow--left" aria-hidden="true" />
    <div class="board-glow board-glow--right" aria-hidden="true" />

    <!-- ── Left column: CRT Monitor + Score ─────────────── -->
    <div class="board-col board-col--left">

      <!-- CRT Monitor wrapper -->
      <div class="crt-monitor">
        <div class="crt-monitor__bezel">
          <div class="crt-monitor__screen">
            <!-- Scanline overlay on the screen -->
            <div class="crt-screen-scanlines" aria-hidden="true" />
            <!-- Screen curvature vignette -->
            <div class="crt-screen-vignette" aria-hidden="true" />
            <!-- Actual frame content -->
            <FrameViewer
              :frame-url="currentFrameUrl"
              :alt="'Guess the video from this frame'"
              class="crt-frame-viewer"
            />
            <!-- Screen glare streak -->
            <div class="crt-screen-glare" aria-hidden="true" />
          </div>
          <!-- Monitor brand strip -->
          <div class="crt-monitor__brand">
            <span class="crt-brand-text">FRAMEDLE-88</span>
            <span class="crt-brand-dot" aria-hidden="true" />
          </div>
        </div>
        <!-- Monitor stand -->
        <div class="crt-monitor__stand">
          <div class="crt-monitor__neck" />
          <div class="crt-monitor__base" />
        </div>
      </div>

      <!-- Score display card -->
      <div class="score-card">
        <div class="score-card__header">
          <span class="score-card__label">SCORE</span>
          <span class="score-card__streak">🔥 STREAK ×3</span>
        </div>
        <ScoreDisplay
          :score="score"
          :max-score="1000"
          class="score-display-inner"
        />
        <div class="score-card__bar">
          <div
            class="score-card__bar-fill"
            :style="{ width: `${(score / 1000) * 100}%` }"
          />
        </div>
      </div>
    </div>

    <!-- ── Right column: Input + History + Share ─────────── -->
    <div class="board-col board-col--right">

      <!-- Guess input card -->
      <div class="input-card">
        <label class="input-card__label" for="vapor-guess-input">
          <span class="label-ticker">▶</span>
          ENTER TRANSMISSION
        </label>
        <GuessInput
          id="vapor-guess-input"
          v-model="currentGuess"
          :placeholder="'Type a video title...'"
          :disabled="false"
          class="vapor-guess-input"
          @submit="handleGuess"
        />
        <button class="submit-btn" @click="handleGuess">
          <span class="submit-btn__gradient" aria-hidden="true" />
          <span class="submit-btn__text">TRANSMIT ▶</span>
        </button>
      </div>

      <!-- Guess history card -->
      <div class="history-card">
        <div class="history-card__header">
          <span class="history-header-label">TRANSMISSION LOG</span>
          <span class="history-header-count">{{ guesses.length }}/6</span>
        </div>

        <GuessHistory
          :guesses="[...guesses]"
          class="vapor-guess-history"
        >
          <!-- Scoped slot to style each guess row -->
          <template #item="{ guess, index }">
            <div
              class="history-item"
              :class="{
                'history-item--correct': guess.correct,
                'history-item--wrong': !guess.correct,
              }"
              :style="{ '--index': index }"
            >
              <span class="history-item__index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="history-item__text">{{ guess.text }}</span>
              <span class="history-item__badge">
                {{ guess.correct ? '✓ MATCH' : '✗ MISS' }}
              </span>
            </div>
          </template>
        </GuessHistory>

        <!-- Fallback rows when history is sparse -->
        <template v-if="guesses.length < 6">
          <div
            v-for="n in (6 - guesses.length)"
            :key="`empty-${n}`"
            class="history-item history-item--empty"
          >
            <span class="history-item__index">{{ String(guesses.length + n).padStart(2, '0') }}</span>
            <span class="history-item__text history-item__text--placeholder">— AWAITING INPUT —</span>
          </div>
        </template>
      </div>

      <!-- Share button -->
      <div class="share-block">
        <ShareButton
          :result="shareResultData"
          class="vapor-share-btn"
          @share="handleShare"
        />
        <p class="share-flavor">BROADCAST YOUR SCORE TO THE GRID</p>
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
import { useDesignVariant } from '../../composables/useDesignVariant'
useDesignVariant()

const {
  loading, error, dailyGame, currentFrameUrl, revealedFrames,
  guesses, guessesRemaining, score, gameOver, won, answer,
  loadGame, submitGuess, shareResult, getShareText,
} = useGameState()

const { results: searchResults, search: searchVideos } = useVideoSearch()

const currentGuess = ref('')

const shareResultData = computed(() => ({
  mode: 'CLASSIC',
  guesses: guesses.value.length,
  maxGuesses: 6,
  score: score.value,
  date: new Date().toISOString().slice(0, 10),
}))

async function handleGuess() {
  if (!currentGuess.value.trim() || gameOver.value) return
  await submitGuess(currentGuess.value.trim())
  currentGuess.value = ''
}

function handleShare() {
  const text = getShareText()
  if (navigator.share) {
    navigator.share({ text }).catch(() => {})
  } else {
    navigator.clipboard.writeText(text).catch(() => {})
  }
}

onMounted(() => { loadGame() })
</script>

<style scoped>
/* ─── Board Root ─────────────────────────────────────────── */
.vapor-board {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  padding: 3rem 2.5rem;
  max-width: 1100px;
  margin: 0 auto;
}

/* ─── Ambient Glows ──────────────────────────────────────── */
.board-glow {
  pointer-events: none;
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  filter: blur(100px);
  z-index: 0;
  opacity: 0.2;
}

.board-glow--left {
  top: 0;
  left: -100px;
  background: radial-gradient(circle, #c44dff, transparent 70%);
}

.board-glow--right {
  bottom: 0;
  right: -100px;
  background: radial-gradient(circle, #ff6b9d, transparent 70%);
}

/* ─── Columns ────────────────────────────────────────────── */
.board-col {
  position: relative;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ─── CRT Monitor ────────────────────────────────────────── */
.crt-monitor {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.crt-monitor__bezel {
  width: 100%;
  background: linear-gradient(
    145deg,
    #2d0050 0%,
    #1a0030 40%,
    #0d001a 100%
  );
  border-radius: 16px 16px 8px 8px;
  padding: 14px;
  border: 2px solid;
  border-color: rgba(196, 77, 255, 0.5) rgba(77, 121, 255, 0.3) rgba(255, 107, 157, 0.4) rgba(196, 77, 255, 0.5);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 0 40px rgba(196, 77, 255, 0.3),
    0 0 80px rgba(255, 107, 157, 0.15),
    inset 0 2px 0 rgba(255, 255, 255, 0.06),
    inset 0 -2px 0 rgba(0, 0, 0, 0.5);
}

.crt-monitor__screen {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  aspect-ratio: 16/9;
  background: #000;
  /* Subtle inward curvature via inner shadow */
  box-shadow:
    inset 0 0 40px rgba(0, 0, 0, 0.8),
    inset 0 0 0 2px rgba(0, 0, 0, 0.6),
    inset 4px 4px 16px rgba(0, 0, 0, 0.5),
    inset -4px -4px 16px rgba(0, 0, 0, 0.5);
}

/* Scanlines on screen */
.crt-screen-scanlines {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 10;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 3px,
    rgba(0, 0, 0, 0.25) 3px,
    rgba(0, 0, 0, 0.25) 4px
  );
  animation: animate-scanlines 6s linear infinite;
}

@keyframes animate-scanlines {
  0%   { background-position: 0 0; }
  100% { background-position: 0 100px; }
}

/* Screen curvature vignette */
.crt-screen-vignette {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 11;
  background: radial-gradient(
    ellipse 100% 100% at 50% 50%,
    transparent 60%,
    rgba(0, 0, 0, 0.5) 100%
  );
}

/* Glare streak */
.crt-screen-glare {
  pointer-events: none;
  position: absolute;
  top: 8%;
  left: 10%;
  width: 40%;
  height: 15%;
  z-index: 12;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.07) 0%,
    transparent 60%
  );
  border-radius: 50%;
  transform: rotate(-20deg);
}

.crt-frame-viewer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

/* Brand strip at bottom of bezel */
.crt-monitor__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 8px;
}

.crt-brand-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.25em;
  color: rgba(196, 77, 255, 0.6);
}

.crt-brand-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ff6b9d;
  box-shadow: 0 0 6px #ff6b9d;
  animation: blink-dot 1.5s step-end infinite;
}

@keyframes blink-dot {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}

/* Monitor stand */
.crt-monitor__stand {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.crt-monitor__neck {
  width: 24px;
  height: 20px;
  background: linear-gradient(
    180deg,
    rgba(45, 0, 80, 1),
    rgba(26, 0, 48, 1)
  );
  border-left: 1px solid rgba(196, 77, 255, 0.3);
  border-right: 1px solid rgba(196, 77, 255, 0.3);
}

.crt-monitor__base {
  width: 80px;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    rgba(196, 77, 255, 0.2),
    rgba(45, 0, 80, 1),
    rgba(255, 107, 157, 0.2)
  );
  border: 1px solid rgba(196, 77, 255, 0.3);
}

/* ─── Score Card ─────────────────────────────────────────── */
.score-card {
  padding: 1.25rem 1.5rem;
  background: linear-gradient(
    135deg,
    rgba(196, 77, 255, 0.12) 0%,
    rgba(26, 0, 48, 0.85) 50%,
    rgba(77, 121, 255, 0.08) 100%
  );
  border: 1px solid rgba(196, 77, 255, 0.35);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    0 0 24px rgba(196, 77, 255, 0.15),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  /* Slight 3D tilt */
  transform: perspective(600px) rotateX(2deg);
}

.score-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.score-card__label {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  color: rgba(196, 77, 255, 0.8);
}

.score-card__streak {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #ff6b9d;
  text-shadow: 0 0 8px rgba(255, 107, 157, 0.7);
}

/* Chrome score number styling overrides via deep selector */
.score-display-inner :deep(.score-number),
.score-display-inner :deep([class*='score']) {
  font-family: 'Orbitron', sans-serif !important;
  font-weight: 900;
  font-size: 2.5rem;
  background: linear-gradient(180deg, #fff 0%, #c44dff 40%, #ff6b9d 80%, #4d79ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 12px rgba(196, 77, 255, 0.6));
}

.score-card__bar {
  height: 4px;
  border-radius: 2px;
  background: rgba(196, 77, 255, 0.15);
  overflow: hidden;
}

.score-card__bar-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #c44dff, #ff6b9d, #4d79ff);
  background-size: 200% 100%;
  animation: animate-gradient-shift 2s linear infinite;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px rgba(196, 77, 255, 0.8);
}

@keyframes animate-gradient-shift {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* ─── Input Card ─────────────────────────────────────────── */
.input-card {
  padding: 1.5rem;
  background: linear-gradient(
    135deg,
    rgba(255, 107, 157, 0.08) 0%,
    rgba(26, 0, 48, 0.9) 50%,
    rgba(196, 77, 255, 0.08) 100%
  );
  border: 1px solid rgba(255, 107, 157, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    0 0 24px rgba(255, 107, 157, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  /* Opposite tilt to score card for variety */
  transform: perspective(600px) rotateX(-1deg);
}

.input-card__label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  color: rgba(255, 107, 157, 0.8);
}

.label-ticker {
  font-size: 0.5rem;
  color: #ff6b9d;
  animation: blink-dot 1s step-end infinite;
}

/* Gradient-accent border on the input */
.vapor-guess-input :deep(input),
.vapor-guess-input :deep([type='text']),
.vapor-guess-input :deep(textarea) {
  background: rgba(26, 0, 48, 0.8) !important;
  border: 1px solid rgba(196, 77, 255, 0.4) !important;
  border-radius: 4px !important;
  color: #f0e6ff !important;
  font-family: 'Space Grotesk', sans-serif !important;
  font-size: 0.9rem !important;
  padding: 0.65rem 1rem !important;
  transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
  width: 100% !important;
}

.vapor-guess-input :deep(input:focus),
.vapor-guess-input :deep([type='text']:focus),
.vapor-guess-input :deep(textarea:focus) {
  outline: none !important;
  border-color: rgba(255, 107, 157, 0.8) !important;
  box-shadow:
    0 0 0 2px rgba(255, 107, 157, 0.2),
    0 0 16px rgba(196, 77, 255, 0.3) !important;
}

/* Submit button */
.submit-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;
  background: linear-gradient(135deg, #ff6b9d 0%, #c44dff 50%, #4d79ff 100%);
  background-size: 200% 200%;
  transition: background-position 0.4s ease, box-shadow 0.2s ease, transform 0.15s ease;
  box-shadow:
    0 0 16px rgba(255, 107, 157, 0.4),
    0 0 32px rgba(196, 77, 255, 0.2);
}

.submit-btn:hover {
  background-position: 100% 100%;
  box-shadow:
    0 0 24px rgba(255, 107, 157, 0.6),
    0 0 48px rgba(196, 77, 255, 0.3);
  transform: translateY(-1px);
}

.submit-btn:active {
  transform: translateY(0);
}

.submit-btn__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: animate-gradient-shift 2s linear infinite;
}

.submit-btn__text {
  position: relative;
  z-index: 1;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #fff;
}

/* ─── History Card ───────────────────────────────────────── */
.history-card {
  flex: 1;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(
    135deg,
    rgba(77, 121, 255, 0.08) 0%,
    rgba(26, 0, 48, 0.9) 50%,
    rgba(196, 77, 255, 0.08) 100%
  );
  border: 1px solid rgba(77, 121, 255, 0.3);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    0 0 24px rgba(77, 121, 255, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.history-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.history-header-label {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.25em;
  color: rgba(77, 121, 255, 0.8);
}

.history-header-count {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.6rem;
  font-weight: 600;
  color: rgba(196, 77, 255, 0.7);
}

/* History items with gradient backgrounds */
.history-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.875rem;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: transform 0.15s ease;
}

.history-item--wrong {
  background: linear-gradient(
    90deg,
    rgba(255, 107, 157, 0.15) 0%,
    rgba(196, 77, 255, 0.1) 50%,
    rgba(77, 121, 255, 0.08) 100%
  );
  border-color: rgba(255, 107, 157, 0.25);
}

.history-item--correct {
  background: linear-gradient(
    90deg,
    rgba(77, 255, 150, 0.15) 0%,
    rgba(196, 77, 255, 0.12) 50%,
    rgba(77, 121, 255, 0.1) 100%
  );
  border-color: rgba(77, 255, 150, 0.4);
  box-shadow: 0 0 12px rgba(77, 255, 150, 0.2);
}

.history-item--empty {
  background: rgba(196, 77, 255, 0.04);
  border-color: rgba(196, 77, 255, 0.1);
  border-style: dashed;
}

.history-item__index {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  color: rgba(196, 77, 255, 0.5);
  min-width: 1.5rem;
}

.history-item__text {
  flex: 1;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #f0e6ff;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-item__text--placeholder {
  color: rgba(196, 77, 255, 0.35);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  font-family: 'Orbitron', sans-serif;
}

.history-item__badge {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  white-space: nowrap;
}

.history-item--wrong .history-item__badge {
  color: rgba(255, 107, 157, 0.9);
  background: rgba(255, 107, 157, 0.12);
  border: 1px solid rgba(255, 107, 157, 0.3);
}

.history-item--correct .history-item__badge {
  color: rgba(77, 255, 150, 0.9);
  background: rgba(77, 255, 150, 0.12);
  border: 1px solid rgba(77, 255, 150, 0.3);
}

/* Hide the default GuessHistory rendering since we override with slots */
.vapor-guess-history :deep([class*='guess-history-list']),
.vapor-guess-history :deep([class*='history-list']) {
  display: none;
}

/* ─── Share Block ────────────────────────────────────────── */
.share-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.vapor-share-btn :deep(button),
.vapor-share-btn :deep([role='button']) {
  width: 100% !important;
  padding: 0.75rem 1.5rem !important;
  background: linear-gradient(135deg, rgba(196, 77, 255, 0.2), rgba(255, 107, 157, 0.2)) !important;
  border: 1px solid rgba(196, 77, 255, 0.5) !important;
  border-radius: 4px !important;
  font-family: 'Orbitron', sans-serif !important;
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.2em !important;
  color: #f0e6ff !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.vapor-share-btn :deep(button:hover),
.vapor-share-btn :deep([role='button']:hover) {
  background: linear-gradient(135deg, rgba(196, 77, 255, 0.4), rgba(255, 107, 157, 0.35)) !important;
  border-color: rgba(255, 107, 157, 0.7) !important;
  box-shadow:
    0 0 20px rgba(196, 77, 255, 0.35),
    0 0 40px rgba(255, 107, 157, 0.2) !important;
}

.share-flavor {
  font-family: 'Orbitron', sans-serif;
  font-size: 0.55rem;
  font-weight: 400;
  letter-spacing: 0.18em;
  color: rgba(196, 77, 255, 0.5);
  text-align: center;
}

/* ─── Responsive ─────────────────────────────────────────── */
@media (max-width: 768px) {
  .vapor-board {
    grid-template-columns: 1fr;
    padding: 2rem 1.25rem;
  }

  .score-card,
  .input-card {
    transform: none;
  }
}
</style>
