# ADR-007: Content Pipeline — GitHub Actions + yt-dlp + ffmpeg

**Status**: Accepted
**Date**: 2026-02-22
**Deciders**: Core team
**Category**: Data Pipeline

## Context

Framedle needs a daily automated pipeline to:

1. Curate videos (trending + manually selected lists)
2. Extract YouTube metadata + heatmap data (most-replayed moments)
3. Capture frames at peak heatmap timestamps
4. Generate all image variants (crops, pixelated, desaturated, fragments)
5. Extract video clips and audio segments
6. Upload assets to Cloudflare R2
7. Catalog metadata in Neon PostgreSQL
8. Assign content to future game dates per mode

This pipeline processes media files (ffmpeg) and downloads metadata — it needs a full Linux environment, not a serverless function.

## Options Considered

| Factor | GitHub Actions ✅ | Vercel Functions | AWS Lambda | Self-hosted |
|--------|-----------------|-----------------|------------|------------|
| Execution limit | **6 hours** | 60s (Pro) | 15 min | Unlimited |
| Binary install | `apt-get install ffmpeg` | Complex layering | Lambda Layers | Full control |
| Filesystem | Full Ubuntu (14GB) | /tmp 512MB | /tmp 512MB | Full disk |
| Cost | **Free (2,000 min/mo)** | $20/mo+ | ~$5/mo | $20/mo+ |
| Cron | ✅ Built-in | ✅ Cron jobs | EventBridge | Cron |
| Secrets | ✅ GitHub Secrets | ✅ Env vars | ✅ SSM | Manual |
| Monitoring | ✅ Workflow logs | Limited | CloudWatch | Manual |

## Decision

**GitHub Actions** — the 6-hour execution limit is critical for video processing pipelines. Free tier (2,000 minutes/month) covers daily runs. Full Ubuntu environment means `apt-get install ffmpeg yt-dlp` works out of the box.

## Pipeline Architecture

### 8-Step Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  1. CURATE                                                        │
│     Read curated video lists (videos.json, priority_queue.json)   │
│     + Fetch trending via YouTube Data API (optional)              │
│     Filter: no duplicates in last 90 days, has heatmap data       │
│     Output: list of YouTube video IDs to process                  │
├──────────────────────────────────────────────────────────────────┤
│  2. EXTRACT METADATA                                              │
│     yt-dlp --dump-json (no video download)                        │
│     Capture: title, channel, upload_date, duration, view_count,   │
│     category, heatmap data, thumbnail_url                         │
├──────────────────────────────────────────────────────────────────┤
│  3. ANALYZE HEATMAP                                               │
│     Parse heatmap: [{time_sec, heat_value}, ...]                  │
│     Find top 6 peaks (greedy algorithm with minimum spacing)      │
│     Minimum 10s spacing between peaks                             │
│     Fallback: evenly spaced if no heatmap available               │
├──────────────────────────────────────────────────────────────────┤
│  4. CAPTURE FRAMES                                                │
│     ffmpeg -ss {timestamp} -i {url} -vframes 1 f{rank}.webp      │
│     One frame per heatmap peak (6 frames per video)               │
│     Quality: WebP at quality 80, 1280px width                     │
├──────────────────────────────────────────────────────────────────┤
│  5. GENERATE VARIANTS                                             │
│     Per frame (15 variants):                                      │
│     - Thumbnail (320px)                                           │
│     - Center crop 25% + 50%                                       │
│     - Desaturated version                                         │
│     - Pixelated: 8x8, 16x16, 32x32, 64x64, 128x128             │
│     - Quadrant crops: TL, TR, BL, BR                             │
├──────────────────────────────────────────────────────────────────┤
│  6. EXTRACT CLIPS + AUDIO (optional, per mode needs)              │
│     ffmpeg -ss {ts} -t 5 → 5s MP4 clip (Clip Guesser)           │
│     ffmpeg -ss {ts} -t 5 -vn → 5s Opus audio (Sound Only)       │
├──────────────────────────────────────────────────────────────────┤
│  7. UPLOAD TO R2                                                  │
│     boto3 S3 client → Cloudflare R2                               │
│     Folder structure: frames/{video_id}/f{rank}_{variant}.webp   │
│     Set Content-Type + Cache-Control headers                      │
├──────────────────────────────────────────────────────────────────┤
│  8. CATALOG + SCHEDULE                                            │
│     Write to Neon: videos table (metadata) + frames table (paths) │
│     Assign videos to future game dates:                           │
│     - Each day needs content for 4 daily modes                    │
│     - Match difficulty to mode requirements                       │
│     - No same channel in consecutive days                         │
│     - Maintain 14-day buffer of pre-scheduled content             │
└──────────────────────────────────────────────────────────────────┘
```

### Heatmap Peak Selection Algorithm

```python
def find_peaks(heatmap: list[dict], count: int = 6, min_spacing: float = 10.0):
    """
    Greedy algorithm: pick highest heat value, then exclude
    nearby timestamps, repeat until we have enough peaks.
    """
    sorted_points = sorted(heatmap, key=lambda p: p['heat_value'], reverse=True)
    peaks = []

    for point in sorted_points:
        if len(peaks) >= count:
            break
        # Check minimum spacing from already-selected peaks
        if all(abs(point['time_sec'] - p['time_sec']) >= min_spacing for p in peaks):
            peaks.append(point)

    # Sort by timestamp for chronological ordering
    return sorted(peaks, key=lambda p: p['time_sec'])
