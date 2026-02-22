# Database Schema — Neon PostgreSQL

## ER Diagram (Simplified)

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│   users      │     │   videos      │     │   frames         │
│──────────────│     │───────────────│     │──────────────────│
│ id (PK)      │     │ id (PK)       │     │ id (PK)          │
│ clerk_id     │     │ video_id (YT) │     │ video_id (FK)    │
│ display_name │     │ title         │     │ rank             │
│ avatar_url   │     │ channel       │     │ timestamp_sec    │
│ country      │     │ category      │     │ heatmap_value    │
│ xp           │     │ duration      │     │ r2_path          │
│ level        │     │ view_count    │     │ r2_variants {}   │
│ streak_curr  │     │ upload_date   │     │ width, height    │
│ streak_best  │     │ difficulty    │     └──────────────────┘
│ anon_fingerp │     │ heatmap_raw   │
└──────┬───────┘     └───────┬───────┘
       │                     │
       │     ┌───────────────┴────────────┐
       │     │   daily_games              │
       │     │────────────────────────────│
       │     │ id (PK)                    │
       │     │ game_date                  │
       │     │ mode                       │
       │     │ video_id (FK)              │
       │     │ config_json                │
       │     │ seed                       │
       │     └────────────┬───────────────┘
       │                  │
       └──────┐     ┌─────┘
              │     │
       ┌──────┴─────┴─────────────────┐
       │   game_results               │
       │──────────────────────────────│
       │ id (PK)                      │
       │ user_id (FK) / anon_fp       │
       │ daily_game_id (FK)           │
       │ score                        │
       │ guesses_used                 │
       │ time_ms                      │
       │ completed_at                 │
       │ share_hash                   │
       └──────────────────────────────┘
```

---

## Full SQL Schema

```sql
-- ============================================================
-- Framedle Database Schema — Neon PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- fuzzy text search

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_id        TEXT UNIQUE,                    -- Clerk user ID (null for anonymous)
    anon_fingerprint TEXT,                           -- Device fingerprint (anonymous users)
    display_name    TEXT NOT NULL DEFAULT 'Player',
    avatar_url      TEXT,
    country_code    CHAR(2),                        -- ISO 3166-1 alpha-2
    email           TEXT,

    -- Progression
    xp              BIGINT NOT NULL DEFAULT 0,
    level           INTEGER NOT NULL DEFAULT 1,
    title           TEXT NOT NULL DEFAULT 'Viewer',

    -- Streaks
    streak_current  INTEGER NOT NULL DEFAULT 0,
    streak_best     INTEGER NOT NULL DEFAULT 0,
    streak_freezes  INTEGER NOT NULL DEFAULT 0,    -- max 2
    last_play_date  DATE,

    -- Metadata
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT users_has_identity CHECK (
        clerk_id IS NOT NULL OR anon_fingerprint IS NOT NULL
    )
);

CREATE INDEX idx_users_clerk ON users(clerk_id) WHERE clerk_id IS NOT NULL;
CREATE INDEX idx_users_anon ON users(anon_fingerprint) WHERE anon_fingerprint IS NOT NULL;

