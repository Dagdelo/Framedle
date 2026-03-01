import { Hono } from 'hono'
import { requireAdmin } from '../middleware/auth'
import { apiSuccess, apiError } from '../utils/response'
import {
  getAllConfig,
  updateConfig,
  setActiveTheme,
  listDailyGames,
  createDailyGame,
  listVideos,
  getStats,
} from '../services/admin'

export const adminRoutes = new Hono()

// All admin routes require Bearer token auth
adminRoutes.use('*', requireAdmin)

/**
 * GET /admin/config — All site config entries.
 */
adminRoutes.get('/config', async (c) => {
  const config = await getAllConfig()
  return c.json(apiSuccess(config))
})

/**
 * PUT /admin/config — Update a site config entry.
 * Body: { key, value }
 */
adminRoutes.put('/config', async (c) => {
  const body = await c.req.json<{ key: string; value: unknown }>()

  if (!body.key) {
    return c.json(apiError('BAD_REQUEST', 'Missing required field: key'), 400)
  }

  const result = await updateConfig(body.key, body.value)
  return c.json(apiSuccess(result))
})

/**
 * PUT /admin/theme — Set active theme variant.
 * Body: { variantId: 1-5 }
 */
adminRoutes.put('/theme', async (c) => {
  const body = await c.req.json<{ variantId: number }>()

  if (!body.variantId || body.variantId < 1 || body.variantId > 5) {
    return c.json(
      apiError('BAD_REQUEST', 'variantId must be between 1 and 5'),
      400,
    )
  }

  const result = await setActiveTheme(body.variantId)
  return c.json(apiSuccess(result))
})

/**
 * GET /admin/games — List daily games (paginated).
 * Query: ?page=1&limit=20
 */
adminRoutes.get('/games', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || '1'))
  const limit = Math.min(Number(c.req.query('limit') || '20'), 100)

  const result = await listDailyGames(page, limit)
  return c.json(apiSuccess(result))
})

/**
 * POST /admin/games — Schedule a daily game.
 * Body: { date, mode, videoId }
 */
adminRoutes.post('/games', async (c) => {
  const body = await c.req.json<{
    date: string
    mode: 'daily_frame'
    videoId: string
  }>()

  if (!body.date || !body.mode || !body.videoId) {
    return c.json(
      apiError('BAD_REQUEST', 'Missing required fields: date, mode, videoId'),
      400,
    )
  }

  const game = await createDailyGame(body.date, body.mode, body.videoId)
  return c.json(apiSuccess(game))
})

/**
 * GET /admin/videos — List videos with frame counts (paginated).
 * Query: ?page=1&limit=20
 */
adminRoutes.get('/videos', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || '1'))
  const limit = Math.min(Number(c.req.query('limit') || '20'), 100)

  const result = await listVideos(page, limit)
  return c.json(apiSuccess(result))
})

/**
 * GET /admin/stats — Quick dashboard stats.
 */
adminRoutes.get('/stats', async (c) => {
  const stats = await getStats()
  return c.json(apiSuccess(stats))
})
