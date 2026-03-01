<script setup lang="ts">
import type { Guess } from './types'

defineProps<{
  guesses: Guess[]
  maxVisible?: number
}>()
</script>

<template>
  <div class="space-y-2">
    <TransitionGroup name="guess-list">
      <div
        v-for="guess in guesses.slice(0, maxVisible ?? 6)"
        :key="guess.id"
        class="flex items-center gap-3 rounded-variant border px-3 py-2 text-sm transition-all"
        :class="guess.correct
          ? 'border-variant-correct/50 bg-variant-correct/10 text-variant-correct'
          : 'border-variant-border bg-variant-card text-variant-card-fg'"
      >
        <span class="flex-shrink-0 text-lg">
          {{ guess.correct ? '✓' : '✗' }}
        </span>
        <span class="flex-1 truncate">{{ guess.text }}</span>
      </div>
    </TransitionGroup>
    <p v-if="!guesses.length" class="text-center text-sm text-variant-fg-muted">
      No guesses yet
    </p>
  </div>
</template>

<style scoped>
.guess-list-enter-active {
  transition: all 0.3s ease-out;
}
.guess-list-leave-active {
  transition: all 0.2s ease-in;
}
.guess-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.guess-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
