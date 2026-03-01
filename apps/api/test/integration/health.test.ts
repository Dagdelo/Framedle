import { describe, it, expect, vi } from 'vitest'

// Mock @hono/node-server to prevent serve() side effect on import.
vi.mock('@hono/node-server', () => ({
  serve: vi.fn(),
}))

// Mock dotenv to prevent loading .env in tests
vi.mock('dotenv/config', () => ({}))

// Mock DB and services that routes depend on
vi.mock('../../src/db', () => ({
  db: {},
  schema: {
    videos: { videoId: 'video_id', title: 'title', channel: 'channel', category: 'category' },
    dailyGames: {},
    gameResults: {},
    siteConfig: {},
    frames: {},
  },
}))
vi.mock('../../src/services/game', () => ({
  getTodaysDailyGame: vi.fn(),
  submitGameGuess: vi.fn(),
  getGameResult: vi.fn(),
}))
vi.mock('../../src/services/admin', () => ({
  getAllConfig: vi.fn(),
  updateConfig: vi.fn(),
  setActiveTheme: vi.fn(),
  listDailyGames: vi.fn(),
  createDailyGame: vi.fn(),
  listVideos: vi.fn(),
  getStats: vi.fn(),
}))

import app from '../../src/index'

describe('GET /health', () => {
  it('returns status ok with 200', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ status: 'ok' })
  })

  it('responds with Content-Type application/json', async () => {
    const res = await app.request('/health')
    expect(res.headers.get('content-type')).toMatch(/application\/json/)
  })
})

// TDD stubs for game routes
describe('GET /game/daily', () => {
  it.todo('returns current daily game config for a valid mode')
  it.todo('returns 404 when no game is scheduled for today')
})

describe('POST /game/guess', () => {
  it.todo('returns correct: true when guess matches the answer exactly')
  it.todo('returns correct: true for case-insensitive exact match')
  it.todo('returns correct: false for a wrong guess')
  it.todo('returns 400 when required fields are missing')
  it.todo('returns 429 when rate limit is exceeded')
  it.todo('increments guess count on each call')
})

describe('GET /game/result/:dailyGameId', () => {
  it.todo('returns the final game result for a completed game')
  it.todo('returns 404 for a game ID that does not exist')
  it.todo('returns 400 when fingerprint query param is missing')
})

describe('GET /videos/search', () => {
  it.todo('returns matching videos for a query string')
  it.todo('returns empty array when no videos match')
  it.todo('respects the limit query parameter')
  it.todo('returns 400 when q parameter is absent')
  it.todo('returns 400 when q is less than 2 characters')
})

describe('Admin routes — GET /admin/config', () => {
  it.todo('returns current config for a valid admin Bearer token')
  it.todo('returns 401 for a missing Authorization header')
  it.todo('returns 401 for an invalid Bearer token')
})

describe('Admin routes — PUT /admin/config', () => {
  it.todo('updates a top-level config key and returns the updated config')
  it.todo('returns 400 when key field is missing')
})

describe('Admin routes — PUT /admin/theme', () => {
  it.todo('accepts a valid variant ID 1-5 and returns 200')
  it.todo('returns 400 for a variant ID outside 1-5')
})

describe('Admin routes — GET /admin/games', () => {
  it.todo('returns paginated list of scheduled daily games')
  it.todo('returns games filtered by mode when mode query param is provided')
})

describe('Admin routes — POST /admin/games', () => {
  it.todo('creates a new daily game entry and returns 201')
  it.todo('returns 400 when required fields are missing')
})

describe('Admin routes — GET /admin/videos', () => {
  it.todo('returns all processed videos with frame counts')
  it.todo('supports pagination via page and limit params')
})

describe('Admin routes — GET /admin/stats', () => {
  it.todo('returns aggregate play counts and average scores per mode')
})
