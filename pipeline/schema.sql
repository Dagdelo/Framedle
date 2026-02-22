-- ============================================
-- Pipeline Schema — Neon PostgreSQL
-- ============================================
-- This is the subset of the full Framedle schema
-- needed for the content pipeline. The complete
-- game schema is in docs/architecture/database-schema.md.
--
-- Run this first for pipeline development/testing.
-- Production uses the full schema.
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Video metadata from YouTube
CREATE TABLE IF NOT EXISTS videos (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id        VARCHAR(20) NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    channel         TEXT NOT NULL,
    channel_id      VARCHAR(30),
    category        TEXT,
    duration        INTEGER NOT NULL,
    view_count      BIGINT,
    subscriber_count BIGINT,
    upload_date     DATE,
    difficulty      SMALLINT DEFAULT 5,
    tags            TEXT[],
    heatmap_raw     JSONB,
    processed_at    TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_difficulty ON videos(difficulty);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_title_trgm ON videos USING GIN (title gin_trgm_ops);

-- Extracted frames with R2 storage references
CREATE TABLE IF NOT EXISTS frames (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id        VARCHAR(20) NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
    rank            SMALLINT NOT NULL,
    timestamp_sec   FLOAT NOT NULL,
    heatmap_value   FLOAT NOT NULL,
    r2_path         TEXT NOT NULL,
    r2_variants     JSONB NOT NULL DEFAULT '{}',
    width           INTEGER,
    height          INTEGER,
    file_size       INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(video_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_frames_video ON frames(video_id);

-- View for easy querying
CREATE OR REPLACE VIEW pipeline_status AS
SELECT
    v.video_id,
    v.title,
    v.channel,
    v.category,
    v.duration,
    v.view_count,
    v.processed_at,
    COUNT(f.id) AS frame_count,
    SUM(f.file_size) AS total_size_bytes
FROM videos v
LEFT JOIN frames f ON v.video_id = f.video_id
GROUP BY v.id
ORDER BY v.processed_at DESC;
