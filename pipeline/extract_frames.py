"""
YouTube Heatmap Frame Extractor
================================
Extracts the top 6 most replayed moments from a YouTube video
using yt-dlp's heatmap data, captures frames with ffmpeg,
and stores them in Neon (PostgreSQL).

Usage:
    python extract_frames.py <youtube_url_or_id>
    
    # Or via environment variable:
    VIDEO_URL=https://www.youtube.com/watch?v=dQw4w9WgXcQ python extract_frames.py
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

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
NUM_FRAMES = 6
MIN_SPACING_SEC = 10          # minimum seconds between selected peaks
FRAME_QUALITY = 2             # ffmpeg -q:v (1=best, 31=worst)
JPEG_WIDTH = 1280             # resize width (keep aspect ratio)

DATABASE_URL = os.environ.get("DATABASE_URL")
VIDEO_URL = os.environ.get("VIDEO_URL")

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
        # Ensure we get the heatmap data
        "extractor_args": {"youtube": {"player_client": ["web"]}},
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
    Finds the top N heatmap peaks with minimum spacing between them.
    
    The heatmap from yt-dlp is a list of dicts:
        [{"start_time": 0.0, "end_time": 2.48, "value": 0.85}, ...]
    
    Each segment is ~2.48 seconds (YouTube divides videos into ~100 segments).
    `value` ranges from 0.0 to 1.0 (1.0 = most replayed).
    
    Strategy:
        - Sort all segments by heat value descending
        - Greedily pick the top segments, skipping any that are 
          too close to an already-selected segment
        - This ensures spatial diversity in the selected frames
    """
    if not heatmap:
        raise ValueError("Heatmap data is empty or unavailable for this video")

    # Sort by value descending (most replayed first)
    sorted_segments = sorted(heatmap, key=lambda s: s["value"], reverse=True)

    selected = []
    for segment in sorted_segments:
        if len(selected) >= n:
            break

        # Use midpoint of the segment as the target timestamp
        mid_time = (segment["start_time"] + segment["end_time"]) / 2

        # Clamp to valid range (avoid exact start/end of video)
        mid_time = max(0.5, min(mid_time, duration - 0.5))

        # Check minimum spacing against already selected timestamps
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

    # Sort by timestamp for chronological order, then assign rank by value
    selected.sort(key=lambda s: s["value"], reverse=True)
    for i, s in enumerate(selected):
        s["rank"] = i + 1

    log.info(f"Selected {len(selected)} peak moments:")
    for s in selected:
        log.info(
            f"  Rank {s['rank']}: {s['timestamp']:.1f}s "
            f"(heat={s['value']:.3f})"
        )

    return selected


# ---------------------------------------------------------------------------
# 3. Extract frames from video using ffmpeg
# ---------------------------------------------------------------------------
def extract_frame(video_url: str, timestamp: float, output_path: str) -> str:
    """
    Extracts a single frame at the given timestamp using ffmpeg.
    
    Uses the video URL directly (ffmpeg can handle YouTube URLs via 
    yt-dlp's extracted direct URL), avoiding full video download.
    """
    cmd = [
        "ffmpeg",
        "-ss", str(timestamp),
        "-i", video_url,
        "-vframes", "1",
        "-q:v", str(FRAME_QUALITY),
        "-vf", f"scale={JPEG_WIDTH}:-1",
        "-y",  # overwrite
        output_path,
    ]

    log.info(f"Extracting frame at {timestamp:.1f}s")
    result = subprocess.run(
        cmd, capture_output=True, text=True, timeout=60
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"ffmpeg failed at {timestamp}s: {result.stderr[-500:]}"
        )

    return output_path


def get_best_video_url(info: dict) -> str:
    """
    Gets the best direct video URL from yt-dlp info.
    Prefers a format with both video+audio, falls back to video-only.
    """
    formats = info.get("formats", [])
    
    # Try to find a reasonable quality mp4 with video
    best = None
    for f in formats:
        if f.get("vcodec", "none") == "none":
            continue  # skip audio-only
        if f.get("url"):
            # Prefer ~720p for reasonable file size
            height = f.get("height") or 0
            if best is None or (
                abs(height - 720) < abs((best.get("height") or 0) - 720)
            ):
                best = f

    if not best:
        # Fallback to the default URL
        url = info.get("url")
        if url:
            return url
        raise RuntimeError("No suitable video URL found")

    return best["url"]


