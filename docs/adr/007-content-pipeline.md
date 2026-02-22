# ADR-007: Content Pipeline — GitHub Actions + yt-dlp + ffmpeg

**Status**: Accepted | **Date**: 2025-02-22 | **Category**: Data Pipeline

## Context
Need a daily automated pipeline to: curate videos → extract heatmap data → capture frames at peak moments → generate image variants → upload to R2 → assign to future game dates.

## Decision

**GitHub Actions** as the orchestrator, **yt-dlp** (Python) for YouTube metadata/heatmap extraction, **ffmpeg** for frame/clip/audio extraction and image processing, **boto3** for R2 upload (S3-compatible API).

### Why GitHub Actions (not Vercel/Lambda)

| Factor | GitHub Actions ✅ | Vercel Functions | AWS Lambda |
|--------|-----------------|-----------------|------------|
| Execution limit | **6 hours** | 60s (Pro) | 15 min |
| Binary install | `apt-get install ffmpeg` | Complex layering | Lambda Layers |
| Filesystem | Full Ubuntu | /tmp 512MB | /tmp 512MB |
| Cost | **Free (2000 min/mo)** | $20/mo+ | ~$5/mo |
| Cron | ✅ Built-in | ✅ Built-in | EventBridge |

### Pipeline Steps

```
1. CURATE      — Fetch trending videos + read curated lists
2. EXTRACT     — yt-dlp: metadata + heatmap (no video download)
3. ANALYZE     — Find top 6 heatmap peaks per video
4. CAPTURE     — ffmpeg: extract frames at peak timestamps
5. PROCESS     — ffmpeg: generate all variants (crops, pixelated, desat, fragments)
6. UPLOAD      — boto3: upload WebP files to Cloudflare R2
7. CATALOG     — Write metadata to Neon (videos, frames tables)
8. SCHEDULE    — Assign videos to future game dates per mode
```

### Scheduling Algorithm

Videos are assigned to dates 7+ days in advance:
- Each day needs content for 4 daily modes
- Videos are scored by difficulty (1-10) and tagged by category
- Daily Frame gets difficulty 5-6, Streak gets 1-10 range
- No repeats within 90 days
- Popular channels rotate (no same channel in consecutive days)

### Failure Handling
- Individual video failures don't block the pipeline
- Minimum 14-day buffer of pre-scheduled content
- Alert via GitHub Actions notification if buffer drops below 7 days
- Manual override: add videos to `priority_queue.json`
