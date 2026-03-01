<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  modelValue?: string
  placeholder?: string
  type?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    :type="type ?? 'text'"
    :class="cn(
      'flex h-9 w-full rounded-variant border border-variant-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-variant-fg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-variant-accent disabled:cursor-not-allowed disabled:opacity-50',
      props.class
    )"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
