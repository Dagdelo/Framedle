"""
Batch processor: reads video URLs from videos.json and processes each one.
Generates frames, variants, uploads to R2, and catalogs in Neon.

Usage:
    python extract_batch.py                    # reads from videos.json
    python extract_batch.py --config my.json   # custom config file
    python extract_batch.py --urls "url1,url2" # comma-separated URLs
"""

import argparse
import json
import logging
import sys
import os
import time

from extract_frames import process_video

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Batch YouTube heatmap frame extractor")
    parser.add_argument(
        "--config", default="videos.json", help="Path to config JSON file"
    )
    parser.add_argument(
        "--urls", default=None, help="Comma-separated YouTube URLs (overrides config)"
    )
    args = parser.parse_args()

    # Determine video list
    if args.urls:
        videos = [u.strip() for u in args.urls.split(",") if u.strip()]
    elif os.path.exists(args.config):
        with open(args.config) as f:
            config = json.load(f)
        videos = config.get("videos", [])
    else:
        log.error(f"Config file not found: {args.config}")
        sys.exit(1)

    if not videos:
        log.warning("No videos to process")
        sys.exit(0)

    log.info(f"Processing {len(videos)} video(s)...")
    start_time = time.time()

    results = {"success": [], "failed": []}

    for i, url in enumerate(videos, 1):
        log.info(f"\n{'='*60}")
        log.info(f"Video {i}/{len(videos)}: {url}")
        log.info(f"{'='*60}")

        try:
            process_video(url)
            results["success"].append(url)
        except Exception as e:
            log.error(f"Failed to process {url}: {e}")
            results["failed"].append({"url": url, "error": str(e)})

    # Summary
    elapsed = time.time() - start_time
    log.info(f"\n{'='*60}")
    log.info("BATCH SUMMARY")
    log.info(f"  Total:   {len(videos)}")
    log.info(f"  Success: {len(results['success'])}")
    log.info(f"  Failed:  {len(results['failed'])}")
    log.info(f"  Time:    {elapsed:.1f}s ({elapsed/len(videos):.1f}s/video)")

    for fail in results["failed"]:
        log.error(f"  FAILED: {fail['url']}: {fail['error'][:200]}")

    log.info(f"{'='*60}")

    if results["failed"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
