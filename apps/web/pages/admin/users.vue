<script setup lang="ts">
import type { AdminUser } from '@framedle/api-client'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { getUsers, updateUserRole, deleteUser } = useAdmin()

const users = ref<AdminUser[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const page = ref(1)
const total = ref(0)
const searchQuery = ref('')
const searchDebounce = ref<ReturnType<typeof setTimeout> | null>(null)

onMounted(() => loadUsers())

async function loadUsers() {
  loading.value = true
  error.value = null
  try {
    const res = await getUsers(searchQuery.value || undefined, page.value)
    if (res.data) {
      users.value = res.data.users
      total.value = res.data.total
    } else if (res.error) {
      error.value = res.error.message
    }
  } catch {
    error.value = 'Failed to load users'
  } finally {
    loading.value = false
  }
}

function handleSearch(q: string) {
  searchQuery.value = q
  if (searchDebounce.value) clearTimeout(searchDebounce.value)
  searchDebounce.value = setTimeout(() => {
    page.value = 1
    loadUsers()
  }, 300)
}

async function toggleRole(user: AdminUser) {
  const newRole = user.role === 'admin' ? 'user' : 'admin'
  try {
    const res = await updateUserRole(user.id, newRole)
    if (res.data) {
      const idx = users.value.findIndex((u) => u.id === user.id)
      if (idx !== -1) users.value[idx] = res.data
    }
  } catch {
    error.value = 'Failed to update role'
  }
}

async function handleDelete(user: AdminUser) {
  if (!confirm(`Soft-delete user "${user.displayName}"? This cannot be undone easily.`)) return
  try {
    await deleteUser(user.id)
    users.value = users.value.filter((u) => u.id !== user.id)
    total.value -= 1
  } catch {
    error.value = 'Failed to delete user'
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

const totalPages = computed(() => Math.ceil(total.value / 20))
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">User Management</h1>
      <NuxtLink
        to="/admin/invite"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
      >
        Invite User
      </NuxtLink>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <input
        :value="searchQuery"
        type="text"
        placeholder="Search by name or email..."
        class="w-full md:w-80 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        @input="handleSearch(($event.target as HTMLInputElement).value)"
      />
    </div>

    <div v-if="error" class="text-red-400 mb-4 text-sm">{{ error }}</div>

    <div v-if="loading" class="text-zinc-400">Loading...</div>
    <div v-else-if="users.length === 0" class="text-zinc-400">No users found.</div>

    <div v-else class="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-zinc-800">
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">User</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Role</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Games</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">XP</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Joined</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
            class="border-b border-zinc-800/50 last:border-0"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <img
                  v-if="user.avatarUrl"
                  :src="user.avatarUrl"
                  :alt="user.displayName"
                  class="w-8 h-8 rounded-full object-cover bg-zinc-800"
                />
                <div v-else class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-medium">
                  {{ user.displayName.charAt(0).toUpperCase() }}
                </div>
                <NuxtLink
                  :to="`/admin/users/${user.id}`"
                  class="text-sm text-white hover:text-blue-400 transition-colors"
                >
                  {{ user.displayName }}
                </NuxtLink>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-zinc-400">{{ user.email }}</td>
            <td class="px-4 py-3">
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'"
              >
                {{ user.role }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-zinc-300">{{ user.gamesPlayed }}</td>
            <td class="px-4 py-3 text-sm text-zinc-300">{{ user.xp.toLocaleString() }}</td>
            <td class="px-4 py-3 text-sm text-zinc-400">{{ formatDate(user.joinedAt) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <NuxtLink
                  :to="`/admin/users/${user.id}`"
                  class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View
                </NuxtLink>
                <button
                  class="text-xs text-zinc-400 hover:text-white transition-colors"
                  @click="toggleRole(user)"
                >
                  {{ user.role === 'admin' ? 'Remove admin' : 'Make admin' }}
                </button>
                <button
                  class="text-xs text-red-400 hover:text-red-300 transition-colors"
                  @click="handleDelete(user)"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between mt-4">
      <p class="text-sm text-zinc-400">{{ total }} users total</p>
      <div class="flex items-center gap-2">
        <button
          class="px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          :disabled="page <= 1"
          @click="page--; loadUsers()"
        >
          Previous
        </button>
        <span class="text-sm text-zinc-400">{{ page }} / {{ totalPages }}</span>
        <button
          class="px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-md text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          :disabled="page >= totalPages"
          @click="page++; loadUsers()"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
