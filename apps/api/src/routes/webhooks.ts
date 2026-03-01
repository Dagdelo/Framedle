import { Hono } from 'hono'
import { createHmac, timingSafeEqual } from 'crypto'
import { apiSuccess, apiError } from '../utils/response'
import {
  syncUserCreated,
  syncUserUpdated,
  syncUserDeleted,
} from '../services/user-sync'

export const webhookRoutes = new Hono()

function verifySignature(rawBody: string, secret: string, signatureHeader: string): boolean {
  try {
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
    const expectedBuf = Buffer.from(expected)
    const receivedBuf = Buffer.from(signatureHeader)
    if (expectedBuf.length !== receivedBuf.length) return false
    return timingSafeEqual(expectedBuf, receivedBuf)
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

  const rawBody = await c.req.text()
  const signature = c.req.header('logto-signature-sha-256') ?? ''
  if (!verifySignature(rawBody, secret, signature)) {
    return c.json(apiError('UNAUTHORIZED', 'Invalid webhook signature'), 401)
  }

  const payload = JSON.parse(rawBody) as {
    event: string
    data: {
      id: string
      name?: string
      avatar?: string
      primaryEmail?: string
    }
  }

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
