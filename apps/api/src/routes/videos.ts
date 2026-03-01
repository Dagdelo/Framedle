import { Hono } from 'hono'
import { sql } from 'drizzle-orm'
import { db, schema } from '../db'
import { apiSuccess, apiError } from '../utils/response'

export const videoRoutes = new Hono()

/**
 * GET /videos/search?q=<term>&limit=10
 * Fuzzy search by title/channel using ILIKE (pg_trgm if available).
 */
videoRoutes.get('/search', async (c) => {
  const query = c.req.query('q')
  const limit = Math.min(Number(c.req.query('limit') || '10'), 50)

  if (!query || query.length < 2) {
    return c.json(
      apiError('BAD_REQUEST', 'Search query must be at least 2 characters'),
      400,
    )
  }

  const searchPattern = `%${query}%`

  const results = await db
    .select({
      videoId: schema.videos.videoId,
      title: schema.videos.title,
      channel: schema.videos.channel,
      category: schema.videos.category,
    })
    .from(schema.videos)
    .where(
      sql`${schema.videos.title} ILIKE ${searchPattern} OR ${schema.videos.channel} ILIKE ${searchPattern}`,
    )
    .limit(limit)

  return c.json(apiSuccess(results))
})
