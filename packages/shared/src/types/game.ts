export type GameMode =
  | 'daily_frame'
  | 'clip_guesser'
  | 'channel_check'
  | 'thumbnail_theater'
  | 'comment_detective'
  | 'view_finder'
  | 'date_decoder'
  | 'title_scramble'
  | 'category_clash'
  | 'subscriber_showdown'
  | 'duration_duel'
  | 'like_ratio'

export interface Guess {
  id: string
  text: string
  correct: boolean
  timestamp: number
  similarity?: number // 0-1 from pg_trgm
}

export interface GameState {
  dailyGameId: string
  mode: GameMode
  gameNumber: number
  frames: string[] // ordered frame URLs
  currentFrameIndex: number
  guesses: Guess[]
  maxGuesses: number
  score: number
  gameOver: boolean
  won: boolean
  answer?: string // only populated when gameOver=true
  startedAt: number
}

export interface DailyGame {
  id: string
  gameNumber: number
  mode: GameMode
  videoId: string
  date: string // ISO date YYYY-MM-DD
  active: boolean
}

export interface GameResult {
  id: string
  dailyGameId: string
  playerId: string
  guesses: Guess[]
  score: number
  won: boolean
  completedAt: number
}

export interface GuessResult {
  correct: boolean
  similarity: number
  guess: Guess
  gameOver: boolean
  won: boolean
  score: number
  answer?: string // only if gameOver
  nextFrameUrl?: string // next frame revealed on wrong guess
}
