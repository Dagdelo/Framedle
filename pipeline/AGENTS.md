# pipeline — Agent Guide

> **Note**: This document describes the YouTube frame extraction pipeline. Update as implementation proceeds.

## Purpose

The `pipeline` package is the **content extraction system** for Framedle. It extracts frames from YouTube videos using heatmap data, generates image variants, and catalogs them in PostgreSQL for use in game modes.

Pipeline runs daily via **GitHub Actions cron** and can be triggered manually for custom video batches.

---

## Key Scripts

| Script | Purpose |
|--------|---------|
| `extract_frames.py` | Single video processor — metadata extraction, heatmap analysis, frame extraction, R2 upload, database catalog |
| `extract_batch.py` | Batch processor — reads `videos.json` or command-line URLs, processes each video, logs results |
| `.github/workflows/extract-frames.yml` | GitHub Actions cron job — daily at 06:00 UTC, manual dispatch support |

---

## Pipeline Flow

```
YouTube Video URL
    ↓
[yt-dlp] Extract metadata + heatmap
    ↓
[Find Peaks] Select top 6 most-replayed moments
    ↓
[ffmpeg] Extract WebP frames at each timestamp
    ↓
[Pillow] Generate 13 variants (thumbnails, crops, pixelated, fragments)
    ↓
[boto3] Upload to Cloudflare R2 or S3-compatible storage
    ↓
[psycopg2] Catalog video + frames in Neon PostgreSQL
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `yt-dlp` | ≥2024.01.01 | YouTube metadata + heatmap extraction |
| `ffmpeg` | (system) | Frame extraction at specific timestamps |
| `ffprobe` | (system) | Image dimension detection |
| `boto3` | ≥1.34.0 | R2/S3 uploads |
| `Pillow` | ≥10.0.0 | Image variant generation (optional) |
| `psycopg2-binary` | ≥2.9.9 | PostgreSQL database access |

Install Python dependencies:
```bash
pip install -r pipeline/requirements.txt
```

Install system dependencies (Ubuntu/Debian):
```bash
sudo apt-get install ffmpeg ffprobe
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection (e.g., `postgres://user:pass@host/db?sslmode=require`) |
| `R2_ENDPOINT` | Yes | Cloudflare R2 endpoint (e.g., `https://xxxxx.r2.cloudflarestorage.com`) |
| `R2_ACCESS_KEY` | Yes | R2 access key ID |
| `R2_SECRET_KEY` | Yes | R2 secret access key |
| `R2_BUCKET` | No | R2 bucket name (default: `framedle-content`) |
| `VIDEO_URL` | No | For `extract_frames.py` — single video URL or YouTube ID |

---

## Database Schema

The pipeline uses `pipeline/schema.sql` (subset of the full Framedle schema):

```sql
-- videos table: YouTube metadata + raw heatmap
CREATE TABLE videos (
    video_id VARCHAR(20) PRIMARY KEY,
    title, channel, category, duration, view_count,
    upload_date, heatmap_raw JSONB,
    processed_at TIMESTAMPTZ
);

-- frames table: extracted frame metadata with R2 paths
CREATE TABLE frames (
    id UUID PRIMARY KEY,
    video_id VARCHAR(20) REFERENCES videos,
    rank SMALLINT,              -- 1-6 (highest heat = 1)
    timestamp_sec FLOAT,        -- when in video
    heatmap_value FLOAT,        -- peak heat intensity
    r2_path TEXT,               -- s3://bucket/frames/VIDEO_ID/f01.webp
    r2_variants JSONB,          -- {thumb: ..., crop_25: ..., px8: ...}
    width, height, file_size
);
```

Initialize database:
```bash
psql "$DATABASE_URL" < pipeline/schema.sql
```

---

## Running Locally

### Single Video
```bash
# Via command line argument
python pipeline/extract_frames.py "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Via environment variable
export VIDEO_URL="dQw4w9WgXcQ"
python pipeline/extract_frames.py
```

### Batch Processing
```bash
# From videos.json (default)
python pipeline/extract_batch.py

# From custom config
python pipeline/extract_batch.py --config custom.json

# Via command-line URLs
python pipeline/extract_batch.py --urls "url1,url2,url3"
```

### videos.json Format
```json
{
  "videos": [
    "https://www.youtube.com/watch?v=...",
    "dQw4w9WgXcQ",
    "https://youtu.be/..."
  ]
}
```

---

## GitHub Actions Workflow

Defined in `.github/workflows/extract-frames.yml`:

- **Trigger**: Daily cron `0 6 * * *` (06:00 UTC)
- **Manual**: `workflow_dispatch` with optional `video_urls` input
- **Runtime**: Ubuntu latest, Python 3.12, 120-minute timeout
- **Secrets required**: `DATABASE_URL`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- **Slack notifications**: Optional via `SLACK_WEBHOOK_URL` secret on failure

---

## Frame Variants

For each extracted frame, 13 image variants are generated (requires Pillow):

| Variant | Purpose | Use Case |
|---------|---------|----------|
| `thumb` | 320px thumbnail | UI thumbnails |
| `crop_25` / `crop_50` | Center crops | Daily Frame hints 1–2 |
| `desat` | Desaturated (grayscale) | Hint progression |
| `px8` / `px16` / `px32` / `px64` / `px128` | Pixelated (8–128px blocks) | Pixel Reveal mode |
| `frag_tl` / `frag_tr` / `frag_bl` / `frag_br` | Quadrant crops | Fragment Match mode |

All variants stored as WebP at 80% quality.

---

## Storage: Cloudflare R2 or Self-Hosted S3

Frames are uploaded to:
```
s3://bucket/frames/{VIDEO_ID}/f01.webp
s3://bucket/frames/{VIDEO_ID}/f01_thumb.webp
s3://bucket/frames/{VIDEO_ID}/f01_crop_25.webp
...
```

**Cloudflare R2**: Free tier includes 10 GB storage + unlimited egress. Configure in R2 dashboard, get endpoint + API credentials.

**Self-hosted S3 (Garage)**: Use S3-compatible endpoint on VPS. boto3 works with any S3-compatible service via `endpoint_url`.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `No heatmap data available` | YouTube video doesn't expose heatmap (premium/archive/unlisted). Pipeline falls back to evenly-spaced frames. |
| `ffmpeg failed at Xs` | Video URL expired or ffmpeg not installed. Check `ffmpeg --version`. |
| `Pillow not installed` | Install: `pip install Pillow`. Variants skipped if missing. |
| `R2 credentials not configured` | Check env vars. If intentionally skipped, frames are extracted locally but not uploaded. |
| `DATABASE_URL required` | Set PostgreSQL connection string. Pipeline fails if DB unavailable. |

---

## Development Workflow

```bash
# Set up local environment
cp .env.template .env
# Edit .env with DATABASE_URL + R2 credentials (optional)

# Test single video
export DATABASE_URL="..."
export R2_ENDPOINT="..."
python pipeline/extract_frames.py "YOUTUBE_URL"

# Test batch
python pipeline/extract_batch.py --urls "url1,url2"

# Check database
psql "$DATABASE_URL" -c "SELECT * FROM pipeline_status;"
```

---

## Integration with Game

Frames are served to game clients via the **Hono API**:

- `GET /api/daily/:mode` — Returns daily game including frame URLs
- `GET /api/videos/:videoId/frames` — Lists all frames + variants for a video

Game-engine consumes R2 URLs and renders frames in game boards.
