<script setup lang="ts">
import type { DailyGame } from '@framedle/api-client'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { getGames, createGame } = useAdmin()
const { search, results, loading: searchLoading, clear } = useVideoSearch()

const games = ref<DailyGame[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const page = ref(1)
const total = ref(0)

// Schedule form
const showForm = ref(false)
const formDate = ref('')
const formMode = ref('daily_frame')
const formVideoId = ref('')
const formVideoTitle = ref('')
const formSaving = ref(false)
const formError = ref('')
const searchQuery = ref('')

const gameModes = [
  { value: 'daily_frame', label: 'Daily Frame' },
]

onMounted(() => loadGames())

async function loadGames() {
  loading.value = true
  error.value = null
  try {
    const res = await getGames(page.value)
    if (res.data) {
      games.value = res.data.games
      total.value = res.data.total
    } else if (res.error) {
      error.value = res.error.message
    }
  } catch {
    error.value = 'Failed to load games'
  } finally {
    loading.value = false
  }
}

function handleSearch(q: string) {
  searchQuery.value = q
  search(q)
}

function selectVideo(id: string, title: string) {
  formVideoId.value = id
  formVideoTitle.value = title
  searchQuery.value = title
  clear()
}

async function handleCreate() {
  if (!formDate.value || !formVideoId.value) {
    formError.value = 'Please select a date and video'
    return
  }

  formSaving.value = true
  formError.value = ''

  try {
    const res = await createGame(formDate.value, formMode.value, formVideoId.value)
    if (res.error) {
      formError.value = res.error.message
    } else {
      showForm.value = false
      formDate.value = ''
      formVideoId.value = ''
      formVideoTitle.value = ''
      searchQuery.value = ''
      await loadGames()
    }
  } catch {
    formError.value = 'Failed to create game'
  } finally {
    formSaving.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Game Management</h1>
      <button
        class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
        @click="showForm = !showForm"
      >
        {{ showForm ? 'Cancel' : 'Schedule Game' }}
      </button>
    </div>

    <!-- Schedule Form -->
    <div v-if="showForm" class="bg-zinc-900 border border-zinc-800 rounded-lg p-5 mb-6">
      <h2 class="font-semibold text-white mb-4">Schedule New Game</h2>
      <form class="space-y-4" @submit.prevent="handleCreate">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Date</label>
            <input
              v-model="formDate"
              type="date"
              class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-300 mb-1.5">Mode</label>
            <select
              v-model="formMode"
              class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option v-for="m in gameModes" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
        </div>

        <div class="relative">
          <label class="block text-sm font-medium text-zinc-300 mb-1.5">Video</label>
          <input
            :value="searchQuery"
            type="text"
            placeholder="Search videos..."
            class="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            @input="handleSearch(($event.target as HTMLInputElement).value)"
          />
          <p v-if="formVideoId" class="text-xs text-zinc-400 mt-1">
            Selected: {{ formVideoTitle }}
          </p>

          <!-- Search results dropdown -->
          <div
            v-if="results.length > 0"
            class="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-48 overflow-auto"
          >
            <button
              v-for="v in results"
              :key="v.id"
              type="button"
              class="w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 transition-colors"
              @click="selectVideo(v.id, v.title)"
            >
              <span class="text-white">{{ v.title }}</span>
              <span class="text-zinc-400 text-xs ml-2">{{ v.channelName }}</span>
            </button>
          </div>
          <div v-if="searchLoading" class="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md p-2 text-xs text-zinc-400">
            Searching...
          </div>
        </div>

        <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>

        <button
          type="submit"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-400 text-white text-sm font-medium rounded-md transition-colors"
          :disabled="formSaving"
        >
          {{ formSaving ? 'Creating...' : 'Create Game' }}
        </button>
      </form>
    </div>

    <!-- Games Table -->
    <div v-if="loading" class="text-zinc-400">Loading...</div>
    <div v-else-if="error" class="text-red-400">{{ error }}</div>
    <div v-else-if="games.length === 0" class="text-zinc-400">No games scheduled yet.</div>

    <div v-else class="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-zinc-800">
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">#</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Date</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Mode</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Video</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="game in games"
            :key="game.id"
            class="border-b border-zinc-800/50 last:border-0"
          >
            <td class="px-4 py-3 text-sm text-zinc-300">{{ game.gameNumber }}</td>
            <td class="px-4 py-3 text-sm text-zinc-300">{{ game.date }}</td>
            <td class="px-4 py-3 text-sm text-zinc-300">{{ game.mode.replace('_', ' ') }}</td>
            <td class="px-4 py-3 text-sm text-zinc-400 font-mono text-xs">{{ game.videoId }}</td>
            <td class="px-4 py-3">
              <span
                class="text-xs px-2 py-0.5 rounded-full font-medium"
                :class="game.active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'"
              >
                {{ game.active ? 'Active' : 'Scheduled' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
