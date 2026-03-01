/**
 * Normalize a title for comparison: lowercase, strip punctuation, collapse whitespace.
 */
export function normalizeTitle(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if a guess exactly matches the answer (after normalization).
 */
export function isExactMatch(guess: string, answer: string): boolean {
  return normalizeTitle(guess) === normalizeTitle(answer)
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  )

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate similarity between guess and answer (0-1).
 * Client-side Levenshtein for instant feedback; server uses pg_trgm.
 */
export function calculateSimilarity(guess: string, answer: string): number {
  const a = normalizeTitle(guess)
  const b = normalizeTitle(answer)

  if (a === b) return 1
  if (a.length === 0 || b.length === 0) return 0

  const distance = levenshteinDistance(a, b)
  const maxLen = Math.max(a.length, b.length)

  return Math.round((1 - distance / maxLen) * 100) / 100
}
