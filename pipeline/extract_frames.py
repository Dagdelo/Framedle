"""
YouTube Heatmap Frame Extractor
================================
Extracts the top 6 most replayed moments from a YouTube video
using yt-dlp's heatmap data, captures frames with ffmpeg,
generates image variants (crops, pixelated, desaturated, fragments),
uploads to Cloudflare R2, and catalogs in Neon (PostgreSQL).

Usage:
    python extract_frames.py <youtube_url_or_id>

    # Or via environment variable:
    VIDEO_URL=https://www.youtube.com/watch?v=dQw4w9WgXcQ python extract_frames.py

Environment:
    DATABASE_URL    Neon PostgreSQL connection string
    R2_ENDPOINT     Cloudflare R2 endpoint URL
    R2_ACCESS_KEY   R2 access key ID
    R2_SECRET_KEY   R2 secret access key
    R2_BUCKET       R2 bucket name (default: framedle-content)
"""

import os
import sys
import json
import subprocess
import tempfile
import logging
from datetime import datetime
from pathlib import Path

import psycopg2
from psycopg2.extras import Json
from yt_dlp import YoutubeDL

# Optional: R2 upload via boto3
try:
    import boto3
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False

# Optional: WebP/variant generation via Pillow
try:
    from PIL import Image
    HAS_PILLOW = True
except ImportError:
    HAS_PILLOW = False

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
NUM_FRAMES = 6
MIN_SPACING_SEC = 10          # minimum seconds between selected peaks
FRAME_WIDTH = 1280            # resize width (keep aspect ratio)
WEBP_QUALITY = 80             # WebP quality (1-100)

DATABASE_URL = os.environ.get("DATABASE_URL")
VIDEO_URL = os.environ.get("VIDEO_URL")
R2_ENDPOINT = os.environ.get("R2_ENDPOINT")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY")
R2_SECRET_KEY = os.environ.get("R2_SECRET_KEY")
R2_BUCKET = os.environ.get("R2_BUCKET", "framedle-content")

# Variant definitions for each frame
VARIANTS = {
    "thumb":    {"width": 320, "description": "Thumbnail"},
    "crop_25":  {"crop": 0.25, "description": "Center 25% crop (Daily Frame hint 1)"},
    "crop_50":  {"crop": 0.50, "description": "Center 50% crop (Daily Frame hint 2)"},
    "desat":    {"desaturate": True, "description": "Desaturated (Daily Frame hints 1-3)"},
    "px8":      {"pixelate": 8, "description": "8x8 pixelated (Pixel Reveal level 1)"},
    "px16":     {"pixelate": 16, "description": "16x16 pixelated"},
    "px32":     {"pixelate": 32, "description": "32x32 pixelated"},
    "px64":     {"pixelate": 64, "description": "64x64 pixelated"},
    "px128":    {"pixelate": 128, "description": "128x128 pixelated"},
    "frag_tl":  {"fragment": "tl", "description": "Top-left quadrant (Fragment Match)"},
    "frag_tr":  {"fragment": "tr", "description": "Top-right quadrant"},
    "frag_bl":  {"fragment": "bl", "description": "Bottom-left quadrant"},
    "frag_br":  {"fragment": "br", "description": "Bottom-right quadrant"},
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 1. Extract video metadata + heatmap via yt-dlp
# ---------------------------------------------------------------------------
def get_video_info(url: str) -> dict:
    """
    Uses yt-dlp Python API to extract video metadata including heatmap.
    No video download is performed — only metadata extraction.
    """
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "extractor_args": {"youtube": {"player_client": ["web"]}},
        "remote_components": {"ejs": "github"},
    }

    log.info(f"Extracting metadata for: {url}")
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    if not info:
        raise RuntimeError("Failed to extract video info")

    return info


