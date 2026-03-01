import type { MiddlewareHandler } from 'hono'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { AuthUser } from '../types/hono'
import { apiError } from '../utils/response'

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJwks() {
  if (!jwks) {
    const endpoint = process.env.LOGTO_ENDPOINT
    if (!endpoint) throw new Error('LOGTO_ENDPOINT environment variable is required')
    jwks = createRemoteJWKSet(new URL(`${endpoint}/oidc/jwks`))
  }
  return jwks
}

async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const endpoint = process.env.LOGTO_ENDPOINT
    const audience = process.env.LOGTO_API_RESOURCE

    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: `${endpoint}/oidc`,
      audience,
    })

    return {
      sub: payload.sub!,
      roles: (payload.roles as string[]) ?? [],
    }
  } catch {
    return null
  }
}

/**
 * Optional auth: extracts JWT if present, sets user to null otherwise.
 * No JWKS call when no Authorization header. No 401 on expired/malformed tokens.
 */
export const optionalAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    c.set('user', null)
    return next()
  }

  const token = authHeader.slice(7)
  const user = await verifyToken(token)
  c.set('user', user)
  return next()
}

/**
 * Require auth: rejects unauthenticated requests with 401.
 */
export const requireAuth: MiddlewareHandler = async (c, next) => {
  const user = c.get('user')

  if (!user) {
    return c.json(apiError('UNAUTHORIZED', 'Authentication required'), 401)
  }

  return next()
}

/**
 * Require admin: checks ADMIN_SECRET first (backward compat), then JWT admin role.
 */
export const requireAdmin: MiddlewareHandler = async (c, next) => {
  // Check ADMIN_SECRET fallback first
  const authHeader = c.req.header('Authorization')
  const adminSecret = process.env.ADMIN_SECRET

  if (adminSecret && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    if (token === adminSecret) {
      return next()
    }
  }

  // Check JWT user with admin role
  const user = c.get('user')

  if (!user) {
    return c.json(apiError('UNAUTHORIZED', 'Authentication required'), 401)
  }

  if (!user.roles.includes('admin')) {
    return c.json(apiError('FORBIDDEN', 'Admin access required'), 403)
  }

  return next()
}
