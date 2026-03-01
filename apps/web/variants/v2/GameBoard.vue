<template>
  <div class="paper-cut-gameboard pt-4 pb-12">
    <div class="mx-auto max-w-2xl">

      <!-- FrameViewer: polaroid wrapper -->
      <div class="polaroid-frame relative mb-10 inline-block">
        <!-- Pin -->
        <div class="pin" aria-hidden="true" />

        <div
          class="polaroid-inner bg-white"
          style="
            padding: 10px 10px 48px 10px;
            box-shadow: 5px 5px 0 rgba(0,0,0,0.10), 2px 2px 0 rgba(0,0,0,0.06);
            border-radius: 1px;
            transform: rotate(-1.5deg);
          "
        >
          <!-- Frame viewer slot — dark placeholder until real component wires in -->
          <div class="frame-viewer-wrapper">
            <FrameViewer v-if="false" />
            <div
              class="frame-placeholder"
              style="
                width: 100%;
                height: 220px;
                background-color: #2d2416;
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              <span class="font-handwritten text-lg" style="color: rgba(255,255,255,0.35);">
                today's frame
              </span>
            </div>
          </div>

          <!-- Handwritten caption below the photo -->
          <p
            class="font-handwritten text-base text-center mt-3 leading-none"
            style="color: var(--variant-fg-muted)"
          >
            guess the video ↑
          </p>
        </div>
      </div>

      <!-- Guess input: lined notebook area -->
      <div class="notebook-area mb-6 relative">
        <div class="notebook-lines" aria-hidden="true" />

        <div class="relative z-10 px-4 py-3">
          <GuessInput v-if="false" />

          <!-- Styled fallback input -->
          <div class="flex items-center gap-2">
            <label
              class="font-handwritten text-base"
              style="color: var(--variant-fg-muted); white-space: nowrap;"
              for="guess-input-v2"
            >
              your guess:
            </label>
            <input
              id="guess-input-v2"
              v-model="currentGuess"
              type="text"
              placeholder="type a video title…"
              class="flex-1 bg-transparent outline-none font-handwritten text-lg"
              style="
                color: var(--variant-fg);
                border-bottom: 1.5px solid var(--variant-border);
                padding: 4px 2px;
                caret-color: var(--variant-accent);
              "
              @keydown.enter="submitGuess"
            />
            <button
              class="font-handwritten text-sm px-4 py-1 transition-all duration-150"
              style="
                background-color: var(--variant-accent);
                color: #fff;
                border-radius: 2px;
                box-shadow: 2px 2px 0 rgba(0,0,0,0.12);
              "
              @click="submitGuess"
            >
              submit
            </button>
          </div>
        </div>
      </div>

      <!-- Guess history -->
      <div class="guess-history mb-8">
        <h3
          class="font-handwritten text-base mb-3"
          style="color: var(--variant-fg-muted); border-bottom: 1px dashed var(--variant-border); padding-bottom: 4px;"
        >
          guesses so far:
        </h3>

        <GuessHistory v-if="false" :guesses="[...guesses]" />

        <!-- Rendered guess list -->
        <ul class="space-y-2">
          <li
            v-for="(guess, i) in guesses"
            :key="guess.id"
            class="guess-item flex items-center gap-3 px-4 py-2"
            :class="[
              guess.correct ? 'animate-stamp' : 'animate-paper-unfold',
              guess.correct ? 'guess-item--correct' : 'guess-item--incorrect',
            ]"
            :style="{
              animationDelay: `${i * 0.08}s`,
              transform: `rotate(${i % 2 === 0 ? '-0.4' : '0.3'}deg)`,
              backgroundColor: guess.correct ? 'rgba(90,138,78,0.12)' : 'rgba(255,255,255,0.7)',
              borderLeft: `3px solid ${guess.correct ? 'var(--variant-correct)' : 'var(--variant-border)'}`,
              boxShadow: '2px 2px 0 rgba(0,0,0,0.06)',
              borderRadius: '1px',
            }"
          >
            <!-- Stamp mark for correct -->
            <span
              v-if="guess.correct"
              class="stamp-mark font-handwritten text-lg font-bold leading-none"
              style="color: var(--variant-correct); transform: rotate(-8deg); display: inline-block;"
            >
              ✓
            </span>
            <!-- X mark for incorrect -->
            <span
              v-else
              class="font-handwritten text-base leading-none"
              style="color: var(--variant-incorrect); opacity: 0.7;"
            >
              ✗
            </span>

            <span
              class="font-handwritten text-base flex-1"
              style="color: var(--variant-fg)"
            >
              {{ guess.text }}
            </span>

            <span
              class="font-serif-body text-xs italic"
              style="color: var(--variant-fg-muted)"
            >
              #{{ i + 1 }}
            </span>
          </li>
        </ul>

        <p
          v-if="guesses.length === 0"
          class="font-handwritten text-sm italic"
          style="color: var(--variant-fg-muted)"
        >
          no guesses yet…
        </p>
      </div>

      <!-- Score display: handwritten scorecard -->
      <div
        class="scorecard mb-8 inline-block px-8 py-5 relative"
        style="
          background-color: #fff;
          border: 1.5px solid var(--variant-border);
          box-shadow: 3px 3px 0 rgba(0,0,0,0.08);
          border-radius: 1px;
          transform: rotate(0.8deg);
        "
      >
        <!-- Scorecard tape strip -->
        <div
          class="absolute -top-3 left-1/2 -translate-x-1/2"
          style="
            width: 50px;
            height: 14px;
            background-color: rgba(196,169,125,0.55);
            transform: translateX(-50%) rotate(-2deg);
            border-radius: 1px;
          "
          aria-hidden="true"
        />

        <ScoreDisplay v-if="false" />

        <div class="text-center">
          <p
            class="font-handwritten text-xs uppercase tracking-widest mb-1"
            style="color: var(--variant-fg-muted)"
          >
            score
          </p>
          <p
            class="font-handwritten text-5xl leading-none"
            style="color: var(--variant-fg)"
          >
            {{ score }}
          </p>
          <p
            class="font-handwritten text-sm mt-1"
            style="color: var(--variant-accent)"
          >
            pts
          </p>
        </div>
      </div>

      <!-- Share button: kraft paper style -->
      <div class="mt-2">
        <ShareButton v-if="false" />

        <button
          class="share-btn font-handwritten text-lg px-7 py-3 transition-all duration-150"
          style="
            background-color: #c9a96e;
            color: var(--variant-fg);
            border: 1.5px solid rgba(0,0,0,0.14);
            border-radius: 2px;
            box-shadow: 3px 3px 0 rgba(0,0,0,0.10);
          "
          @mouseenter="shareHovered = true"
          @mouseleave="shareHovered = false"
          :style="[
            {
              backgroundColor: '#c9a96e',
              color: 'var(--variant-fg)',
              border: '1.5px solid rgba(0,0,0,0.14)',
              borderRadius: '2px',
              boxShadow: shareHovered ? '5px 5px 0 rgba(0,0,0,0.13)' : '3px 3px 0 rgba(0,0,0,0.10)',
              transform: shareHovered ? 'translateY(-2px) rotate(-0.5deg)' : 'rotate(0)',
              transition: 'all 0.15s ease',
            }
          ]"
        >
          share result ✉
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FrameViewer, GuessInput, GuessHistory, ScoreDisplay, ShareButton } from '@framedle/ui'

