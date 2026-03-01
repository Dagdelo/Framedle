<script setup lang="ts">
const { user, isAuthenticated, loading, signIn, signOut } = useAuth()

const menuOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}

const initial = computed(() =>
  user.value?.displayName?.charAt(0).toUpperCase() ?? user.value?.email?.charAt(0).toUpperCase() ?? '?',
)
</script>

<template>
  <div class="relative">
    <template v-if="loading">
      <div class="h-9 w-20 animate-pulse rounded bg-variant-surface opacity-50" />
    </template>

    <template v-else-if="isAuthenticated">
      <button
        class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-variant-surface focus:outline-none"
        @click="toggleMenu"
      >
        <img
          v-if="user?.avatarUrl"
          :src="user.avatarUrl"
          :alt="user.displayName ?? 'Avatar'"
          class="h-7 w-7 rounded-full object-cover"
        />
        <span
          v-else
          class="flex h-7 w-7 items-center justify-center rounded-full bg-variant-accent text-xs font-bold text-variant-accent-fg"
        >
          {{ initial }}
        </span>
        <span class="hidden sm:inline">{{ user?.displayName ?? 'Profile' }}</span>
      </button>

      <div
        v-if="menuOpen"
        class="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-variant-border bg-variant-surface py-1 shadow-lg"
        @click="closeMenu"
      >
        <NuxtLink
          to="/profile"
          class="block px-4 py-2 text-sm hover:bg-variant-hover"
        >
          Profile
        </NuxtLink>
        <button
          class="block w-full px-4 py-2 text-left text-sm hover:bg-variant-hover"
          @click="signOut"
        >
          Sign Out
        </button>
      </div>

      <div
        v-if="menuOpen"
        class="fixed inset-0 z-40"
        @click="closeMenu"
      />
    </template>

    <template v-else>
      <button
        class="rounded-lg bg-variant-accent px-4 py-1.5 text-sm font-semibold text-variant-accent-fg transition-opacity hover:opacity-90 focus:outline-none"
        @click="() => signIn()"
      >
        Sign In
      </button>
    </template>
  </div>
</template>
