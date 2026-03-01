<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { getStats, getConfig } = useAdmin()

const stats = ref<{ totalVideos: number; totalGames: number; totalPlays: number; todayPlays: number } | null>(null)
const activeTheme = ref<string>('Loading...')
const loading = ref(true)
const error = ref<string | null>(null)

const variantNames: Record<number, string> = {
  1: 'Neon Cinema',
  2: 'Paper Cut',
  3: 'Vapor Grid',
  4: 'Brutal Mono',
  5: 'Soft Focus',
}

onMounted(async () => {
  try {
    const [statsRes, configRes] = await Promise.all([getStats(), getConfig()])

    if (statsRes.data) {
      stats.value = statsRes.data
    }

    if (configRes.data) {
      const themeCfg = configRes.data.find((c) => c.key === 'active_theme')
      if (themeCfg && themeCfg.value) {
        const vid = (themeCfg.value as { variantId?: number }).variantId
        activeTheme.value = vid ? `V${vid} — ${variantNames[vid] ?? 'Unknown'}` : 'Not set'
      }
    }
  } catch {
    error.value = 'Failed to load dashboard data'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

    <div v-if="loading" class="text-zinc-400">Loading...</div>
    <div v-else-if="error" class="text-red-400">{{ error }}</div>

    <div v-else class="space-y-6">
      <!-- Active Theme -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">Active Theme</h2>
        <p class="text-lg font-semibold text-white">{{ activeTheme }}</p>
        <NuxtLink to="/admin/theme" class="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block">
          Change theme →
        </NuxtLink>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p class="text-sm text-zinc-400">Total Videos</p>
          <p class="text-2xl font-bold text-white mt-1">{{ stats?.totalVideos ?? 0 }}</p>
        </div>
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p class="text-sm text-zinc-400">Total Games</p>
          <p class="text-2xl font-bold text-white mt-1">{{ stats?.totalGames ?? 0 }}</p>
        </div>
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p class="text-sm text-zinc-400">Total Plays</p>
          <p class="text-2xl font-bold text-white mt-1">{{ stats?.totalPlays ?? 0 }}</p>
        </div>
        <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <p class="text-sm text-zinc-400">Today's Plays</p>
          <p class="text-2xl font-bold text-white mt-1">{{ stats?.todayPlays ?? 0 }}</p>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NuxtLink
          to="/admin/games"
          class="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors block"
        >
          <h3 class="font-medium text-white">Manage Games</h3>
          <p class="text-sm text-zinc-400 mt-1">Schedule and manage daily games</p>
        </NuxtLink>
        <NuxtLink
          to="/admin/videos"
          class="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors block"
        >
          <h3 class="font-medium text-white">Video Library</h3>
          <p class="text-sm text-zinc-400 mt-1">Browse processed videos and frames</p>
        </NuxtLink>
        <NuxtLink
          to="/admin/theme"
          class="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors block"
        >
          <h3 class="font-medium text-white">Theme Settings</h3>
          <p class="text-sm text-zinc-400 mt-1">Switch the active design variant</p>
        </NuxtLink>
        <NuxtLink
          to="/admin/users"
          class="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors block"
        >
          <h3 class="font-medium text-white">User Management</h3>
          <p class="text-sm text-zinc-400 mt-1">Search, manage roles, and remove users</p>
        </NuxtLink>
        <NuxtLink
          to="/admin/invite"
          class="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors block"
        >
          <h3 class="font-medium text-white">Invite User</h3>
          <p class="text-sm text-zinc-400 mt-1">Send email invitations via Logto</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