def extract_all_frames(
    video_url: str, moments: list[dict], work_dir: str
) -> list[dict]:
    """
    Extracts JPEG frames for all selected moments.
    Returns the moments list enriched with file paths and image data.
    """
    for moment in moments:
        filename = f"frame_rank{moment['rank']}_{moment['timestamp']:.0f}s.jpg"
        filepath = os.path.join(work_dir, filename)

        extract_frame(video_url, moment["timestamp"], filepath)

        # Read the image bytes
        with open(filepath, "rb") as f:
            image_data = f.read()

        # Get dimensions via ffprobe
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

        moment["image_data"] = image_data
        moment["file_size"] = len(image_data)
        moment["width"] = dims["width"]
        moment["height"] = dims["height"]
        moment["filepath"] = filepath

        log.info(
            f"  Frame rank {moment['rank']}: "
            f"{dims['width']}x{dims['height']}, "
            f"{len(image_data) / 1024:.0f} KB"
        )

    return moments


# ---------------------------------------------------------------------------
# 4. Save to Neon (PostgreSQL)
# ---------------------------------------------------------------------------
def save_to_database(info: dict, moments: list[dict], heatmap: list[dict]):
    """
    Saves video metadata and extracted frames to Neon PostgreSQL.
    Uses UPSERT to handle re-processing the same video.
    """
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL environment variable is required")

    conn = psycopg2.connect(DATABASE_URL, sslmode="require")
    cur = conn.cursor()

    try:
        video_id = info["id"]

        # Upsert video metadata
        cur.execute(
            """
            INSERT INTO videos (video_id, title, channel, duration, view_count, upload_date, heatmap_raw, processed_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (video_id) DO UPDATE SET
                title = EXCLUDED.title,
                channel = EXCLUDED.channel,
                duration = EXCLUDED.duration,
                view_count = EXCLUDED.view_count,
                heatmap_raw = EXCLUDED.heatmap_raw,
                processed_at = NOW()
            """,
            (
                video_id,
                info.get("title"),
                info.get("channel") or info.get("uploader"),
                int(info.get("duration", 0)),
                info.get("view_count"),
                (
                    datetime.strptime(info["upload_date"], "%Y%m%d").date()
                    if info.get("upload_date")
                    else None
                ),
                Json(heatmap),
            ),
        )

        # Delete old frames for this video (re-processing)
        cur.execute("DELETE FROM frames WHERE video_id = %s", (video_id,))

        # Insert new frames
        for moment in moments:
            cur.execute(
                """
                INSERT INTO frames (video_id, rank, timestamp_sec, heatmap_value, image_data, width, height, file_size)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    video_id,
                    moment["rank"],
                    moment["timestamp"],
                    moment["value"],
                    psycopg2.Binary(moment["image_data"]),
                    moment["width"],
                    moment["height"],
                    moment["file_size"],
                ),
            )

        conn.commit()
        log.info(
            f"Saved {len(moments)} frames for video '{info.get('title')}' "
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
    """Full pipeline: metadata → heatmap analysis → frame extraction → DB save"""

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
            "No heatmap data available for this video. "
            "Heatmap requires sufficient views and is not available for all videos."
        )
        # Fallback: evenly space frames across the video
        log.info("Falling back to evenly-spaced frame extraction...")
        heatmap = [
            {
                "start_time": i * (duration / (NUM_FRAMES + 1)),
                "end_time": (i + 1) * (duration / (NUM_FRAMES + 1)),
                "value": 1.0 - (i * 0.1),  # synthetic descending values
            }
            for i in range(1, NUM_FRAMES + 1)
        ]

    log.info(f"Heatmap segments: {len(heatmap)}")

    # Step 2: Find top moments
    moments = find_top_moments(heatmap, duration)

    # Step 3: Extract frames
    direct_url = get_best_video_url(info)

    with tempfile.TemporaryDirectory(prefix="yt_frames_") as work_dir:
        moments = extract_all_frames(direct_url, moments, work_dir)

        # Step 4: Save to database
        save_to_database(info, moments, heatmap)

    log.info("Pipeline complete!")


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else VIDEO_URL

    if not url:
        print("Usage: python extract_frames.py <youtube_url_or_id>")
        print("  Or set VIDEO_URL environment variable")
        sys.exit(1)

    # Normalize: if it's just an ID, make it a full URL
    if not url.startswith("http"):
        url = f"https://www.youtube.com/watch?v={url}"

    process_video(url)


if __name__ == "__main__":
    main()
