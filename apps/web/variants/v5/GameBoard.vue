<template>
  <div class="relative flex flex-col gap-6 py-4">
    <!-- Ambient coral glow behind board -->
    <div
      class="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(231,111,81,0.07)_0%,transparent_70%)] blur-3xl"
      aria-hidden="true"
    />

    <!-- Top bar: score + share -->
    <div class="flex items-center justify-between px-1">
      <!-- Score display -->
      <div class="flex items-center gap-3">
        <div
          class="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        >
          <span class="text-xs uppercase tracking-widest text-white/30 font-light font-['Inter']">Score</span>
          <span class="text-xl font-light text-[#f4a261] font-['Inter'] tabular-nums">{{ score }}</span>
        </div>
        <div
          class="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        >
          <span class="text-xs uppercase tracking-widest text-white/30 font-light font-['Inter']">Guesses</span>
          <span class="text-xl font-light text-white/60 font-['Inter'] tabular-nums">
            {{ guesses.length }}<span class="text-white/20">/6</span>
          </span>
        </div>
      </div>

      <!-- Share button -->
      <button
        class="rounded-full bg-gradient-to-br from-[#f4a261] to-[#e76f51] px-6 py-2.5 text-sm font-medium tracking-wide text-white shadow-[0_4px_20px_rgba(231,111,81,0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(231,111,81,0.45)] transition-all duration-300 select-none"
        @click="handleShare"
      >
        Share
      </button>
    </div>

    <!-- Frame viewer — frosted glass container -->
    <div
      class="relative w-full rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.45)] overflow-hidden"
    >
      <!-- Top-edge highlight -->
      <div
        class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />

      <!-- Frame placeholder (FrameViewer slot) -->
      <div
        class="w-full aspect-video rounded-xl bg-white/5 border border-white/8 flex items-center justify-center overflow-hidden"
      >
        <!-- Shimmer loading state -->
        <div class="relative w-full h-full flex items-center justify-center">
          <div
            class="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent"
            aria-hidden="true"
          />
          <div class="flex flex-col items-center gap-3 relative z-10">
            <div class="w-12 h-12 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
              <svg
                class="w-5 h-5 text-white/30"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span class="text-xs font-light text-white/25 tracking-widest uppercase">Loading frame…</span>
          </div>
        </div>
      </div>

      <!-- Guess counter dots -->
      <div class="flex items-center justify-center gap-1.5 mt-5">
        <div
          v-for="i in 6"
          :key="i"
          class="w-1.5 h-1.5 rounded-full transition-all duration-300"
          :class="
            i <= guesses.length
              ? guesses[i - 1]?.correct
                ? 'bg-[#2a9d8f]'
                : 'bg-[#e76f51]/60'
              : 'bg-white/15'
          "
          :aria-label="`Guess ${i}`"
        />
      </div>
    </div>

    <!-- Guess input — frosted glass, rounded-full -->
    <div
      class="relative w-full rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
    >
      <div class="flex items-center gap-3">
        <input
          v-model="currentGuess"
          type="text"
          placeholder="Name the video…"
          class="flex-1 rounded-full bg-white/8 border border-white/10 px-5 py-3 text-sm font-light text-white/80 placeholder:text-white/25 tracking-wide outline-none focus:border-[#f4a261]/50 focus:bg-white/10 transition-all duration-300 font-['Inter']"
          @keydown.enter="submitGuess"
        />
        <button
          class="flex-shrink-0 rounded-full bg-[#f4a261] px-6 py-3 text-sm font-medium text-[#1a1a2e] tracking-wide shadow-[0_4px_16px_rgba(244,162,97,0.30)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(244,162,97,0.40)] transition-all duration-300 select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          :disabled="!currentGuess.trim()"
          @click="submitGuess"
        >
          Guess
        </button>
      </div>

      <!-- Hint row -->
      <div class="flex items-center justify-between mt-3 px-1">
        <span class="text-[11px] font-light text-white/25 tracking-wide font-['Inter']">
          Enter artist, title, or channel name
        </span>
        <button
          class="text-[11px] font-light text-[#2a9d8f]/70 hover:text-[#2a9d8f] transition-colors duration-200 tracking-wide"
          @click="skipGuess"
        >
          Skip
        </button>
      </div>
    </div>

    <!-- Guess history — frosted glass cards with entrance transitions -->
    <div class="flex flex-col gap-3">
      <span
        v-if="guesses.length > 0"
        class="text-xs uppercase tracking-widest text-white/25 font-light px-1"
      >
        Previous guesses
      </span>

      <TransitionGroup
        name="guess"
        tag="div"
        class="flex flex-col gap-2"
      >
        <div
          v-for="guess in [...guesses].reverse()"
          :key="guess.id"
          class="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-4 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.25)] transition-all duration-300"
          :class="guess.correct ? 'border-[#2a9d8f]/30 bg-[#2a9d8f]/5' : 'border-white/10'"
        >
          <div class="flex items-center gap-3">
            <!-- Result icon -->
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              :class="guess.correct ? 'bg-[#2a9d8f]/20' : 'bg-white/8'"
            >
              <span class="text-sm" aria-hidden="true">{{ guess.correct ? '✓' : '✗' }}</span>
            </div>
            <span
              class="text-sm font-light tracking-wide font-['Inter']"
              :class="guess.correct ? 'text-[#2a9d8f]' : 'text-white/45 line-through decoration-white/20'"
            >
              {{ guess.text }}
            </span>
          </div>
          <span
            class="text-[10px] uppercase tracking-widest font-light"
            :class="guess.correct ? 'text-[#2a9d8f]/60' : 'text-white/20'"
          >
            {{ guess.correct ? 'Correct' : 'Wrong' }}
          </span>
        </div>
      </TransitionGroup>

      <!-- Empty state -->
      <div
        v-if="guesses.length === 0"
        class="rounded-2xl bg-white/3 border border-white/5 px-5 py-8 flex items-center justify-center"
      >
        <span class="text-sm font-light text-white/20 tracking-wide font-['Inter']">
          No guesses yet — make your first guess above
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const {
  loading, error, dailyGame, currentFrameUrl, revealedFrames,
  guesses, guessesRemaining, score, gameOver, won, answer,
  loadGame, submitGuess: doSubmitGuess, skipGuess: doSkipGuess,
  shareResult, getShareText,
} = useGameState()

const { results: searchResults, search: searchVideos } = useVideoSearch()

const currentGuess = ref('')

async function submitGuess() {
  const text = currentGuess.value.trim()
  if (!text || gameOver.value) return
  await doSubmitGuess(text)
  currentGuess.value = ''
}

async function skipGuess() {
  if (gameOver.value) return
  await doSkipGuess()
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
/* Guess list entrance / exit transition */
.guess-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.guess-leave-active {
  transition: all 0.2s ease-in;
}
.guess-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
.guess-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* Shimmer animation for frame loading state */
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer {
  animation: shimmer 2s ease-in-out infinite;
}

/* Soft pulse for ambient elements */
@keyframes soft-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
.animate-soft-pulse {
  animation: soft-pulse 3s ease-in-out infinite;
}
</style>
