import type { H3Event } from 'h3'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Prune expired entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 60_000)

function checkLimit(key: string, maxRequests: number, windowSeconds: number): void {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return
  }

  entry.count++
  if (entry.count > maxRequests) {
    throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  }
}

export function rateLimitByIp(event: H3Event, route: string, maxRequests: number, windowSeconds: number): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  checkLimit(`${route}:ip:${ip}`, maxRequests, windowSeconds)
}

export function rateLimitBySessionId(sessionId: string, route: string, maxRequests: number, windowSeconds: number): void {
  checkLimit(`${route}:session:${sessionId}`, maxRequests, windowSeconds)
}
