<script setup lang="ts">
defineProps<{
  imageUrl?: string
  blurLevel?: number
  round?: number
  totalRounds?: number
}>()
</script>

<template>
  <div class="relative overflow-hidden rounded-variant border border-variant-border shadow-variant">
    <div class="aspect-video w-full bg-variant-muted">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        alt="Frame to guess"
        class="h-full w-full object-cover transition-all duration-500"
        :style="{ filter: `blur(${blurLevel ?? 0}px)` }"
      />
      <div v-else class="flex h-full items-center justify-center">
        <span class="text-variant-fg-muted text-sm">Loading frame...</span>
      </div>
    </div>
    <div
      v-if="round !== undefined && totalRounds !== undefined"
      class="absolute bottom-2 right-2 rounded-variant bg-variant-bg/80 px-2 py-1 text-xs text-variant-fg backdrop-blur"
    >
      {{ round }} / {{ totalRounds }}
    </div>
  </div>
</template>
