<template>
  <div class="brutal-board font-mono-brutal">
    <!-- Two-column grid -->
    <div class="brutal-board-grid">

      <!-- Left column: frame viewer + guess input -->
      <div class="brutal-col-left">

        <!-- Frame viewer -->
        <div class="brutal-frame-wrapper">
          <div class="brutal-frame-label" aria-label="Frame number">FRAME_01</div>
          <div class="brutal-frame-box">
            <FrameViewer />
          </div>
        </div>

        <!-- Guess input — terminal prompt style -->
        <div class="brutal-input-wrapper">
          <label class="brutal-input-label" for="guess-input">ENTER_GUESS:</label>
          <div class="brutal-input-row">
            <span class="brutal-prompt-prefix" aria-hidden="true">&gt;&nbsp;</span>
            <GuessInput
              id="guess-input"
              class="brutal-guess-input"
              placeholder="type song title..."
            />
          </div>
        </div>

      </div>

      <!-- Right column: guess log + score + share -->
      <div class="brutal-col-right">

        <!-- Guess history — terminal log -->
        <div class="brutal-log-wrapper">
          <div class="brutal-log-header" aria-label="Guess history">
            <span>GUESS_LOG</span>
            <span class="brutal-log-count">{{ guesses.length }}/6</span>
          </div>
          <GuessHistory :guesses="[...guesses]" class="brutal-guess-history-slot" />
          <ol class="brutal-log-list" aria-label="Previous guesses">
            <li
              v-for="(guess, index) in guesses"
              :key="guess.id"
              class="brutal-log-entry"
              :class="guess.correct ? 'brutal-log-correct' : 'brutal-log-wrong'"
            >
              <span class="brutal-log-index">[{{ String(index + 1).padStart(2, '0') }}]</span>
              <span class="brutal-log-icon" aria-hidden="true">{{ guess.correct ? '✓' : '✗' }}</span>
              <span class="brutal-log-text">{{ guess.text }}</span>
            </li>
          </ol>
          <!-- Empty slots -->
          <ol class="brutal-log-list brutal-log-empty" aria-label="Remaining guesses" :start="guesses.length + 1">
            <li
              v-for="n in Math.max(0, 6 - guesses.length)"
              :key="n"
              class="brutal-log-entry brutal-log-slot"
            >
              <span class="brutal-log-index">[{{ String(guesses.length + n).padStart(2, '0') }}]</span>
              <span class="brutal-log-icon" aria-hidden="true">_</span>
              <span class="brutal-log-text brutal-log-slot-text">awaiting input...</span>
            </li>
          </ol>
        </div>

        <!-- Status bar -->
        <div class="brutal-status-bar" role="status" aria-label="Game status">
          <ScoreDisplay class="brutal-score-slot" />
          <span class="brutal-status-segment">
            <span class="brutal-status-key">SCORE</span>
            <span class="brutal-status-sep">:</span>
            <span class="brutal-status-val">0</span>
          </span>
          <span class="brutal-status-divider" aria-hidden="true">|</span>
          <span class="brutal-status-segment">
            <span class="brutal-status-key">STREAK</span>
            <span class="brutal-status-sep">:</span>
            <span class="brutal-status-val">0</span>
          </span>
          <span class="brutal-status-divider" aria-hidden="true">|</span>
          <span class="brutal-status-segment">
            <span class="brutal-status-key">TIME</span>
            <span class="brutal-status-sep">:</span>
            <span class="brutal-status-val">2:30</span>
          </span>
        </div>

        <!-- Share button -->
        <div class="brutal-share-wrapper">
          <ShareButton class="brutal-share-slot" />
          <button class="brutal-share-btn" type="button">
            [SHARE_RESULT]
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDesignVariant } from '~/composables/useDesignVariant'
import {
  FrameViewer,
  GuessInput,
  GuessHistory,
  ScoreDisplay,
  ShareButton,
} from '@framedle/ui'

const { cssVariables } = useDesignVariant()

const {
  loading, error, dailyGame, currentFrameUrl, revealedFrames,
  guesses, guessesRemaining, score, gameOver, won, answer,
  loadGame, submitGuess, shareResult, getShareText,
} = useGameState()

const { results: searchResults, search: searchVideos } = useVideoSearch()

const currentGuess = ref('')

