import type { ApiResponse, DailyGame, GuessResult, GameResult, SiteConfig, Video } from '@framedle/shared'
import type { UserProfile, UserStats, MergeResult } from '@framedle/shared'
import type {
  AdminStats,
  AdminUser,
  AdminUserDetail,
  CreateGameRequest,
  DailyGameResponse,
  GuessRequest,
  InviteUserRequest,
  PaginatedGames,
  PaginatedUsers,
  VideoSearchResult,
} from './types'

interface RequestInitWithAuth extends RequestInit {
  auth?: boolean
}

export function createFramedleClient(
  baseUrl: string,
  options?: { getAccessToken?: () => Promise<string | null> },
) {
  const { getAccessToken } = options ?? {}

  async function request<T>(path: string, init?: RequestInitWithAuth): Promise<ApiResponse<T>> {
    const { auth, ...fetchInit } = init ?? {}

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchInit.headers as Record<string, string>),
    }

    if (auth && getAccessToken) {
      const token = await getAccessToken()
      if (token) headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${baseUrl}${path}`, { ...fetchInit, headers })

    if (res.status === 401 && auth && getAccessToken) {
      const token = await getAccessToken()
      if (token) headers['Authorization'] = `Bearer ${token}`
      const retry = await fetch(`${baseUrl}${path}`, { ...fetchInit, headers })
      return retry.json() as Promise<ApiResponse<T>>
    }

    return res.json() as Promise<ApiResponse<T>>
  }

  return {
    game: {
      getDaily: () =>
        request<DailyGameResponse>('/game/daily'),
      submitGuess: (body: GuessRequest) =>
        request<GuessResult>('/game/guess', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      getResult: (dailyGameId: string, fp?: string) =>
        request<GameResult>(`/game/result/${dailyGameId}${fp ? `?fp=${fp}` : ''}`, { auth: true }),
    },
    videos: {
      search: (q: string, limit = 10) =>
        request<VideoSearchResult[]>(`/videos/search?q=${encodeURIComponent(q)}&limit=${limit}`),
    },
    user: {
      getProfile: () =>
        request<UserProfile>('/user/profile', { auth: true }),
      updateProfile: (body: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>>) =>
        request<UserProfile>('/user/profile', {
          method: 'PATCH',
          body: JSON.stringify(body),
          auth: true,
        }),
      getStats: () =>
        request<UserStats>('/user/stats', { auth: true }),
      getHistory: (page = 1) =>
        request<GameResult[]>(`/user/history?page=${page}`, { auth: true }),
      claimAnonymous: (fingerprint: string) =>
        request<MergeResult>('/user/claim-anonymous', {
          method: 'POST',
          body: JSON.stringify({ fingerprint }),
          auth: true,
        }),
    },
    admin: {
      getConfig: (token?: string) =>
        request<SiteConfig[]>('/admin/config', {
          auth: true,
          ...(token && { headers: { Authorization: `Bearer ${token}` } }),
        }),
      updateTheme: (variantId: number, token: string) =>
        request<void>('/admin/theme', {
          method: 'PUT',
          body: JSON.stringify({ variantId }),
          headers: { Authorization: `Bearer ${token}` },
        }),
      getGames: (token: string, page = 1) =>
        request<PaginatedGames>(`/admin/games?page=${page}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      createGame: (body: CreateGameRequest, token: string) =>
        request<DailyGame>('/admin/games', {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { Authorization: `Bearer ${token}` },
        }),
      getStats: (token: string) =>
        request<AdminStats>('/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      getVideos: (token: string) =>
        request<Video[]>('/admin/videos', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      getUsers: (token: string, search?: string, page = 1) =>
        request<PaginatedUsers>(
          `/admin/users?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      getUserById: (id: string, token: string) =>
        request<AdminUserDetail>(`/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      updateUserRole: (id: string, role: 'user' | 'admin', token: string) =>
        request<AdminUser>(`/admin/users/${id}/role`, {
          method: 'PUT',
          body: JSON.stringify({ role }),
          headers: { Authorization: `Bearer ${token}` },
        }),
      deleteUser: (id: string, token: string) =>
        request<void>(`/admin/users/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }),
      inviteUser: (body: InviteUserRequest, token: string) =>
        request<void>('/admin/invite', {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { Authorization: `Bearer ${token}` },
        }),
    },
  }
}

export type FramedleClient = ReturnType<typeof createFramedleClient>
