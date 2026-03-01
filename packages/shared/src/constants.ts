import type { GameMode } from './types/game'

export const GAME_MODES: GameMode[] = [
  'daily_frame',
  'clip_guesser',
  'channel_check',
  'thumbnail_theater',
  'comment_detective',
  'view_finder',
  'date_decoder',
  'title_scramble',
  'category_clash',
  'subscriber_showdown',
  'duration_duel',
  'like_ratio',
]

/** Maximum number of guesses per game */
export const MAX_GUESSES = 6

/** Scoring constants */
export const SCORING = {
  /** Base score for a correct guess */
  BASE_SCORE: 1000,
  /** Points deducted per wrong guess */
  PENALTY_PER_WRONG: 150,
  /** Time bonus multiplier (applied to remaining seconds under threshold) */
  TIME_BONUS_MULTIPLIER: 2,
  /** Time threshold in ms — guesses faster than this get a bonus */
  TIME_BONUS_THRESHOLD_MS: 30_000,
} as const

/** Frame reveal sequence: which frames are shown at each guess stage (0-indexed) */
export const FRAME_REVEAL_SEQUENCE = [0, 1, 2, 3, 4, 5] as const

/** Number of frames per daily game */
export const FRAMES_PER_GAME = 6

/** Similarity threshold for pg_trgm fuzzy matching */
export const SIMILARITY_THRESHOLD = 0.4
