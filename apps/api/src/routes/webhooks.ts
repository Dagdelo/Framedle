import { Hono } from 'hono'
import { timingSafeEqual } from 'crypto'
import { apiSuccess, apiError } from '../utils/response'
import {
  syncUserCreated,
  syncUserUpdated,
  syncUserDeleted,
} from '../services/user-sync'

export const webhookRoutes = new Hono()

function verifySignature(signature: string, secret: string): boolean {
  try {
    const sigBuf = Buffer.from(signature)
    const secretBuf = Buffer.from(secret)
    if (sigBuf.length !== secretBuf.length) return false
    return timingSafeEqual(sigBuf, secretBuf)
  } catch {
    return false
  }
}

/**
 * POST /webhooks/logto — Handle Logto webhook events.
 */
webhookRoutes.post('/logto', async (c) => {
  const secret = process.env.LOGTO_WEBHOOK_SECRET
  if (!secret) {
    return c.json(apiError('SERVER_ERROR', 'Webhook secret not configured'), 500)
  }

  const signature = c.req.header('logto-signature-sha-256') ?? ''
  if (!verifySignature(signature, secret)) {
    return c.json(apiError('UNAUTHORIZED', 'Invalid webhook signature'), 401)
  }

  const payload = await c.req.json<{
    event: string
    data: {
      id: string
      name?: string
      avatar?: string
      primaryEmail?: string
    }
  }>()

  switch (payload.event) {
    case 'User.Created': {
      await syncUserCreated(payload.data)
      break
    }
    case 'User.Data.Updated': {
      await syncUserUpdated(payload.data)
      break
    }
    case 'User.Deleted': {
      await syncUserDeleted(payload.data.id)
      break
    }
    default:
      // Ignore unknown events
      break
  }

  return c.json(apiSuccess({ received: true }))
})
