<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  placeholder?: string
  disabled?: boolean
  suggestions?: string[]
}>()

const emit = defineEmits<{
  submit: [guess: string]
}>()

const query = ref('')
const showSuggestions = ref(false)

function handleSubmit() {
  if (query.value.trim()) {
    emit('submit', query.value.trim())
    query.value = ''
    showSuggestions.value = false
  }
}

function selectSuggestion(suggestion: string) {
  query.value = suggestion
  showSuggestions.value = false
  handleSubmit()
}

function hideSuggestions() {
  setTimeout(() => { showSuggestions.value = false }, 200)
}
</script>

<template>
  <div class="relative">
    <form @submit.prevent="handleSubmit" class="flex gap-2">
      <div class="relative flex-1">
        <input
          v-model="query"
          :placeholder="placeholder ?? 'Guess the video...'"
          :disabled="disabled"
          class="h-10 w-full rounded-variant border border-variant-border bg-transparent px-3 text-variant-fg placeholder:text-variant-fg-muted focus:outline-none focus:ring-1 focus:ring-variant-accent disabled:opacity-50"
          @focus="showSuggestions = true"
          @blur="hideSuggestions"
        />
        <div
          v-if="showSuggestions && suggestions?.length"
          class="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-variant border border-variant-border bg-variant-card shadow-variant-lg"
        >
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            type="button"
            class="block w-full px-3 py-2 text-left text-sm text-variant-card-fg hover:bg-variant-muted"
            @click="selectSuggestion(suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>
      <button
        type="submit"
        :disabled="disabled || !query.trim()"
        class="h-10 rounded-variant bg-variant-accent px-4 text-sm font-medium text-variant-bg transition-colors hover:opacity-90 disabled:opacity-50"
      >
        Guess
      </button>
    </form>
  </div>
</template>
