<script setup lang="ts">
const route = useRoute()
const { signOut } = useAuth()

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: '◉' },
  { label: 'Theme', path: '/admin/theme', icon: '◎' },
  { label: 'Games', path: '/admin/games', icon: '▦' },
  { label: 'Videos', path: '/admin/videos', icon: '▶' },
]

function isActive(path: string) {
  if (path === '/admin') return route.path === '/admin'
  return route.path.startsWith(path)
}

function handleLogout() {
  signOut()
}
</script>

<template>
  <div class="flex min-h-screen bg-zinc-950 text-zinc-100">
    <!-- Sidebar -->
    <aside class="w-56 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col">
      <div class="p-4 border-b border-zinc-800">
        <h1 class="text-lg font-bold tracking-tight">Framedle Admin</h1>
      </div>
      <nav class="flex-1 p-3 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
          :class="isActive(item.path)
            ? 'bg-zinc-800 text-white font-medium'
            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'"
        >
          <span class="text-base">{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="p-3 border-t border-zinc-800 space-y-1">
        <NuxtLink
          to="/"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors"
        >
          <span class="text-base">←</span>
          Back to Site
        </NuxtLink>
        <button
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-500 hover:bg-zinc-800/50 hover:text-red-400 transition-colors w-full text-left"
          @click="handleLogout"
        >
          <span class="text-base">⏻</span>
          Logout
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 p-8 overflow-auto">
      <slot />
    </main>
  </div>
</template>
