import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql } from 'drizzle-orm'
import { siteConfig, dailyGames, videos } from './schema'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

const client = postgres(databaseUrl, { ssl: 'require', max: 1 })
const db = drizzle(client)

async function seed() {
  console.log('Seeding database...')

  // 1. Create site_config table if not exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS site_config (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  console.log('  site_config table ensured')

  // 2. Create daily_games table if not exists (with enum)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE game_mode AS ENUM (
        'daily_frame', 'clip_guesser', 'channel_check', 'year_guesser',
        'view_count_blitz', 'timeline_sort', 'pixel_reveal', 'category_clash',
        'streak', 'duel', 'fragment_match', 'sound_only'
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS daily_games (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      game_date DATE NOT NULL,
      mode game_mode NOT NULL,
      game_number INTEGER NOT NULL,
      video_id VARCHAR(20) REFERENCES videos(video_id),
      video_ids VARCHAR(20)[],
      channel_id VARCHAR(30),
      config JSONB NOT NULL DEFAULT '{}',
      seed BIGINT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(game_date, mode)
    )
  `)
  console.log('  daily_games table ensured')

  // 3. Seed site_config rows
  await db
    .insert(siteConfig)
    .values([
      { key: 'active_theme', value: { variantId: 1 } },
      { key: 'maintenance_mode', value: { enabled: false } },
    ])
    .onConflictDoNothing()
  console.log('  site_config rows seeded')

  // 4. Create a daily_games entry for today using an existing test video
  const today = new Date().toISOString().split('T')[0]!

  // Find the first available video
  const existingVideos = await db
    .select({ videoId: videos.videoId, title: videos.title })
    .from(videos)
    .limit(1)

  if (existingVideos.length > 0) {
    const video = existingVideos[0]!
    const seed = Math.floor(Date.now() / 86400000) // deterministic daily seed

    await db
      .insert(dailyGames)
      .values({
        gameDate: today,
        mode: 'daily_frame',
        gameNumber: 1,
        videoId: video.videoId,
        config: {
          answer_video_id: video.videoId,
          frame_sequence: [1, 2, 3, 4, 5, 6],
        },
        seed,
      })
      .onConflictDoNothing()

    console.log(
      `  daily_games entry created for ${today}: "${video.title}" (${video.videoId})`,
    )
  } else {
    console.log('  No videos in database — skipping daily_games seed')
  }

  // 5. Verify
  const configRows = await db.select().from(siteConfig)
  console.log(`\nVerification:`)
  console.log(`  site_config rows: ${configRows.length}`)
  for (const row of configRows) {
    console.log(`    ${row.key} = ${JSON.stringify(row.value)}`)
  }

  const videoCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(videos)
  console.log(`  videos in database: ${videoCount[0]?.count ?? 0}`)

  console.log('\nSeed complete!')
  await client.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
