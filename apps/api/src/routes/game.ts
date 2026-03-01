import { Hono } from 'hono'
import { apiSuccess, apiError } from '../utils/response'
import {
  getTodaysDailyGame,
  submitGameGuess,
  submitGameGuessForUser,
  getGameResult,
  getGameResultForUser,
} from '../services/game'
import { getOrCreateUser } from '../services/user'

export const gameRoutes = new Hono()

// Rate limit tracking: identifier -> last guess timestamp
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
 * JWT auth: resolves user by authProviderId.
 * Anonymous: falls back to anonFingerprint from body.
 */
gameRoutes.post('/guess', async (c) => {
  const body = await c.req.json<{
    dailyGameId: string
    guess: string
    anonFingerprint?: string
  }>()

  if (!body.dailyGameId || !body.guess) {
    return c.json(
      apiError('BAD_REQUEST', 'Missing required fields: dailyGameId, guess'),
      400,
    )
  }

  const authUser = c.get('user')

  // Rate limit by auth sub or fingerprint
  const rateLimitKey = authUser?.sub ?? body.anonFingerprint
  if (rateLimitKey) {
    const now = Date.now()
    const lastGuess = guessRateLimit.get(rateLimitKey)
    if (lastGuess && now - lastGuess < 1000) {
      return c.json(apiError('RATE_LIMITED', 'Please wait before guessing again'), 429)
    }
    guessRateLimit.set(rateLimitKey, now)
  }

  let response: Awaited<ReturnType<typeof submitGameGuessForUser>>

  if (authUser) {
    // Authenticated: resolve user by authProviderId
    const dbUser = await getOrCreateUser(authUser.sub)
    response = await submitGameGuessForUser(dbUser.id, body.dailyGameId, body.guess)
  } else if (body.anonFingerprint) {
    // Anonymous: use fingerprint
    response = await submitGameGuess(body.dailyGameId, body.guess, body.anonFingerprint)
  } else {
    return c.json(
      apiError('BAD_REQUEST', 'Authentication or anonFingerprint required'),
      400,
    )
  }

  if ('error' in response && response.error) {
    return c.json(apiError('GAME_ERROR', response.error), 400)
  }

  return c.json(apiSuccess(response.result))
})

/**
 * GET /game/result/:dailyGameId — Player's result for a specific game.
 * JWT auth: checks authenticated user first.
 * Anonymous: falls back to fingerprint query param (?fp=).
 */
gameRoutes.get('/result/:dailyGameId', async (c) => {
  const dailyGameId = c.req.param('dailyGameId')
  const authUser = c.get('user')

  let result

  if (authUser) {
    const dbUser = await getOrCreateUser(authUser.sub)
    result = await getGameResultForUser(dailyGameId, dbUser.id)
  } else {
    const fingerprint = c.req.query('fp')
    if (!fingerprint) {
      return c.json(
        apiError('BAD_REQUEST', 'Authentication or fingerprint query param (fp) required'),
        400,
      )
    }
    result = await getGameResult(dailyGameId, fingerprint)
  }

  if (!result) {
    return c.json(apiError('NOT_FOUND', 'No result found'), 404)
  }

  return c.json(apiSuccess(result))
})
