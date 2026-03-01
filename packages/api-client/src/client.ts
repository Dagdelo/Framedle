import type { ApiResponse, DailyGame, GuessResult, GameResult, SiteConfig, Video } from '@framedle/shared'
import type {
  AdminStats,
  CreateGameRequest,
  DailyGameResponse,
  GuessRequest,
  PaginatedGames,
  VideoSearchResult,
} from './types'

export function createFramedleClient(baseUrl: string) {
  async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    })
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
      getResult: (dailyGameId: string, fp: string) =>
        request<GameResult>(`/game/result/${dailyGameId}?fp=${fp}`),
    },
    videos: {
      search: (q: string, limit = 10) =>
        request<VideoSearchResult[]>(`/videos/search?q=${encodeURIComponent(q)}&limit=${limit}`),
    },
    admin: {
      getConfig: (token?: string) =>
        request<SiteConfig[]>('/admin/config', {
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
    },
  }
}

export type FramedleClient = ReturnType<typeof createFramedleClient>
