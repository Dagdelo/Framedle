import type { FramedleClient } from '@framedle/api-client'

const ADMIN_TOKEN_KEY = 'admin_token'

export function useAdmin() {
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => !!token.value)

  if (import.meta.client) {
    token.value = localStorage.getItem(ADMIN_TOKEN_KEY)
  }

  function login(secret: string) {
    token.value = secret
    if (import.meta.client) {
      localStorage.setItem(ADMIN_TOKEN_KEY, secret)
    }
  }

  function logout() {
    token.value = null
    if (import.meta.client) {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
    }
  }

  function getApi() {
    return useNuxtApp().$api as FramedleClient
  }

  async function getConfig() {
    return getApi().admin.getConfig(token.value ?? undefined)
  }

  async function updateTheme(variantId: number) {
    if (!token.value) throw new Error('Not authenticated')
    return getApi().admin.updateTheme(variantId, token.value)
  }

  async function getGames(page = 1) {
    if (!token.value) throw new Error('Not authenticated')
    return getApi().admin.getGames(token.value, page)
  }

  async function createGame(date: string, mode: string, videoId: string) {
    if (!token.value) throw new Error('Not authenticated')
    return getApi().admin.createGame({ date, mode, videoId }, token.value)
  }

  async function getStats() {
    if (!token.value) throw new Error('Not authenticated')
    return getApi().admin.getStats(token.value)
  }

  async function getVideos() {
    if (!token.value) throw new Error('Not authenticated')
    return getApi().admin.getVideos(token.value)
  }

  return {
    token: readonly(token),
    isAuthenticated,
    login,
    logout,
    getConfig,
    updateTheme,
    getGames,
    createGame,
    getStats,
    getVideos,
  }
}