# ---------------------------------------------------------------------------
# 2. Analyze heatmap and find top N peak moments
# ---------------------------------------------------------------------------
def find_top_moments(
    heatmap: list[dict],
    duration: float,
    n: int = NUM_FRAMES,
    min_spacing: float = MIN_SPACING_SEC,
) -> list[dict]:
    """
    Greedy peak selection: pick highest heat value, exclude nearby
    timestamps (min_spacing), repeat until we have enough peaks.
    """
    if not heatmap:
        raise ValueError("Heatmap data is empty or unavailable for this video")

    sorted_segments = sorted(heatmap, key=lambda s: s["value"], reverse=True)
    selected = []

    for segment in sorted_segments:
        if len(selected) >= n:
            break

        mid_time = (segment["start_time"] + segment["end_time"]) / 2
        mid_time = max(0.5, min(mid_time, duration - 0.5))

        too_close = any(
            abs(mid_time - sel["timestamp"]) < min_spacing for sel in selected
        )
        if too_close:
            continue

        selected.append({
            "timestamp": mid_time,
            "value": segment["value"],
            "start_time": segment["start_time"],
            "end_time": segment["end_time"],
        })

    # Rank by heat value (1 = highest)
    selected.sort(key=lambda s: s["value"], reverse=True)
    for i, s in enumerate(selected):
        s["rank"] = i + 1

    log.info(f"Selected {len(selected)} peak moments:")
    for s in selected:
        log.info(f"  Rank {s['rank']}: {s['timestamp']:.1f}s (heat={s['value']:.3f})")

    return selected


# ---------------------------------------------------------------------------
# 3. Extract frames using ffmpeg
# ---------------------------------------------------------------------------
def extract_frame(video_url: str, timestamp: float, output_path: str) -> str:
    """Extract a single frame at the given timestamp using ffmpeg."""
    cmd = [
        "ffmpeg",
        "-ss", str(timestamp),
        "-i", video_url,
        "-vframes", "1",
        "-vf", f"scale={FRAME_WIDTH}:-1",
        "-quality", str(WEBP_QUALITY),
        "-y",
        output_path,
    ]

    log.info(f"Extracting frame at {timestamp:.1f}s → {output_path}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed at {timestamp}s: {result.stderr[-500:]}")

    return output_path


def get_best_video_url(info: dict) -> str:
    """Gets the best ~720p direct video URL from yt-dlp info."""
    formats = info.get("formats", [])

    best = None
    for f in formats:
        if f.get("vcodec", "none") == "none":
            continue
        if f.get("url"):
            height = f.get("height") or 0
            if best is None or (
                abs(height - 720) < abs((best.get("height") or 0) - 720)
            ):
                best = f

    if not best:
        url = info.get("url")
        if url:
            return url
        raise RuntimeError("No suitable video URL found")

    return best["url"]


def get_frame_dimensions(filepath: str) -> dict:
    """Get width/height via ffprobe."""
    probe = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "json",
            filepath,
        ],
        capture_output=True, text=True,
    )
    dims = {"width": None, "height": None}
    if probe.returncode == 0:
        streams = json.loads(probe.stdout).get("streams", [])
        if streams:
            dims["width"] = streams[0].get("width")
            dims["height"] = streams[0].get("height")
    return dims


# ---------------------------------------------------------------------------
# 4. Generate image variants
# ---------------------------------------------------------------------------
def generate_variants(frame_path: str, video_id: str, rank: int, work_dir: str) -> dict:
    """
    Generate all image variants for a frame using Pillow.
    Returns a dict of variant_name → local file path.
    """
    if not HAS_PILLOW:
        log.warning("Pillow not installed — skipping variant generation")
        return {}

    img = Image.open(frame_path)
    w, h = img.size
    variant_paths = {}

    for name, spec in VARIANTS.items():
        out_path = os.path.join(work_dir, f"f{rank:02d}_{name}.webp")

        if "width" in spec:
            # Thumbnail: resize to target width
            ratio = spec["width"] / w
            new_size = (spec["width"], int(h * ratio))
            variant = img.resize(new_size, Image.LANCZOS)

        elif "crop" in spec:
            # Center crop: keep inner N% of the image
            pct = spec["crop"]
            crop_w = int(w * pct)
            crop_h = int(h * pct)
            left = (w - crop_w) // 2
            top = (h - crop_h) // 2
            variant = img.crop((left, top, left + crop_w, top + crop_h))
            # Scale back up to full width for display
            variant = variant.resize((FRAME_WIDTH, int(FRAME_WIDTH * crop_h / crop_w)), Image.LANCZOS)

        elif spec.get("desaturate"):
            # Convert to grayscale then back to RGB
            variant = img.convert("L").convert("RGB")

        elif "pixelate" in spec:
            # Downscale to NxN then upscale back (nearest neighbor for blocky look)
            px = spec["pixelate"]
            small = img.resize((px, px), Image.BILINEAR)
            variant = small.resize((FRAME_WIDTH, int(FRAME_WIDTH * h / w)), Image.NEAREST)

        elif "fragment" in spec:
            # Quadrant crop
            frag = spec["fragment"]
            half_w, half_h = w // 2, h // 2
            boxes = {
                "tl": (0, 0, half_w, half_h),
                "tr": (half_w, 0, w, half_h),
                "bl": (0, half_h, half_w, h),
                "br": (half_w, half_h, w, h),
            }
            variant = img.crop(boxes[frag])
        else:
            continue

        variant.save(out_path, "WEBP", quality=WEBP_QUALITY)
        variant_paths[name] = out_path

    log.info(f"  Generated {len(variant_paths)} variants for frame rank {rank}")
    return variant_paths


