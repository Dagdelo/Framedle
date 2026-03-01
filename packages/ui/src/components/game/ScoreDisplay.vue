<script setup lang="ts">
defineProps<{
  score?: number
  streak?: number
  timeRemaining?: number
  maxTime?: number
}>()

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="flex items-center gap-4 text-sm">
    <div v-if="score !== undefined" class="flex items-center gap-1.5">
      <span class="text-variant-fg-muted">Score</span>
      <span class="font-bold text-variant-accent">{{ score }}</span>
    </div>
    <div v-if="streak !== undefined && streak > 0" class="flex items-center gap-1.5">
      <span class="text-variant-fg-muted">Streak</span>
      <span class="font-bold text-variant-accent-2">{{ streak }}</span>
    </div>
    <div v-if="timeRemaining !== undefined" class="flex items-center gap-1.5">
      <span class="text-variant-fg-muted">Time</span>
      <span
        class="font-mono font-bold"
        :class="timeRemaining < 10 ? 'text-variant-incorrect' : 'text-variant-fg'"
      >
        {{ formatTime(timeRemaining) }}
      </span>
      <div
        v-if="maxTime"
        class="h-1 w-16 overflow-hidden rounded-full bg-variant-muted"
      >
        <div
          class="h-full bg-variant-accent transition-all duration-1000"
          :style="{ width: `${(timeRemaining / maxTime) * 100}%` }"
        />
      </div>
    </div>
  </div>
</template>