-- ============================================================
-- 2. VIDEOS — YouTube video metadata
-- ============================================================
CREATE TABLE videos (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id        VARCHAR(20) NOT NULL UNIQUE,   -- YouTube video ID
    title           TEXT NOT NULL,
    channel         TEXT NOT NULL,
    channel_id      VARCHAR(30),                    -- YouTube channel ID
    category        TEXT,                            -- Gaming, Music, Education, etc.
    duration        INTEGER NOT NULL,               -- seconds
    view_count      BIGINT,
    subscriber_count BIGINT,                        -- channel subscribers
    upload_date     DATE,
    difficulty      SMALLINT DEFAULT 5,             -- 1-10 calibrated difficulty
    tags            TEXT[],                          -- searchable tags
    heatmap_raw     JSONB,                          -- full heatmap data
    processed_at    TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_videos_difficulty ON videos(difficulty);
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_videos_title_trgm ON videos USING GIN (title gin_trgm_ops);

-- ============================================================
-- 3. FRAMES — Extracted frames from heatmap peaks
-- ============================================================
CREATE TABLE frames (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id        VARCHAR(20) NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
    rank            SMALLINT NOT NULL,             -- 1-6 by heatmap value
    timestamp_sec   FLOAT NOT NULL,
    heatmap_value   FLOAT NOT NULL,                -- 0.0-1.0

    -- R2 storage paths (not URLs — URLs are signed at request time)
    r2_path         TEXT NOT NULL,                 -- frames/{video_id}/f{rank}.webp
    r2_variants     JSONB NOT NULL DEFAULT '{}',   -- {"crop_25": "...", "px8": "...", ...}

    width           INTEGER,
    height          INTEGER,
    file_size       INTEGER,                       -- bytes

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(video_id, rank)
);

CREATE INDEX idx_frames_video ON frames(video_id);

-- ============================================================
-- 4. DAILY GAMES — Pre-scheduled game content per day per mode
-- ============================================================
CREATE TYPE game_mode AS ENUM (
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
    'sound_only'
);

CREATE TABLE daily_games (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_date       DATE NOT NULL,
    mode            game_mode NOT NULL,
    game_number     INTEGER NOT NULL,              -- sequential number (#142)

    -- Content references
    video_id        VARCHAR(20) REFERENCES videos(video_id),
    video_ids       VARCHAR(20)[],                 -- for multi-video modes
    channel_id      VARCHAR(30),                   -- for Channel Check

    -- Mode-specific configuration
    config          JSONB NOT NULL DEFAULT '{}',
    /*
      Daily Frame config: { "answer_video_id": "...", "frame_sequence": [1,3,5], "hints": [...] }
      Year Guesser config: { "rounds": [{"video_id": "...", "year": 2019}, ...] }
      Streak config: { "pool_difficulty_start": 3, "pool_difficulty_max": 9 }
      Category Clash: { "rounds": [{"video_id": "...", "category": "Gaming"}, ...] }
    */

    -- Deterministic seed for this game
    seed            BIGINT NOT NULL,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_date, mode)
);

CREATE INDEX idx_daily_games_date ON daily_games(game_date DESC);

-- ============================================================
-- 5. GAME RESULTS — Player submissions
-- ============================================================
CREATE TABLE game_results (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id         UUID REFERENCES users(id),
    daily_game_id   UUID NOT NULL REFERENCES daily_games(id),

    -- Result data
    score           INTEGER NOT NULL DEFAULT 0,
    max_score       INTEGER NOT NULL,              -- maximum possible for this mode
    guesses_used    SMALLINT,
    guesses_data    JSONB,                         -- [{"guess": "...", "correct": false, "ts": ...}, ...]
    time_ms         INTEGER,                       -- total time to complete
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    won             BOOLEAN,

    -- Sharing
    share_hash      TEXT UNIQUE,                   -- short hash for share URLs
    emoji_grid      TEXT,                           -- pre-computed emoji representation

    completed_at    TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW(),

    -- One attempt per user per game
    UNIQUE(user_id, daily_game_id)
);

CREATE INDEX idx_results_user ON game_results(user_id);
CREATE INDEX idx_results_game ON game_results(daily_game_id);
CREATE INDEX idx_results_share ON game_results(share_hash) WHERE share_hash IS NOT NULL;

-- ============================================================
-- 6. ACHIEVEMENTS
-- ============================================================
CREATE TABLE achievements (
    id              TEXT PRIMARY KEY,              -- 'first_blood', 'genius', 'on_fire', etc.
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    icon            TEXT NOT NULL,                 -- emoji
    xp_reward       INTEGER NOT NULL DEFAULT 0,
    category        TEXT                           -- 'general', 'mode_specific', 'social', 'streak'
);

CREATE TABLE user_achievements (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id  TEXT NOT NULL REFERENCES achievements(id),
    unlocked_at     TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- ============================================================
-- 7. DUEL MATCHES
-- ============================================================
CREATE TABLE duel_matches (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player1_id      UUID NOT NULL REFERENCES users(id),
    player2_id      UUID NOT NULL REFERENCES users(id),
    winner_id       UUID REFERENCES users(id),

    -- Match data
    rounds          JSONB NOT NULL DEFAULT '[]',   -- [{frame_id, p1_guess, p2_guess, p1_time, p2_time, winner}, ...]
    score_p1        SMALLINT NOT NULL DEFAULT 0,
    score_p2        SMALLINT NOT NULL DEFAULT 0,
    best_of         SMALLINT NOT NULL DEFAULT 5,

    status          TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, abandoned
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_duels_players ON duel_matches(player1_id, player2_id);

-- ============================================================
-- 8. LEADERBOARD SNAPSHOTS (for weekly/monthly archives)
-- ============================================================
CREATE TABLE leaderboard_snapshots (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period          TEXT NOT NULL,                 -- 'weekly:2025-W08', 'monthly:2025-02'
    mode            game_mode NOT NULL,
    rankings        JSONB NOT NULL,                -- [{user_id, display_name, score, rank}, ...]
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(period, mode)
);

-- ============================================================
-- 9. VIDEO SEARCH (materialized view for fast fuzzy search)
-- ============================================================
CREATE MATERIALIZED VIEW video_search AS
SELECT
    v.video_id,
    v.title,
    v.channel,
    v.category,
    v.view_count,
    v.upload_date
FROM videos v
ORDER BY v.view_count DESC NULLS LAST;

CREATE INDEX idx_video_search_title ON video_search USING GIN (title gin_trgm_ops);
CREATE INDEX idx_video_search_channel ON video_search USING GIN (channel gin_trgm_ops);

-- Refresh periodically (after pipeline runs)
-- REFRESH MATERIALIZED VIEW CONCURRENTLY video_search;

-- ============================================================
-- 10. SEED DATA — Achievements
-- ============================================================
INSERT INTO achievements (id, name, description, icon, xp_reward, category) VALUES
    ('first_blood',    'First Blood',      'Complete any game mode',                    '🎯', 100,  'general'),
    ('genius',         'Genius',           'Guess Daily Frame on attempt 1',            '🧠', 500,  'mode_specific'),
    ('on_fire',        'On Fire',          'Reach a 7-day streak',                      '🔥', 0,    'streak'),
    ('speed_demon',    'Speed Demon',      'Win a Duel in under 5 seconds total',       '⚡', 300,  'mode_specific'),
    ('eagle_eye',      'Eagle Eye',        'Guess Pixel Reveal at 8×8 level',          '👁️', 1000, 'mode_specific'),
    ('completionist',  'Completionist',    'Play all 12 game modes at least once',      '🏆', 0,    'general'),
    ('world_tour',     'World Tour',       'Identify videos from 20+ countries',        '🌍', 0,    'general'),
    ('number_one',     '#1',               'Reach #1 on any daily leaderboard',         '👑', 1000, 'social'),
    ('gladiator',      'Gladiator',        'Win 100 Duels',                             '⚔️', 0,    'social'),
    ('binge',          'Binge',            'Complete 10 games in one day',              '📺', 200,  'general'),
    ('scholar',        'Scholar',          'Get 5 perfect Year Guesser games',          '📚', 0,    'mode_specific'),
    ('social_butterfly','Social Butterfly','Share results 50 times',                    '🤝', 0,    'social')
ON CONFLICT (id) DO NOTHING;
```