const {
  loading, error, dailyGame, currentFrameUrl, revealedFrames,
  guesses, guessesRemaining, score, gameOver, won, answer,
  loadGame, submitGuess: doSubmitGuess, shareResult,
} = useGameState()

const { results: searchResults, search: searchVideos } = useVideoSearch()

const currentGuess = ref('')
const shareHovered = ref(false)

async function submitGuess() {
  const text = currentGuess.value.trim()
  if (!text || gameOver.value) return
  await doSubmitGuess(text)
  currentGuess.value = ''
}

onMounted(() => { loadGame() })
</script>

<style scoped>
/* ── Push-pin (reused in polaroid) ── */
.pin {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 14px;
  background: radial-gradient(circle at 35% 35%, #e06030, #8b3010);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3);
  z-index: 20;
}

/* ── Polaroid frame ── */
.polaroid-frame {
  animation: gentle-float 0.5s ease-out both;
}

@keyframes gentle-float {
  from {
    opacity: 0;
    transform: rotate(-1.5deg) translateY(14px);
  }
  to {
    opacity: 1;
  }
}

/* ── Lined notebook input area ── */
.notebook-area {
  background-color: rgba(255, 255, 255, 0.75);
  border: 1px solid var(--variant-border);
  border-radius: 1px;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.06);
  overflow: hidden;
}

.notebook-lines {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 31px,
    rgba(196, 169, 125, 0.30) 31px,
    rgba(196, 169, 125, 0.30) 32px
  );
  pointer-events: none;
}

/* ── Guess item animations ── */
.animate-paper-unfold {
  animation: paper-unfold 0.35s ease-out both;
}

@keyframes paper-unfold {
  from {
    opacity: 0;
    transform: scaleY(0.6) translateY(-6px);
    transform-origin: top;
  }
  to {
    opacity: 1;
  }
}

.animate-stamp {
  animation: stamp-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes stamp-in {
  from {
    opacity: 0;
    transform: scale(1.12) rotate(-1deg);
  }
  60% {
    transform: scale(0.96) rotate(0.2deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

/* ── Stamp mark pulse on correct ── */
.stamp-mark {
  animation: stamp-mark-appear 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}

@keyframes stamp-mark-appear {
  from {
    opacity: 0;
    transform: scale(1.6) rotate(-8deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(-8deg);
  }
}

/* ── Share button ── */
.share-btn {
  animation: gentle-float 0.6s 0.3s ease-out both;
}
</style>
