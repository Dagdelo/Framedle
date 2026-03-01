export type {
  ApiResponse,
  DailyGame,
  Frame,
  GameMode,
  GameResult,
  GameState,
  Guess,
  GuessResult,
  MergeResult,
  SiteConfig,
  ThemeConfig,
  UserProfile,
  UserStats,
  Video,
} from '@framedle/shared'

/** Response for GET /game/daily */
export interface DailyGameResponse {
  id: string
  gameNumber: number
  mode: string
  date: string
  frames: string[] // ordered frame URLs
  maxGuesses: number
}

/** Request body for POST /game/guess */
export interface GuessRequest {
  dailyGameId: string
  guess: string
  fingerprint?: string
}

/** Video search result from GET /videos/search */
export interface VideoSearchResult {
  id: string
  youtubeId: string
  title: string
  channelName: string
  thumbnailUrl: string
}

/** Paginated games list from GET /admin/games */
export interface PaginatedGames {
  games: import('@framedle/shared').DailyGame[]
  total: number
  page: number
  pageSize: number
}

/** Request body for POST /admin/games */
export interface CreateGameRequest {
  date: string
  mode: string
  videoId: string
}

/** Admin stats from GET /admin/stats */
export interface AdminStats {
  totalVideos: number
  totalGames: number
  totalPlays: number
  todayPlays: number
}
