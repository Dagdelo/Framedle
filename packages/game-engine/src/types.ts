export type {
  GameMode,
  GameState,
  Guess,
  GuessResult,
  DailyGame,
  GameResult,
} from '@framedle/shared'

export interface DailyFrameConfig {
  dailyGameId: string
  gameNumber: number
  frames: string[] // ordered frame URLs
  maxGuesses?: number // defaults to MAX_GUESSES
}
