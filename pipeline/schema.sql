-- ============================================
-- Schema for YouTube Heatmap Frames
-- Database: Neon (PostgreSQL)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Stores video metadata and processing status
CREATE TABLE IF NOT EXISTS videos (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id        VARCHAR(20) NOT NULL UNIQUE,  -- YouTube video ID
    title           TEXT,
    channel         TEXT,
    duration        INTEGER,                       -- duration in seconds
    view_count      BIGINT,
    upload_date     DATE,
    processed_at    TIMESTAMPTZ DEFAULT NOW(),
    heatmap_raw     JSONB,                         -- full heatmap data for reference
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Stores the extracted frames (top moments)
CREATE TABLE IF NOT EXISTS frames (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id        VARCHAR(20) NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
    rank            SMALLINT NOT NULL,             -- 1-6, rank by heatmap value
    timestamp_sec   FLOAT NOT NULL,                -- timestamp in seconds
    heatmap_value   FLOAT NOT NULL,                -- heat intensity (0-1)
    image_data      BYTEA NOT NULL,                -- JPEG frame bytes
    image_url       TEXT,                           -- optional: external storage URL (S3, R2, etc.)
    width           INTEGER,
    height          INTEGER,
    file_size       INTEGER,                        -- bytes
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(video_id, rank)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_frames_video_id ON frames(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_processed ON videos(processed_at DESC);

-- Optional: view for easy querying
CREATE OR REPLACE VIEW top_frames AS
SELECT
    v.title,
    v.channel,
    v.video_id,
    v.duration,
    f.rank,
    f.timestamp_sec,
    f.heatmap_value,
    f.file_size,
    f.width,
    f.height,
    f.created_at
FROM frames f
JOIN videos v ON v.video_id = f.video_id
ORDER BY v.processed_at DESC, f.rank ASC;
