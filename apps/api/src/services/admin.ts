import { eq, desc, count } from 'drizzle-orm'
import { db, schema } from '../db'

/**
 * Get all site config entries.
 */
export async function getAllConfig() {
  return db.select().from(schema.siteConfig)
}

/**
 * Update a site config entry.
 */
export async function updateConfig(key: string, value: unknown) {
  const existing = await db
    .select()
    .from(schema.siteConfig)
    .where(eq(schema.siteConfig.key, key))
    .limit(1)
    .then((rows) => rows[0])

  if (existing) {
    await db
      .update(schema.siteConfig)
      .set({ value, updatedAt: new Date() })
      .where(eq(schema.siteConfig.key, key))
  } else {
    await db
      .insert(schema.siteConfig)
      .values({ key, value, updatedAt: new Date() })
  }

  return { key, value }
}

/**
 * Set active theme variant.
 */
export async function setActiveTheme(variantId: number) {
  return updateConfig('active_theme', { variantId })
}

/**
 * List daily games with pagination.
 */
export async function listDailyGames(page: number, limit: number) {
  const offset = (page - 1) * limit

  const games = await db
    .select()
    .from(schema.dailyGames)
    .orderBy(desc(schema.dailyGames.gameDate))
    .limit(limit)
    .offset(offset)

  const totalResult = await db
    .select({ count: count() })
    .from(schema.dailyGames)

  return {
    games,
    total: totalResult[0].count,
    page,
    limit,
  }
}

/**
 * Schedule a new daily game.
 */
export async function createDailyGame(
  date: string,
  mode: 'daily_frame',
  videoId: string,
) {
  // Auto-generate game number
  const lastGame = await db
    .select()
    .from(schema.dailyGames)
    .where(eq(schema.dailyGames.mode, mode))
    .orderBy(desc(schema.dailyGames.gameNumber))
    .limit(1)
    .then((rows) => rows[0])

  const gameNumber = (lastGame?.gameNumber ?? 0) + 1

  // Deterministic seed from date + mode
  const seed = hashCode(`${date}-${mode}`)

  const inserted = await db
    .insert(schema.dailyGames)
    .values({
      gameDate: date,
      mode,
      gameNumber,
      videoId,
      config: {},
      seed,
    })
    .returning()

  return inserted[0]
}

/**
 * List videos with frame counts.
 */
export async function listVideos(page: number, limit: number) {
  const offset = (page - 1) * limit

  const videoList = await db
    .select({
      id: schema.videos.id,
      videoId: schema.videos.videoId,
      title: schema.videos.title,
      channel: schema.videos.channel,
      category: schema.videos.category,
      duration: schema.videos.duration,
      viewCount: schema.videos.viewCount,
      processedAt: schema.videos.processedAt,
    })
    .from(schema.videos)
    .orderBy(desc(schema.videos.processedAt))
    .limit(limit)
    .offset(offset)

  const totalResult = await db
    .select({ count: count() })
    .from(schema.videos)

  return {
    videos: videoList,
    total: totalResult[0].count,
    page,
    limit,
  }
}

/**
 * Get admin dashboard stats.
 */
export async function getStats() {
  const [videoCount, gameCount, playCount] = await Promise.all([
    db
      .select({ count: count() })
      .from(schema.videos)
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(schema.dailyGames)
      .then((r) => r[0].count),
    db
      .select({ count: count() })
      .from(schema.gameResults)
      .then((r) => r[0].count),
  ])

  return {
    totalVideos: videoCount,
    totalGames: gameCount,
    totalPlays: playCount,
  }
}

/** Simple string hash for seed generation. */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}
