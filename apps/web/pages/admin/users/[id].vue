<script setup lang="ts">
import type { AdminUserDetail } from '@framedle/api-client'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const { getUserById, updateUserRole, deleteUser } = useAdmin()

const user = ref<AdminUserDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const actionError = ref<string | null>(null)

const userId = route.params.id as string

onMounted(async () => {
  try {
    const res = await getUserById(userId)
    if (res.data) {
      user.value = res.data
    } else if (res.error) {
      error.value = res.error.message
    }
  } catch {
    error.value = 'Failed to load user'
  } finally {
    loading.value = false
  }
})

async function toggleRole() {
  if (!user.value) return
  const newRole = user.value.role === 'admin' ? 'user' : 'admin'
  actionError.value = null
  try {
    const res = await updateUserRole(userId, newRole)
    if (res.data) {
      user.value = { ...user.value, role: res.data.role }
    } else if (res.error) {
      actionError.value = res.error.message
    }
  } catch {
    actionError.value = 'Failed to update role'
  }
}

async function handleDelete() {
  if (!user.value) return
  if (!confirm(`Soft-delete user "${user.value.displayName}"? This cannot be undone easily.`)) return
  actionError.value = null
  try {
    await deleteUser(userId)
    await navigateTo('/admin/users')
  } catch {
    actionError.value = 'Failed to delete user'
  }
}

function formatDate(dateStr: string | number): string {
  return new Date(dateStr).toLocaleDateString()
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin/users" class="text-zinc-400 hover:text-white transition-colors text-sm">
        ← Users
      </NuxtLink>
      <h1 class="text-2xl font-bold">User Detail</h1>
    </div>

    <div v-if="loading" class="text-zinc-400">Loading...</div>
    <div v-else-if="error" class="text-red-400">{{ error }}</div>

    <div v-else-if="user" class="space-y-6">
      <!-- Profile -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div class="flex items-start gap-4">
          <img
            v-if="user.avatarUrl"
            :src="user.avatarUrl"
            :alt="user.displayName"
            class="w-16 h-16 rounded-full object-cover bg-zinc-800"
          />
          <div v-else class="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-2xl font-medium">
            {{ user.displayName.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-semibold text-white">{{ user.displayName }}</h2>
            <p class="text-sm text-zinc-400">{{ user.email }}</p>
            <p class="text-xs text-zinc-500 mt-1">Joined {{ formatDate(user.joinedAt) }}</p>
            <span
              class="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium"
              :class="user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'"
            >
              {{ user.role }}
            </span>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p class="text-xs text-zinc-400">Games Played</p>
          <p class="text-xl font-bold text-white mt-1">{{ user.gamesPlayed }}</p>
        </div>
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p class="text-xs text-zinc-400">XP</p>
          <p class="text-xl font-bold text-white mt-1">{{ user.xp.toLocaleString() }}</p>
        </div>
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p class="text-xs text-zinc-400">Current Streak</p>
          <p class="text-xl font-bold text-white mt-1">{{ user.streakCurrent }}</p>
        </div>
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p class="text-xs text-zinc-400">Best Streak</p>
          <p class="text-xl font-bold text-white mt-1">{{ user.streakBest }}</p>
        </div>
      </div>

      <!-- Recent Games -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div class="px-5 py-4 border-b border-zinc-800">
          <h3 class="font-medium text-white">Recent Games</h3>
        </div>
        <div v-if="user.recentGames.length === 0" class="px-5 py-4 text-sm text-zinc-400">
          No games played yet.
        </div>
        <table v-else class="w-full">
          <thead>
            <tr class="border-b border-zinc-800">
              <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Date</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Game ID</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Result</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="game in user.recentGames"
              :key="game.id"
              class="border-b border-zinc-800/50 last:border-0"
            >
              <td class="px-4 py-3 text-sm text-zinc-400">{{ formatDate(game.completedAt) }}</td>
              <td class="px-4 py-3 text-sm font-mono text-xs text-zinc-500">{{ game.dailyGameId }}</td>
              <td class="px-4 py-3">
                <span
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="game.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'"
                >
                  {{ game.won ? 'Won' : 'Lost' }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-zinc-300">{{ game.score }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Actions -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h3 class="font-medium text-white mb-4">Actions</h3>
        <div v-if="actionError" class="text-sm text-red-400 mb-3">{{ actionError }}</div>
        <div class="flex items-center gap-3">
          <button
            class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-md transition-colors"
            @click="toggleRole"
          >
            {{ user.role === 'admin' ? 'Remove admin role' : 'Assign admin role' }}
          </button>
          <button
            class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-md transition-colors border border-red-600/30"
            @click="handleDelete"
          >
            Soft-delete user
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
