import type { FramedleClient, VideoSearchResult } from '@framedle/api-client'

export function useVideoSearch() {
  const query = ref('')
  const results = ref<VideoSearchResult[]>([])
  const loading = ref(false)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function search(q: string) {
    query.value = q

    if (debounceTimer) clearTimeout(debounceTimer)

    if (!q.trim()) {
      results.value = []
      loading.value = false
      return
    }

    loading.value = true

    debounceTimer = setTimeout(async () => {
      try {
        const $api = useNuxtApp().$api as FramedleClient
        const res = await $api.videos.search(q.trim())
        if (res.data) {
          results.value = res.data
        }
      } catch {
        results.value = []
      } finally {
        loading.value = false
      }
    }, 300)
  }

  function clear() {
    query.value = ''
    results.value = []
    loading.value = false
    if (debounceTimer) clearTimeout(debounceTimer)
  }

  return { query: readonly(query), results: readonly(results), loading: readonly(loading), search, clear }
}
