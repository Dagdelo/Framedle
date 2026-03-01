import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { gameRoutes } from './routes/game'
import { adminRoutes } from './routes/admin'
import { videoRoutes } from './routes/videos'
import { apiError } from './utils/response'

const app = new Hono()

// CORS
const corsOrigins = [process.env.APP_URL || 'http://localhost:3000']
if (process.env.NODE_ENV !== 'production') {
  corsOrigins.push('http://localhost:3000')
}
app.use(
  '*',
  cors({
    origin: [...new Set(corsOrigins)],
    credentials: true,
  }),
)

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Route groups
app.route('/game', gameRoutes)
app.route('/admin', adminRoutes)
app.route('/videos', videoRoutes)

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json(apiError('INTERNAL_ERROR', 'An unexpected error occurred'), 500)
})

// 404 handler
app.notFound((c) => {
  return c.json(apiError('NOT_FOUND', 'Endpoint not found'), 404)
})

const port = Number(process.env.PORT) || 4000
serve({ fetch: app.fetch, port })
console.log(`Hono API running on port ${port}`)

export default app
