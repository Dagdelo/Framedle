<script setup lang="ts">
const { cssVariables, theme } = useDesignVariant()
</script>

<template>
  <div class="min-h-screen bg-variant-bg text-variant-fg" :style="cssVariables">
    <slot />
  </div>
</template>
