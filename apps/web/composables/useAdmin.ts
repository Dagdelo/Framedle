import type { FramedleClient } from '@framedle/api-client'

export function useAdmin() {
  const { isAuthenticated, isAdmin, getAccessToken } = useAuth()

  function getApi() {
    return useNuxtApp().$api as FramedleClient
  }

  async function getConfig() {
    const token = await getAccessToken()
    return getApi().admin.getConfig(token ?? undefined)
  }

  async function updateTheme(variantId: number) {
    const token = await getAccessToken()
    if (!token) throw new Error('Not authenticated')
    return getApi().admin.updateTheme(variantId, token)
  }

  async function getGames(page = 1) {
    const token = await getAccessToken()
    if (!token) throw new Error('Not authenticated')
    return getApi().admin.getGames(token, page)
  }

  async function createGame(date: string, mode: string, videoId: string) {
    const token = await getAccessToken()
    if (!token) throw new Error('Not authenticated')
    return getApi().admin.createGame({ date, mode, videoId }, token)
  }

  async function getStats() {
    const token = await getAccessToken()
    if (!token) throw new Error('Not authenticated')
    return getApi().admin.getStats(token)
  }

  async function getVideos() {
    const token = await getAccessToken()
    if (!token) throw new Error('Not authenticated')
    return getApi().admin.getVideos(token)
  }

  async function getUsers(search?: string, page = 1) {
    const token = await getAccessToken()
    if (!token) throw new Error('Not authenticated')
    return getApi().admin.getUsers(token, search, page)
  }

  async function getUserById(id: string) {
    const token = await getAccessToken()
    if (!token) throw new Error('Not authenticated')
    return getApi().admin.getUserById(id, token)
  }

  async function updateUserRole(id: string, role: 'user' | 'admin') {
    const token = await getAccessToken()
    if (!token) throw new Error('Not authenticated')
    return getApi().admin.updateUserRole(id, role, token)
  }

  async function deleteUser(id: string) {
    const token = await getAccessToken()
    if (!token) throw new Error('Not authenticated')
    return getApi().admin.deleteUser(id, token)
  }

  async function inviteUser(email: string, name?: string, role?: 'user' | 'admin') {
    const token = await getAccessToken()
    if (!token) throw new Error('Not authenticated')
    return getApi().admin.inviteUser({ email, name, role }, token)
  }

  return {
    isAuthenticated,
    isAdmin,
    getConfig,
    updateTheme,
    getGames,
    createGame,
    getStats,
    getVideos,
    getUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    inviteUser,
  }
}
