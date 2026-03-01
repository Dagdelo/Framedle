<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  gameMode?: string
  score?: number
  guesses?: number
  maxGuesses?: number
  won?: boolean
}>()

const copied = ref(false)

function generateShareText(): string {
  const header = `Framedle ${props.gameMode ?? 'Daily'}`
  const result = props.won
    ? `${props.guesses}/${props.maxGuesses ?? 6}`
    : 'X/' + (props.maxGuesses ?? 6)
  const squares = Array.from({ length: props.maxGuesses ?? 6 }, (_, i) => {
    if (i >= (props.guesses ?? 0)) return '⬛'
    if (i === (props.guesses ?? 1) - 1 && props.won) return '🟩'
    return '🟥'
  }).join('')

  return `${header} ${result}\n${squares}\nhttps://framedle.wtf`
}

async function share() {
  const text = generateShareText()
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback handled by UI
  }
}
</script>

<template>
  <button
    class="inline-flex h-10 items-center gap-2 rounded-variant bg-variant-accent px-4 text-sm font-medium text-variant-bg transition-all hover:opacity-90"
    @click="share"
  >
    <span v-if="copied">Copied!</span>
    <span v-else>Share Result</span>
  </button>
</template>
