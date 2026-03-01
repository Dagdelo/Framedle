import { normalizeTitle, calculateSimilarity } from '@framedle/game-engine'
import { SIMILARITY_THRESHOLD } from '@framedle/shared'

export interface GuessValidation {
  correct: boolean
  similarity: number
}

/**
 * Server-side guess validation against video title and channel name.
 * Uses client-side Levenshtein for now; pg_trgm used in search queries.
 */
export function validateGuess(
  guess: string,
  videoTitle: string,
  channelName: string,
): GuessValidation {
  const normalizedGuess = normalizeTitle(guess)
  const normalizedTitle = normalizeTitle(videoTitle)

  // Exact match on title
  if (normalizedGuess === normalizedTitle) {
    return { correct: true, similarity: 1 }
  }

  // Check similarity against title
  const titleSimilarity = calculateSimilarity(guess, videoTitle)
  if (titleSimilarity >= SIMILARITY_THRESHOLD) {
    // High similarity to title counts as correct if above threshold
    if (titleSimilarity >= 0.85) {
      return { correct: true, similarity: titleSimilarity }
    }
    return { correct: false, similarity: titleSimilarity }
  }

  // Check similarity against channel name as secondary signal
  const channelSimilarity = calculateSimilarity(guess, channelName)

  return {
    correct: false,
    similarity: Math.max(titleSimilarity, channelSimilarity * 0.5),
  }
}
