// DEPRECATED: Use requireAdmin from ./auth.ts instead.
// Kept for reference only. Will be removed in a future PR.
import type { MiddlewareHandler } from 'hono'
import { apiError } from '../utils/response'

/**
 * Admin auth middleware: checks Authorization Bearer token against ADMIN_SECRET env var.
 */
export const adminAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(apiError('UNAUTHORIZED', 'Missing or invalid authorization header'), 401)
  }

  const token = authHeader.slice(7)
  const adminSecret = process.env.ADMIN_SECRET

  if (!adminSecret) {
    return c.json(apiError('SERVER_ERROR', 'Admin secret not configured'), 500)
  }

  if (token !== adminSecret) {
    return c.json(apiError('UNAUTHORIZED', 'Invalid admin token'), 401)
  }

  await next()
}
