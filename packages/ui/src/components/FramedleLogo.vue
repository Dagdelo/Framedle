<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <span
    class="font-bold"
    :class="{
      'text-lg': size === 'sm',
      'text-2xl': size === 'md' || !size,
      'text-4xl': size === 'lg',
    }"
  >
    Framedle
  </span>
</template>
