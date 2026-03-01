<script setup lang="ts">
import type { Video } from '@framedle/api-client'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const { getVideos } = useAdmin()

const videos = ref<Video[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const res = await getVideos()
    if (res.data) {
      videos.value = res.data
    } else if (res.error) {
      error.value = res.error.message
    }
  } catch {
    error.value = 'Failed to load videos'
  } finally {
    loading.value = false
  }
})

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Video Library</h1>

    <div v-if="loading" class="text-zinc-400">Loading...</div>
    <div v-else-if="error" class="text-red-400">{{ error }}</div>
    <div v-else-if="videos.length === 0" class="text-zinc-400">No videos processed yet.</div>

    <div v-else class="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-zinc-800">
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Title</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Channel</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Category</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Duration</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Published</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Link</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="video in videos"
            :key="video.id"
            class="border-b border-zinc-800/50 last:border-0"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <img
                  v-if="video.thumbnailUrl"
                  :src="video.thumbnailUrl"
                  :alt="video.title"
                  class="w-16 h-9 object-cover rounded bg-zinc-800"
                />
                <div class="w-12 h-9 bg-zinc-800 rounded flex items-center justify-center text-zinc-600 text-xs" v-else>
                  N/A
                </div>
                <span class="text-sm text-white truncate max-w-[200px]">{{ video.title }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-zinc-300">{{ video.channelName }}</td>
            <td class="px-4 py-3 text-sm text-zinc-400">{{ video.categoryId }}</td>
            <td class="px-4 py-3 text-sm text-zinc-400 font-mono">{{ formatDuration(video.duration) }}</td>
            <td class="px-4 py-3 text-sm text-zinc-400">{{ formatDate(video.publishedAt) }}</td>
            <td class="px-4 py-3">
              <a
                :href="`https://youtube.com/watch?v=${video.youtubeId}`"
                target="_blank"
                rel="noopener"
                class="text-sm text-blue-400 hover:text-blue-300"
              >
                YouTube →
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