def extract_all_frames(
    video_url: str, moments: list[dict], video_id: str, work_dir: str
) -> list[dict]:
    """
    Extract WebP frames for all selected moments and generate variants.
    Returns moments enriched with file paths and variant info.
    """
    for moment in moments:
        rank = moment["rank"]
        filename = f"f{rank:02d}.webp"
        filepath = os.path.join(work_dir, filename)

        extract_frame(video_url, moment["timestamp"], filepath)

        # Read file info
        with open(filepath, "rb") as f:
            image_data = f.read()

        dims = get_frame_dimensions(filepath)
        moment["filepath"] = filepath
        moment["file_size"] = len(image_data)
        moment["width"] = dims["width"]
        moment["height"] = dims["height"]

        log.info(
            f"  Frame rank {rank}: {dims['width']}x{dims['height']}, "
            f"{len(image_data) / 1024:.0f} KB"
        )

        # Generate variants
        moment["variant_paths"] = generate_variants(filepath, video_id, rank, work_dir)

    return moments


# ---------------------------------------------------------------------------
# 5. Upload to Cloudflare R2
# ---------------------------------------------------------------------------
def get_r2_client():
    """Create boto3 S3 client configured for Cloudflare R2."""
    if not HAS_BOTO3:
        log.warning("boto3 not installed — skipping R2 upload")
        return None

    if not all([R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY]):
        log.warning("R2 credentials not configured — skipping R2 upload")
        return None

    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        region_name="auto",
    )


def upload_to_r2(s3_client, video_id: str, moments: list[dict]) -> dict:
    """
    Upload all frames and variants to R2.
    Returns a dict mapping frame rank → r2_path and r2_variants.
    """
    if not s3_client:
        return {}

    upload_results = {}

    for moment in moments:
        rank = moment["rank"]
        r2_base = f"frames/{video_id}"

        # Upload main frame
        main_key = f"{r2_base}/f{rank:02d}.webp"
        s3_client.upload_file(
            moment["filepath"],
            R2_BUCKET,
            main_key,
            ExtraArgs={
                "ContentType": "image/webp",
                "CacheControl": "public, max-age=86400",
            },
        )
        log.info(f"  Uploaded {main_key}")

        # Upload variants
        variant_keys = {}
        for variant_name, variant_path in moment.get("variant_paths", {}).items():
            variant_key = f"{r2_base}/f{rank:02d}_{variant_name}.webp"
            s3_client.upload_file(
                variant_path,
                R2_BUCKET,
                variant_key,
                ExtraArgs={
                    "ContentType": "image/webp",
                    "CacheControl": "public, max-age=86400",
                },
            )
            variant_keys[variant_name] = variant_key

        upload_results[rank] = {
            "r2_path": main_key,
            "r2_variants": variant_keys,
        }

        log.info(f"  Uploaded {len(variant_keys)} variants for rank {rank}")

    return upload_results


