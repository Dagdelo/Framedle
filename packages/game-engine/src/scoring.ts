import { SCORING } from '@framedle/shared'

/**
 * Calculate the player's score based on guesses used and time taken.
 * Base 1000, -150 per wrong guess, time bonus for fast solves.
 */
export function calculateScore(
  guessesUsed: number,
  _maxGuesses: number,
  timeMs: number,
): number {
  const wrongGuesses = Math.max(0, guessesUsed - 1) // last guess was correct
  const base = SCORING.BASE_SCORE - wrongGuesses * SCORING.PENALTY_PER_WRONG

  let timeBonus = 0
  if (timeMs < SCORING.TIME_BONUS_THRESHOLD_MS) {
    const remainingSeconds = Math.floor(
      (SCORING.TIME_BONUS_THRESHOLD_MS - timeMs) / 1000,
    )
    timeBonus = remainingSeconds * SCORING.TIME_BONUS_MULTIPLIER
  }

  return Math.max(0, base + timeBonus)
}
