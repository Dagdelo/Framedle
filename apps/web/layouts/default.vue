<script setup lang="ts">
const { cssVariables } = useDesignVariant()
</script>

<template>
  <div class="min-h-screen bg-variant-bg text-variant-fg" :style="cssVariables">
    <header class="border-b border-variant-border">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="text-lg font-bold tracking-tight">Framedle</NuxtLink>
        <AuthButton />
      </div>
    </header>

    <main>
      <slot />
    </main>

    <ClaimAnonymousDialog />
  </div>
</template>
