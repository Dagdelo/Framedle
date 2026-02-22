# ADR-003: Object Storage — Cloudflare R2

**Status**: Accepted | **Date**: 2025-02-22 | **Category**: Storage

## Context
Framedle needs to store and serve image frames, video clips, and audio snippets globally with low latency. Expected volume: ~15 variants per frame × 6 frames × ~100 videos/day = ~9,000 files/day.

## Options Considered

| Criteria | AWS S3 | Cloudflare R2 ✅ | Backblaze B2 |
|----------|--------|-----------------|-------------|
| Egress cost | $0.09/GB | **$0 (free)** | $0.01/GB |
| Storage cost | $0.023/GB/mo | $0.015/GB/mo | $0.006/GB/mo |
| CDN integration | CloudFront ($) | **CF CDN (built-in, free)** | Manual |
| S3-compatible API | Native | ✅ Yes | ✅ Yes |
| CF Workers integration | External call | **Native binding** | External call |
| Signed URLs | ✅ | ✅ | ✅ |

## Decision

**Cloudflare R2** — zero egress fees are game-changing for an image-heavy app. Native integration with CF Workers (our API layer) means frames are served from the same edge network, and we can use R2 bindings directly in Hono handlers without HTTP calls.

## Key Design Decisions

1. **WebP format** for all images (30-50% smaller than JPEG, universal browser support)
2. **Signed URLs with 1-hour TTL** — prevents hotlinking and aids anti-cheat
3. **Cache-Control headers** — `public, max-age=86400` for frames (immutable content)
4. **Folder structure**: `/frames/{video_id}/f{nn}_{variant}.webp`
5. **Pipeline uploads directly to R2** via S3-compatible API (boto3)

## Cost Estimate (at 50K DAU)
- Storage: ~50GB → $0.75/mo
- Requests: ~5M class B → $1.80/mo  
- Egress: **$0**
- **Total: ~$2.55/mo** (vs ~$60/mo on S3 with CloudFront)

## References
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [R2 Workers Bindings](https://developers.cloudflare.com/r2/api/workers/)