# ---------------------------------------------------------------------------
# 6. Save to Neon (PostgreSQL)
# ---------------------------------------------------------------------------
def save_to_database(
    info: dict,
    moments: list[dict],
    heatmap: list[dict],
    r2_results: dict,
):
    """
    Save video metadata and frame references to Neon PostgreSQL.
    Stores R2 paths (not image bytes) in the frames table.
    """
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL environment variable is required")

    conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    cur = conn.cursor()

    try:
        video_id = info["id"]

        # Parse upload date
        upload_date = None
        if info.get("upload_date"):
            upload_date = datetime.strptime(info["upload_date"], "%Y%m%d").date()

        # Upsert video metadata
        cur.execute(
            """
            INSERT INTO videos (
                video_id, title, channel, channel_id, category,
                duration, view_count, subscriber_count,
                upload_date, heatmap_raw, processed_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (video_id) DO UPDATE SET
                title = EXCLUDED.title,
                channel = EXCLUDED.channel,
                channel_id = EXCLUDED.channel_id,
                category = EXCLUDED.category,
                duration = EXCLUDED.duration,
                view_count = EXCLUDED.view_count,
                subscriber_count = EXCLUDED.subscriber_count,
                heatmap_raw = EXCLUDED.heatmap_raw,
                processed_at = NOW()
            """,
            (
                video_id,
                info.get("title"),
                info.get("channel") or info.get("uploader"),
                info.get("channel_id") or info.get("uploader_id"),
                info.get("categories", [None])[0],
                int(info.get("duration", 0)),
                info.get("view_count"),
                info.get("channel_follower_count"),
                upload_date,
                Json(heatmap),
            ),
        )

        # Delete old frames for this video (re-processing)
        cur.execute("DELETE FROM frames WHERE video_id = %s", (video_id,))

        # Insert new frames with R2 paths
        for moment in moments:
            rank = moment["rank"]
            r2_info = r2_results.get(rank, {})

            cur.execute(
                """
                INSERT INTO frames (
                    video_id, rank, timestamp_sec, heatmap_value,
                    r2_path, r2_variants, width, height, file_size
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    video_id,
                    rank,
                    moment["timestamp"],
                    moment["value"],
                    r2_info.get("r2_path", f"frames/{video_id}/f{rank:02d}.webp"),
                    Json(r2_info.get("r2_variants", {})),
                    moment["width"],
                    moment["height"],
                    moment["file_size"],
                ),
            )

        conn.commit()
        log.info(
            f"Saved {len(moments)} frames for '{info.get('title')}' "
            f"({video_id}) to database"
        )

    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------
def process_video(url: str):
    """Full pipeline: metadata → heatmap → frames → variants → R2 → DB"""

    # Step 1: Get video info with heatmap
    info = get_video_info(url)
    video_id = info.get("id", "unknown")
    title = info.get("title", "Unknown")
    duration = info.get("duration", 0)
    heatmap = info.get("heatmap")

    log.info(f"Video: {title}")
    log.info(f"Duration: {duration}s | ID: {video_id}")

    if not heatmap:
        log.warning(
            "No heatmap data available. "
            "Falling back to evenly-spaced frame extraction..."
        )
        heatmap = [
            {
                "start_time": i * (duration / (NUM_FRAMES + 1)),
                "end_time": (i + 1) * (duration / (NUM_FRAMES + 1)),
                "value": 1.0 - (i * 0.1),
            }
            for i in range(1, NUM_FRAMES + 1)
        ]

    log.info(f"Heatmap segments: {len(heatmap)}")

    # Step 2: Find top moments
    moments = find_top_moments(heatmap, duration)

    # Step 3: Extract frames + generate variants
    direct_url = get_best_video_url(info)

    with tempfile.TemporaryDirectory(prefix="framedle_") as work_dir:
        moments = extract_all_frames(direct_url, moments, video_id, work_dir)

        # Step 4: Upload to R2 (if configured)
        s3_client = get_r2_client()
        r2_results = upload_to_r2(s3_client, video_id, moments)

        # Step 5: Save to database
        save_to_database(info, moments, heatmap, r2_results)

    log.info("Pipeline complete!")


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else VIDEO_URL

    if not url:
        print("Usage: python extract_frames.py <youtube_url_or_id>")
        print("  Or set VIDEO_URL environment variable")
        sys.exit(1)

    if not url.startswith("http"):
        url = f"https://www.youtube.com/watch?v={url}"

    process_video(url)


if __name__ == "__main__":
    main()
