import { Hono } from 'hono'
import { apiSuccess, apiError } from '../utils/response'
import {
  getTodaysDailyGame,
  submitGameGuess,
  getGameResult,
} from '../services/game'

export const gameRoutes = new Hono()

// Rate limit tracking: fingerprint -> last guess timestamp
const guessRateLimit = new Map<string, number>()

/**
 * GET /game/daily — Today's daily game with presigned frame URLs (no answer).
 */
gameRoutes.get('/daily', async (c) => {
  const game = await getTodaysDailyGame()

  if (!game) {
    return c.json(apiError('NOT_FOUND', 'No daily game scheduled for today'), 404)
  }

  return c.json(apiSuccess(game))
})

/**
 * POST /game/guess — Submit a guess.
 * Body: { dailyGameId, guess, anonFingerprint }
 */
gameRoutes.post('/guess', async (c) => {
  const body = await c.req.json<{
    dailyGameId: string
    guess: string
    anonFingerprint: string
  }>()

  if (!body.dailyGameId || !body.guess || !body.anonFingerprint) {
    return c.json(
      apiError('BAD_REQUEST', 'Missing required fields: dailyGameId, guess, anonFingerprint'),
      400,
    )
  }

  // Rate limit: 1 guess per second per fingerprint
  const now = Date.now()
  const lastGuess = guessRateLimit.get(body.anonFingerprint)
  if (lastGuess && now - lastGuess < 1000) {
    return c.json(apiError('RATE_LIMITED', 'Please wait before guessing again'), 429)
  }
  guessRateLimit.set(body.anonFingerprint, now)

  const response = await submitGameGuess(
    body.dailyGameId,
    body.guess,
    body.anonFingerprint,
  )

  if ('error' in response && response.error) {
    return c.json(apiError('GAME_ERROR', response.error), 400)
  }

  return c.json(apiSuccess(response.result))
})

/**
 * GET /game/result/:dailyGameId — Player's result for a specific game.
 * Query: ?fp=<fingerprint>
 */
gameRoutes.get('/result/:dailyGameId', async (c) => {
  const dailyGameId = c.req.param('dailyGameId')
  const fingerprint = c.req.query('fp')

  if (!fingerprint) {
    return c.json(apiError('BAD_REQUEST', 'Missing fingerprint query param (fp)'), 400)
  }

  const result = await getGameResult(dailyGameId, fingerprint)

  if (!result) {
    return c.json(apiError('NOT_FOUND', 'No result found'), 404)
  }

  return c.json(apiSuccess(result))
})
