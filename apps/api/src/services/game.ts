import { eq, and } from 'drizzle-orm'
import { db, schema } from '../db'
import { getPresignedFrameUrls } from '../utils/r2'
import { validateGuess } from '../utils/game-logic'
import { calculateScore } from '@framedle/game-engine'
import type { Guess, GuessResult } from '@framedle/shared'
import { MAX_GUESSES, SCORING } from '@framedle/shared'

/**
 * Get today's daily game with presigned frame URLs.
 */
export async function getTodaysDailyGame() {
  const today = new Date().toISOString().split('T')[0]

  const game = await db
    .select()
    .from(schema.dailyGames)
    .where(
      and(
        eq(schema.dailyGames.gameDate, today),
        eq(schema.dailyGames.mode, 'daily_frame'),
      ),
    )
    .limit(1)
    .then((rows) => rows[0])

  if (!game) return null

  // Get frames for this video
  const gameFrames = await db
    .select()
    .from(schema.frames)
    .where(eq(schema.frames.videoId, game.videoId!))
    .orderBy(schema.frames.rank)
    .limit(6)

  // Generate presigned URLs
  const r2Keys = gameFrames.map((f) => f.r2Path)
  const frameUrls = await getPresignedFrameUrls(r2Keys)

  return {
    id: game.id,
    gameNumber: game.gameNumber,
    mode: game.mode,
    date: game.gameDate,
    maxGuesses: MAX_GUESSES,
    frames: frameUrls, // client only sees first frame initially
  }
}

/**
 * Submit a guess for a daily game.
 */
export async function submitGameGuess(
  dailyGameId: string,
  guessText: string,
  fingerprint: string,
) {
  // Get the daily game
  const game = await db
    .select()
    .from(schema.dailyGames)
    .where(eq(schema.dailyGames.id, dailyGameId))
    .limit(1)
    .then((rows) => rows[0])

  if (!game) return { error: 'Game not found' }

  // Get video details for validation
  const video = await db
    .select()
    .from(schema.videos)
    .where(eq(schema.videos.videoId, game.videoId!))
    .limit(1)
    .then((rows) => rows[0])

  if (!video) return { error: 'Video not found' }

  // Get or create user by fingerprint
  let user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.anonFingerprint, fingerprint))
    .limit(1)
    .then((rows) => rows[0])

  if (!user) {
    const inserted = await db
      .insert(schema.users)
      .values({ anonFingerprint: fingerprint })
      .returning()
    user = inserted[0]
  }

  // Check existing result for this game
  let existingResult = await db
    .select()
    .from(schema.gameResults)
    .where(
      and(
        eq(schema.gameResults.userId, user.id),
        eq(schema.gameResults.dailyGameId, dailyGameId),
      ),
    )
    .limit(1)
    .then((rows) => rows[0])

  const previousGuesses: Guess[] = existingResult
    ? ((existingResult.guessesData as Guess[]) ?? [])
    : []

  if (existingResult?.completed) {
    return { error: 'Game already completed' }
  }

  // Validate the guess
  const validation = validateGuess(guessText, video.title, video.channel)

  const guess: Guess = {
    id: `guess-${previousGuesses.length + 1}`,
    text: guessText,
    correct: validation.correct,
    timestamp: Date.now(),
    similarity: validation.similarity,
  }

  const allGuesses = [...previousGuesses, guess]
  const guessesUsed = allGuesses.length
  const reachedMax = guessesUsed >= MAX_GUESSES
  const gameOver = validation.correct || reachedMax
  const won = validation.correct

  const timeMs = existingResult
    ? Date.now() - new Date(existingResult.createdAt!).getTime()
    : 0
  const score = won ? calculateScore(guessesUsed, MAX_GUESSES, timeMs) : 0

  // Get next frame URL if wrong guess
  let nextFrameUrl: string | undefined
  if (!validation.correct && guessesUsed < MAX_GUESSES) {
    const gameFrames = await db
      .select()
      .from(schema.frames)
      .where(eq(schema.frames.videoId, game.videoId!))
      .orderBy(schema.frames.rank)
      .limit(6)

    if (guessesUsed < gameFrames.length) {
      const urls = await getPresignedFrameUrls([gameFrames[guessesUsed].r2Path])
      nextFrameUrl = urls[0]
    }
  }

  // Upsert game result
  if (existingResult) {
    await db
      .update(schema.gameResults)
      .set({
        guessesData: allGuesses,
        guessesUsed,
        score,
        completed: gameOver,
        won: gameOver ? won : null,
        completedAt: gameOver ? new Date() : undefined,
      })
      .where(eq(schema.gameResults.id, existingResult.id))
  } else {
    await db.insert(schema.gameResults).values({
      userId: user.id,
      dailyGameId,
      guessesData: allGuesses,
      guessesUsed,
      score,
      maxScore: SCORING.BASE_SCORE,
      completed: gameOver,
      won: gameOver ? won : null,
    })
  }

  const result: GuessResult = {
    correct: validation.correct,
    similarity: validation.similarity,
    guess,
    gameOver,
    won,
    score,
    answer: gameOver ? video.title : undefined,
    nextFrameUrl,
  }

  return { result }
}

/**
 * Get a player's result for a specific game.
 */
export async function getGameResult(dailyGameId: string, fingerprint: string) {
  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.anonFingerprint, fingerprint))
    .limit(1)
    .then((rows) => rows[0])

  if (!user) return null

  const result = await db
    .select()
    .from(schema.gameResults)
    .where(
      and(
        eq(schema.gameResults.userId, user.id),
        eq(schema.gameResults.dailyGameId, dailyGameId),
      ),
    )
    .limit(1)
    .then((rows) => rows[0])

  if (!result) return null

  // Get video title if game is completed
  let answer: string | undefined
  if (result.completed) {
    const game = await db
      .select()
      .from(schema.dailyGames)
      .where(eq(schema.dailyGames.id, dailyGameId))
      .limit(1)
      .then((rows) => rows[0])

    if (game?.videoId) {
      const video = await db
        .select()
        .from(schema.videos)
        .where(eq(schema.videos.videoId, game.videoId))
        .limit(1)
        .then((rows) => rows[0])
      answer = video?.title
    }
  }

  return {
    id: result.id,
    dailyGameId: result.dailyGameId,
    guesses: result.guessesData as Guess[],
    score: result.score,
    won: result.won,
    completed: result.completed,
    answer,
  }
}
