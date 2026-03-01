<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { login, isAuthenticated } = useAdmin()
const secret = ref('')
const error = ref('')
const loading = ref(false)

if (import.meta.client && isAuthenticated.value) {
  navigateTo('/admin')
}

async function handleLogin() {
  if (!secret.value.trim()) {
    error.value = 'Please enter the admin secret'
    return
  }

  loading.value = true
  error.value = ''

  try {
    login(secret.value.trim())

    // Validate the token by calling getStats
    const { getStats } = useAdmin()
    const res = await getStats()

    if (res.error) {
      const { logout } = useAdmin()
      logout()
      error.value = 'Invalid admin secret'
      return
    }

    navigateTo('/admin')
  } catch {
    const { logout } = useAdmin()
    logout()
    error.value = 'Failed to connect to API'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh]">
    <div class="w-full max-w-sm">
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-6">
        <div class="text-center">
          <h2 class="text-xl font-bold text-white">Admin Login</h2>
          <p class="text-sm text-zinc-400 mt-1">Enter your admin secret to continue</p>
        </div>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <div>
            <label for="secret" class="block text-sm font-medium text-zinc-300 mb-1.5">
              Admin Secret
            </label>
            <input
              id="secret"
              v-model="secret"
              type="password"
              placeholder="Enter admin secret..."
              class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              :disabled="loading"
              autocomplete="off"
            />
          </div>

          <p v-if="error" class="text-sm text-red-400">
            {{ error }}
          </p>

          <button
            type="submit"
            class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white text-sm font-medium rounded-md transition-colors"
            :disabled="loading"
          >
            {{ loading ? 'Verifying...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
