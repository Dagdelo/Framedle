<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('rounded-variant border border-variant-border bg-variant-card text-variant-card-fg shadow-variant', props.class)">
    <slot />
  </div>
</template>
