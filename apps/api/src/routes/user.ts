import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { apiSuccess, apiError } from '../utils/response'
import {
  getOrCreateUser,
  updateProfile,
  getUserStats,
  getUserHistory,
  claimAnonymous,
} from '../services/user'

export const userRoutes = new Hono()

// All user routes require authentication
userRoutes.use('*', requireAuth)

/**
 * GET /user/profile — Current user profile.
 */
userRoutes.get('/profile', async (c) => {
  const user = c.get('user')!
  const profile = await getOrCreateUser(user.sub)

  return c.json(apiSuccess(profile))
})

/**
 * PUT /user/profile — Update display name or avatar.
 */
userRoutes.put('/profile', async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{ displayName?: string; avatarUrl?: string }>()

  // Get user record to find DB id
  const dbUser = await getOrCreateUser(user.sub)

  const updated = await updateProfile(dbUser.id, {
    displayName: body.displayName,
    avatarUrl: body.avatarUrl,
  })

  return c.json(apiSuccess(updated))
})

/**
 * GET /user/stats — Game statistics.
 */
userRoutes.get('/stats', async (c) => {
  const user = c.get('user')!
  const dbUser = await getOrCreateUser(user.sub)
  const stats = await getUserStats(dbUser.id)

  if (!stats) {
    return c.json(apiError('NOT_FOUND', 'User not found'), 404)
  }

  return c.json(apiSuccess(stats))
})

/**
 * GET /user/history — Paginated game history.
 */
userRoutes.get('/history', async (c) => {
  const user = c.get('user')!
  const dbUser = await getOrCreateUser(user.sub)
  const page = Math.max(1, Number(c.req.query('page') || '1'))
  const limit = Math.min(Number(c.req.query('limit') || '20'), 100)

  const history = await getUserHistory(dbUser.id, page, limit)

  return c.json(apiSuccess(history))
})

/**
 * POST /user/claim-anonymous — Merge anonymous game history.
 */
userRoutes.post('/claim-anonymous', async (c) => {
  const user = c.get('user')!
  const body = await c.req.json<{ fingerprint: string }>()

  if (!body.fingerprint) {
    return c.json(apiError('BAD_REQUEST', 'Missing required field: fingerprint'), 400)
  }

  try {
    const result = await claimAnonymous(user.sub, body.fingerprint)
    return c.json(apiSuccess(result))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Merge failed'
    return c.json(apiError('MERGE_ERROR', msg), 400)
  }
})