async function onSubmitGuess() {
  if (!currentGuess.value.trim() || gameOver.value) return
  await submitGuess(currentGuess.value.trim())
  currentGuess.value = ''
}

function onShare() {
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
.brutal-board {
  width: 100%;
}

/* Two-column grid with hard border between columns */
.brutal-board-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 2px solid var(--variant-border);
}

@media (max-width: 720px) {
  .brutal-board-grid {
    grid-template-columns: 1fr;
  }
}

.brutal-col-left {
  display: flex;
  flex-direction: column;
  border-right: 2px solid var(--variant-border);
}

@media (max-width: 720px) {
  .brutal-col-left {
    border-right: none;
    border-bottom: 2px solid var(--variant-border);
  }
}

.brutal-col-right {
  display: flex;
  flex-direction: column;
}

/* Frame viewer */
.brutal-frame-wrapper {
  border-bottom: 2px solid var(--variant-border);
}

.brutal-frame-label {
  padding: 0.3rem 0.75rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--variant-fg-muted);
  background-color: var(--variant-muted);
  border-bottom: 2px solid var(--variant-border);
}

.brutal-frame-box {
  background-color: var(--variant-bg-secondary);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Guess input */
.brutal-input-wrapper {
  padding: 0.75rem;
}

.brutal-input-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--variant-fg-muted);
  margin-bottom: 0.35rem;
}

.brutal-input-row {
  display: flex;
  align-items: center;
  border-bottom: 2px solid var(--variant-fg);
}

.brutal-prompt-prefix {
  font-size: 1rem;
  font-weight: 700;
  color: var(--variant-accent);
  flex-shrink: 0;
  padding-bottom: 0.2rem;
}

/* GuessInput slot — style via deep selector */
.brutal-guess-input {
  flex: 1;
}

:deep(.brutal-guess-input input),
:deep(.brutal-guess-input) {
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--variant-fg);
  background: transparent;
  border: none;
  outline: none;
  border-radius: 0;
  padding: 0.2rem 0;
  width: 100%;
}

/* Guess history log */
.brutal-log-wrapper {
  flex: 1;
  border-bottom: 2px solid var(--variant-border);
}

.brutal-log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0.75rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--variant-fg-muted);
  background-color: var(--variant-muted);
  border-bottom: 2px solid var(--variant-border);
}

.brutal-log-count {
  color: var(--variant-accent);
}

/* Hide the component slot (real component hidden, we render mock list) */
.brutal-guess-history-slot {
  display: none;
}

.brutal-log-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.brutal-log-entry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.75rem;
  border-bottom: 1px solid var(--variant-border);
  font-size: 0.8rem;
  font-weight: 600;
}

.brutal-log-entry:last-child {
  border-bottom: none;
}

.brutal-log-index {
  color: var(--variant-fg-muted);
  font-size: 0.7rem;
  flex-shrink: 0;
}

.brutal-log-icon {
  flex-shrink: 0;
  width: 1rem;
  text-align: center;
}

.brutal-log-correct .brutal-log-icon {
  color: var(--variant-correct);
}

.brutal-log-wrong .brutal-log-icon {
  color: var(--variant-incorrect);
}

.brutal-log-text {
  flex: 1;
  color: var(--variant-fg);
}

.brutal-log-slot {
  opacity: 0.35;
}

.brutal-log-slot-text {
  font-style: normal;
  font-weight: 400;
  color: var(--variant-fg-muted);
}

/* Status bar */
.brutal-status-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  background-color: var(--variant-muted);
  border-bottom: 2px solid var(--variant-border);
}

/* Hide the real ScoreDisplay, use inline markup */
.brutal-score-slot {
  display: none;
}

.brutal-status-segment {
  display: flex;
  align-items: center;
  gap: 0;
}

.brutal-status-key {
  color: var(--variant-fg-muted);
}

.brutal-status-sep {
  color: var(--variant-fg-muted);
  margin: 0 0.1rem;
}

.brutal-status-val {
  color: var(--variant-fg);
}

.brutal-status-divider {
  color: var(--variant-border);
  user-select: none;
}

/* Share */
.brutal-share-wrapper {
  padding: 0.75rem;
  display: flex;
  align-items: center;
}

/* Hide the real ShareButton, show our styled one */
.brutal-share-slot {
  display: none;
}

.brutal-share-btn {
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--variant-accent);
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.brutal-share-btn:hover {
  color: var(--variant-fg);
}
</style>
