import type { GameState, Guess, GuessResult } from '@framedle/shared'
import { MAX_GUESSES } from '@framedle/shared'
import type { DailyFrameConfig } from '../types'
import { calculateScore } from '../scoring'
import { isExactMatch, calculateSimilarity } from '../matching'

/**
 * Create a new Daily Frame game state from config.
 */
export function createDailyFrameGame(config: DailyFrameConfig): GameState {
  return {
    dailyGameId: config.dailyGameId,
    mode: 'daily_frame',
    gameNumber: config.gameNumber,
    frames: config.frames,
    currentFrameIndex: 0,
    guesses: [],
    maxGuesses: config.maxGuesses ?? MAX_GUESSES,
    score: 0,
    gameOver: false,
    won: false,
    startedAt: Date.now(),
  }
}

/**
 * Submit a guess against the answer. Returns updated state and guess result.
 */
export function submitGuess(
  state: GameState,
  guessText: string,
  answer: string,
): { state: GameState; result: GuessResult } {
  if (state.gameOver) {
    throw new Error('Game is already over')
  }

  const correct = isExactMatch(guessText, answer)
  const similarity = correct ? 1 : calculateSimilarity(guessText, answer)

  const guess: Guess = {
    id: `guess-${state.guesses.length + 1}`,
    text: guessText,
    correct,
    timestamp: Date.now(),
    similarity,
  }

  const guesses = [...state.guesses, guess]
  const guessesUsed = guesses.length
  const reachedMaxGuesses = guessesUsed >= state.maxGuesses
  const gameOver = correct || reachedMaxGuesses
  const won = correct

  const timeMs = Date.now() - state.startedAt
  const score = won ? calculateScore(guessesUsed, state.maxGuesses, timeMs) : 0

  const nextFrameIndex = correct
    ? state.currentFrameIndex
    : Math.min(state.currentFrameIndex + 1, state.frames.length - 1)

  const nextFrameUrl =
    !correct && nextFrameIndex < state.frames.length
      ? state.frames[nextFrameIndex]
      : undefined

  const newState: GameState = {
    ...state,
    guesses,
    currentFrameIndex: nextFrameIndex,
    score,
    gameOver,
    won,
    answer: gameOver ? answer : undefined,
  }

  const result: GuessResult = {
    correct,
    similarity,
    guess,
    gameOver,
    won,
    score,
    answer: gameOver ? answer : undefined,
    nextFrameUrl,
  }

  return { state: newState, result }
}

/**
 * Check if the game is over.
 */
export function isGameOver(state: GameState): boolean {
  return state.gameOver
}

/**
 * Get the frame sequence up to and including the current revealed frame.
 */
export function getFrameSequence(state: GameState): string[] {
  return state.frames.slice(0, state.currentFrameIndex + 1)
}
