"""
Batch processor: reads video URLs from videos.json and processes each one.
Use this instead of extract_frames.py if you want to process multiple videos.

Usage:
    python extract_batch.py                    # reads from videos.json
    python extract_batch.py --config my.json   # custom config file
"""

import argparse
import json
import logging
import sys
import os

from extract_frames import process_video, NUM_FRAMES, MIN_SPACING_SEC

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
    args = parser.parse_args()

    if not os.path.exists(args.config):
        log.error(f"Config file not found: {args.config}")
        sys.exit(1)

    with open(args.config) as f:
        config = json.load(f)

    videos = config.get("videos", [])
    if not videos:
        log.warning("No videos found in config file")
        sys.exit(0)

    log.info(f"Processing {len(videos)} video(s)...")

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
    log.info(f"\n{'='*60}")
    log.info("BATCH SUMMARY")
    log.info(f"  Success: {len(results['success'])}")
    log.info(f"  Failed:  {len(results['failed'])}")
    for fail in results["failed"]:
        log.info(f"    - {fail['url']}: {fail['error'][:100]}")
    log.info(f"{'='*60}")

    if results["failed"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