```

### Scheduling Algorithm

Videos are assigned to dates **7+ days in advance** to ensure buffer:

1. Each day needs content for 4 daily mode slots
2. Videos are scored by difficulty (1-10) and tagged by category
3. Daily Frame gets difficulty 5-6 (challenging but fair)
4. Streak mode pool gets difficulty 1-10 range
5. No same video repeats within 90 days
6. No same channel in consecutive days (variety)
7. Category diversity: max 2 videos from same category per day

### Failure Handling

| Scenario | Response |
|----------|----------|
| Single video fails (yt-dlp error) | Skip, log, continue batch |
| ffmpeg frame extraction fails | Retry once, then skip frame |
| R2 upload fails | Retry 3× with exponential backoff |
| Neon write fails | Retry 3×, alert if persistent |
| Entire pipeline fails | Buffer covers 14 days, alert team |
| Buffer drops below 7 days | GitHub Actions notification + Slack webhook |

### Monitoring

- **Pipeline run status**: GitHub Actions workflow summary
- **Buffer health**: daily check of pre-scheduled content count
- **Content quality**: manual review dashboard (sample frames from each run)
- **Processing metrics**: videos processed, frames extracted, upload success rate

## GitHub Actions Workflow

```yaml
name: Daily Content Pipeline
on:
  schedule:
    - cron: '0 6 * * *'  # 06:00 UTC daily
  workflow_dispatch:       # Manual trigger
    inputs:
      video_urls:
        description: 'Comma-separated YouTube URLs (optional override)'
        required: false

jobs:
  extract:
    runs-on: ubuntu-latest
    timeout-minutes: 120
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
      - run: pip install -r pipeline/requirements.txt
      - run: sudo apt-get update && sudo apt-get install -y ffmpeg
      - run: python pipeline/extract_batch.py
        env:
          DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
          R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
          R2_ACCESS_KEY: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_BUCKET: framedle-content
```

## Consequences

### Positive

- Free tier covers daily runs (2,000 min/mo, pipeline uses ~10 min/day)
- Full Ubuntu environment — no dependency packaging complexity
- 6-hour execution limit handles large batches
- Built-in secrets management, logging, and notifications
- Manual trigger for ad-hoc processing (urgent content, corrections)

### Negative

- Coupled to GitHub (pipeline runs on GitHub infrastructure)
- No persistent state between runs (must read config from repo/DB each time)
- Rate limits on GitHub Actions (max 20 concurrent jobs)
- No real-time monitoring (check after workflow completes)

### Mitigations

- Pipeline is stateless by design — reads state from Neon, writes to R2/Neon
- 10 min/day is well within rate limits
- Post-workflow notification via Slack webhook for monitoring
- Can migrate to a self-hosted runner if GitHub becomes a bottleneck

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg Documentation](https://ffmpeg.org/ffmpeg.html)
