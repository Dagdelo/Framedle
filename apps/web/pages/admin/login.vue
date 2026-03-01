<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { isAuthenticated, isAdmin, signIn } = useAuth()

if (isAuthenticated.value && isAdmin.value) {
  await navigateTo('/admin')
} else if (!isAuthenticated.value) {
  signIn('/admin')
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div class="w-full max-w-sm">
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6 text-center">
        <template v-if="isAuthenticated && !isAdmin">
          <h2 class="text-xl font-bold text-white">Access Denied</h2>
          <p class="text-sm text-zinc-400">Your account does not have admin privileges.</p>
          <NuxtLink to="/" class="inline-block px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-md transition-colors">
            Go Home
          </NuxtLink>
        </template>
        <template v-else>
          <p class="text-sm text-zinc-400">Redirecting to sign in...</p>
        </template>
      </div>
    </div>
  </div>
</template>
