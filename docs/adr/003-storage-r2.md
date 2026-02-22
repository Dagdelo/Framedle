# ADR-003: Object Storage — Cloudflare R2

**Status**: Accepted
**Date**: 2026-02-22
**Deciders**: Core team
**Category**: Storage

## Context

Framedle needs to store and serve image frames, video clips, and audio snippets globally with low latency. The storage is write-once (pipeline uploads), read-many (every game session fetches frames).

Expected volume at maturity:
- ~15 variants per frame × 6 frames × ~100 videos/day = **~9,000 files/day**
- ~50 GB total storage at 50K DAU
- ~5M read requests/month at 50K DAU

## Options Considered

| Criteria | AWS S3 | Cloudflare R2 ✅ | Backblaze B2 |
|----------|--------|-----------------|-------------|
| Egress cost | $0.09/GB | **$0 (free)** | $0.01/GB |
| Storage cost | $0.023/GB/mo | $0.015/GB/mo | $0.006/GB/mo |
| CDN integration | CloudFront (additional cost) | **CF CDN (built-in, free)** | Manual setup |
| S3-compatible API | Native | ✅ Yes | ✅ Yes |
| CF Workers integration | External HTTP call | **Native R2 binding** | External HTTP call |
| Signed URLs | ✅ | ✅ | ✅ |
| Global edge caching | Via CloudFront | **Automatic via CF network** | Via CDN partner |

## Decision

**Cloudflare R2** — zero egress fees are transformative for an image-heavy gaming app. Native integration with CF Workers means frames are served from the same edge network as our API, and R2 bindings in Hono handlers avoid HTTP overhead entirely.

## Storage Structure

```
r2://framedle-content/
├── frames/
│   └── {video_id}/
│       ├── f01.webp              # Full frame (1280px, quality 80)
│       ├── f01_thumb.webp        # Thumbnail (320px)
│       ├── f01_crop_25.webp      # Center 25% crop (Daily Frame hint 1)
│       ├── f01_crop_50.webp      # Center 50% crop (Daily Frame hint 2)
│       ├── f01_desat.webp        # Desaturated version (Daily Frame hints 1-3)
│       ├── f01_px8.webp          # 8×8 pixelated (Pixel Reveal level 1)
│       ├── f01_px16.webp         # 16×16 pixelated
│       ├── f01_px32.webp         # 32×32 pixelated
│       ├── f01_px64.webp         # 64×64 pixelated
│       ├── f01_px128.webp        # 128×128 pixelated
│       ├── f01_frag_tl.webp      # Top-left quadrant (Fragment Match)
│       ├── f01_frag_tr.webp      # Top-right quadrant
│       ├── f01_frag_bl.webp      # Bottom-left quadrant
│       └── f01_frag_br.webp      # Bottom-right quadrant
├── clips/
│   └── {video_id}/
│       └── c01_5s.mp4            # 5-second clip (Clip Guesser)
├── audio/
│   └── {video_id}/
│       └── a01_5s.opus           # 5-second audio (Sound Only)
└── og/
    └── {share_hash}.png          # Generated share images (cached)
```

## Key Design Decisions

1. **WebP format** for all images — 30-50% smaller than JPEG with universal browser support
2. **Signed URLs with 1-hour TTL** — prevents hotlinking and aids anti-cheat (can't share frame URLs)
3. **Cache-Control**: `public, max-age=86400` for frames (content is immutable once uploaded)
4. **Path convention**: `/frames/{video_id}/f{rank}_{variant}.webp` — predictable but not guessable without DB lookup
5. **Pipeline uploads via boto3** (S3-compatible API) — standard tooling, no custom R2 SDK needed

## Security

- Frame URLs served to clients use **obfuscated paths** (UUID-based, not video_id-based) to prevent players from identifying the video by inspecting network requests
- R2 bucket is **private** — all access goes through CF Workers which generates signed URLs
- Signed URL TTL of 1 hour balances security with user experience (game sessions rarely exceed 1 hour)
- OG image cache has longer TTL (7 days) since share images don't contain spoilers

## Cost Estimate (at 50K DAU)

| Component | Usage | Cost |
|-----------|-------|------|
| Storage | ~50 GB | $0.75/mo |
| Class B requests | ~5M/mo | $1.80/mo |
| Egress | — | **$0** |
| **Total** | | **~$2.55/mo** |

Comparison: same workload on **S3 + CloudFront** would cost ~$60/mo (mostly egress).

## References

- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [R2 Workers Bindings](https://developers.cloudflare.com/r2/api/workers/)
- [R2 S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/)
