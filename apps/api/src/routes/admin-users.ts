import { Hono } from 'hono'
import { eq, count, ilike, or, gte, sql } from 'drizzle-orm'
import { requireAdmin } from '../middleware/auth'
import { apiSuccess, apiError } from '../utils/response'
import { db, schema } from '../db'
import {
  assignRole,
  removeRole,
  createUser as logtoCreateUser,
} from '../services/logto-management'

export const adminUserRoutes = new Hono()

// All admin user routes require admin auth
adminUserRoutes.use('*', requireAdmin)

/**
 * GET /admin/users — List users (paginated, searchable).
 */
adminUserRoutes.get('/', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || '1'))
  const limit = Math.min(Number(c.req.query('limit') || '20'), 100)
  const search = c.req.query('search')
  const offset = (page - 1) * limit

  const conditions = search
    ? or(
        ilike(schema.users.displayName, `%${search}%`),
        ilike(schema.users.email, `%${search}%`),
      )
    : undefined

  const [users, totalResult] = await Promise.all([
    db
      .select({
        id: schema.users.id,
        authProviderId: schema.users.authProviderId,
        displayName: schema.users.displayName,
        email: schema.users.email,
        avatarUrl: schema.users.avatarUrl,
        xp: schema.users.xp,
        level: schema.users.level,
        createdAt: schema.users.createdAt,
        deletedAt: schema.users.deletedAt,
      })
      .from(schema.users)
      .where(conditions)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(schema.users)
      .where(conditions),
  ])

  return c.json(
    apiSuccess({
      users,
      total: totalResult[0].count,
      page,
      limit,
    }),
  )
})

/**
 * GET /admin/users/stats — User statistics.
 */
adminUserRoutes.get('/stats', async (c) => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [totalResult, activeResult, newResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(schema.users)
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(schema.users)
      .where(sql`${schema.users.lastPlayDate} >= CURRENT_DATE - INTERVAL '7 days'`)
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(schema.users)
      .where(gte(schema.users.createdAt, oneWeekAgo))
      .then((r) => r[0].count),
  ])

  return c.json(
    apiSuccess({
      totalUsers: totalResult,
      activeThisWeek: activeResult,
      newThisWeek: newResult,
    }),
  )
})

/**
 * GET /admin/users/:id — Get user details.
 */
adminUserRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1)
    .then((rows) => rows[0])

  if (!user) {
    return c.json(apiError('NOT_FOUND', 'User not found'), 404)
  }

  // Get game stats
  const [gamesPlayed, gamesWon] = await Promise.all([
    db
      .select({ count: count() })
      .from(schema.gameResults)
      .where(eq(schema.gameResults.userId, id))
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(schema.gameResults)
      .where(
        eq(schema.gameResults.userId, id),
      )
      .then((r) => r[0].count),
  ])

  return c.json(
    apiSuccess({
      ...user,
      gamesPlayed,
      gamesWon,
    }),
  )
})

/**
 * PUT /admin/users/:id/role — Update user role via Logto Management API.
 */
adminUserRoutes.put('/:id/role', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ roleId: string; action: 'assign' | 'remove' }>()

  if (!body.roleId || !body.action) {
    return c.json(apiError('BAD_REQUEST', 'Missing required fields: roleId, action'), 400)
  }

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1)
    .then((rows) => rows[0])

  if (!user?.authProviderId) {
    return c.json(apiError('NOT_FOUND', 'User not found or has no auth provider'), 404)
  }

  try {
    if (body.action === 'assign') {
      await assignRole(user.authProviderId, body.roleId)
    } else {
      await removeRole(user.authProviderId, body.roleId)
    }
    return c.json(apiSuccess({ updated: true }))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Role update failed'
    return c.json(apiError('LOGTO_ERROR', msg), 500)
  }
})

/**
 * DELETE /admin/users/:id — Soft-delete user.
 */
adminUserRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id')

  const user = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1)
    .then((rows) => rows[0])

  if (!user) {
    return c.json(apiError('NOT_FOUND', 'User not found'), 404)
  }

  await db
    .update(schema.users)
    .set({
      displayName: 'Deleted User',
      avatarUrl: null,
      email: null,
      authProviderId: null,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, id))

  return c.json(apiSuccess({ deleted: true }))
})

/**
 * POST /admin/users/invite — Send email invite via Logto.
 */
adminUserRoutes.post('/invite', async (c) => {
  const body = await c.req.json<{ email: string; name?: string }>()

  if (!body.email) {
    return c.json(apiError('BAD_REQUEST', 'Missing required field: email'), 400)
  }

  try {
    const logtoUser = await logtoCreateUser(body.email, body.name)
    return c.json(apiSuccess(logtoUser))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Invite failed'
    return c.json(apiError('LOGTO_ERROR', msg), 500)
  }
})
