import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  smallint,
  bigint,
  boolean,
  date,
  real,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ============================================================
// Enums
// ============================================================

export const gameModeEnum = pgEnum('game_mode', [
  'daily_frame',
  'clip_guesser',
  'channel_check',
  'year_guesser',
  'view_count_blitz',
  'timeline_sort',
  'pixel_reveal',
  'category_clash',
  'streak',
  'duel',
  'fragment_match',
  'sound_only',
])

// ============================================================
// 1. USERS
// ============================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authProviderId: text('auth_provider_id').unique(),
    anonFingerprint: text('anon_fingerprint'),
    displayName: text('display_name').notNull().default('Player'),
    avatarUrl: text('avatar_url'),
    countryCode: varchar('country_code', { length: 2 }),
    email: text('email'),

    // Progression
    xp: bigint('xp', { mode: 'number' }).notNull().default(0),
    level: integer('level').notNull().default(1),
    title: text('title').notNull().default('Viewer'),

    // Streaks
    streakCurrent: integer('streak_current').notNull().default(0),
    streakBest: integer('streak_best').notNull().default(0),
    streakFreezes: integer('streak_freezes').notNull().default(0),
    lastPlayDate: date('last_play_date'),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_users_auth_provider').on(table.authProviderId),
    index('idx_users_anon').on(table.anonFingerprint),
    check(
      'users_has_identity',
      sql`${table.authProviderId} IS NOT NULL OR ${table.anonFingerprint} IS NOT NULL`,
    ),
  ],
)

// ============================================================
// 2. VIDEOS — YouTube video metadata (existing table in Neon)
// ============================================================

export const videos = pgTable(
  'videos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    videoId: varchar('video_id', { length: 20 }).notNull().unique(),
    title: text('title').notNull(),
    channel: text('channel').notNull(),
    channelId: varchar('channel_id', { length: 30 }),
    category: text('category'),
    duration: integer('duration').notNull(),
    viewCount: bigint('view_count', { mode: 'number' }),
    subscriberCount: bigint('subscriber_count', { mode: 'number' }),
    uploadDate: date('upload_date'),
    difficulty: smallint('difficulty').default(5),
    tags: text('tags').array(),
    heatmapRaw: jsonb('heatmap_raw'),
    processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_videos_difficulty').on(table.difficulty),
    index('idx_videos_category').on(table.category),
  ],
)

// ============================================================
// 3. FRAMES — Extracted frames from heatmap peaks (existing table in Neon)
// ============================================================

export const frames = pgTable(
  'frames',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    videoId: varchar('video_id', { length: 20 })
      .notNull()
      .references(() => videos.videoId, { onDelete: 'cascade' }),
    rank: smallint('rank').notNull(),
    timestampSec: real('timestamp_sec').notNull(),
    heatmapValue: real('heatmap_value').notNull(),

    // R2 storage paths
    r2Path: text('r2_path').notNull(),
    r2Variants: jsonb('r2_variants').notNull().default({}),

    width: integer('width'),
    height: integer('height'),
    fileSize: integer('file_size'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('frames_video_id_rank_unique').on(table.videoId, table.rank),
    index('idx_frames_video').on(table.videoId),
  ],
)

// ============================================================
// 4. DAILY GAMES — Pre-scheduled game content per day per mode
// ============================================================

export const dailyGames = pgTable(
  'daily_games',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gameDate: date('game_date').notNull(),
    mode: gameModeEnum('mode').notNull(),
    gameNumber: integer('game_number').notNull(),

    // Content references
    videoId: varchar('video_id', { length: 20 }).references(
      () => videos.videoId,
    ),
    videoIds: varchar('video_ids', { length: 20 }).array(),
    channelId: varchar('channel_id', { length: 30 }),

    // Mode-specific configuration
    config: jsonb('config').notNull().default({}),

    // Deterministic seed
    seed: bigint('seed', { mode: 'number' }).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('daily_games_game_date_mode_unique').on(
      table.gameDate,
      table.mode,
    ),
    index('idx_daily_games_date').on(table.gameDate),
  ],
)

// ============================================================
// 5. GAME RESULTS — Player submissions
// ============================================================

export const gameResults = pgTable(
  'game_results',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    dailyGameId: uuid('daily_game_id')
      .notNull()
      .references(() => dailyGames.id),

    // Result data
    score: integer('score').notNull().default(0),
    maxScore: integer('max_score').notNull(),
    guessesUsed: smallint('guesses_used'),
    guessesData: jsonb('guesses_data'),
    timeMs: integer('time_ms'),
    completed: boolean('completed').notNull().default(false),
    won: boolean('won'),

    // Sharing
    shareHash: text('share_hash').unique(),
    emojiGrid: text('emoji_grid'),

    completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('game_results_user_game_unique').on(
      table.userId,
      table.dailyGameId,
    ),
    index('idx_results_user').on(table.userId),
    index('idx_results_game').on(table.dailyGameId),
    index('idx_results_share').on(table.shareHash),
  ],
)

// ============================================================
// 6. ACHIEVEMENTS
// ============================================================

export const achievements = pgTable('achievements', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon').notNull(),
  xpReward: integer('xp_reward').notNull().default(0),
  category: text('category'),
})

export const userAchievements = pgTable(
  'user_achievements',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id')
      .notNull()
      .references(() => achievements.id),
    unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.achievementId] }),
  ],
)

// ============================================================
// 7. DUEL MATCHES
// ============================================================

export const duelMatches = pgTable(
  'duel_matches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    player1Id: uuid('player1_id')
      .notNull()
      .references(() => users.id),
    player2Id: uuid('player2_id')
      .notNull()
      .references(() => users.id),
    winnerId: uuid('winner_id').references(() => users.id),

    // Match data
    rounds: jsonb('rounds').notNull().default([]),
    scoreP1: smallint('score_p1').notNull().default(0),
    scoreP2: smallint('score_p2').notNull().default(0),
    bestOf: smallint('best_of').notNull().default(5),

    status: text('status').notNull().default('in_progress'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_duels_players').on(table.player1Id, table.player2Id),
  ],
)

// ============================================================
// 8. LEADERBOARD SNAPSHOTS
// ============================================================

export const leaderboardSnapshots = pgTable(
  'leaderboard_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    period: text('period').notNull(),
    mode: gameModeEnum('mode').notNull(),
    rankings: jsonb('rankings').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('leaderboard_snapshots_period_mode_unique').on(
      table.period,
      table.mode,
    ),
  ],
)

// ============================================================
// 9. SITE CONFIG (new table for admin dashboard)
// ============================================================

export const siteConfig = pgTable('site_config', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
