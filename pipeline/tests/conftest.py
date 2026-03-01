"""
Shared fixtures for all pipeline tests.
"""
import pytest
from pathlib import Path
from unittest.mock import MagicMock
import sys

# Make pipeline/ importable from the tests/ subdirectory.
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def sample_heatmap():
    """
    Deterministic heatmap fixture with 10 segments.
    Segment values decrease linearly so the selection order is predictable.
    Timestamps are spaced 12 seconds apart, safely above MIN_SPACING_SEC=10.
    """
    return [
        {"start_time": i * 12.0, "end_time": (i + 1) * 12.0, "value": 1.0 - (i * 0.08)}
        for i in range(10)
    ]


@pytest.fixture
def sparse_heatmap():
    """
    Only 3 segments — tests behavior when fewer segments than NUM_FRAMES exist.
    """
    return [
        {"start_time": 0.0, "end_time": 30.0, "value": 0.9},
        {"start_time": 60.0, "end_time": 90.0, "value": 0.6},
        {"start_time": 120.0, "end_time": 150.0, "value": 0.3},
    ]


@pytest.fixture
def tightly_packed_heatmap():
    """
    All segments within 5 seconds of each other — tests min_spacing enforcement.
    """
    return [
        {"start_time": i * 3.0, "end_time": (i + 1) * 3.0, "value": 1.0 - (i * 0.05)}
        for i in range(20)
    ]


@pytest.fixture
def sample_image(tmp_path):
    """
    Creates a real 1280x720 JPEG image at tmp_path for variant generation tests.
    Uses Pillow directly — no network required.
    """
    from PIL import Image
    img = Image.new("RGB", (1280, 720), color=(100, 150, 200))
    for x in range(0, 1280, 64):
        for y in range(0, 720, 64):
            img.putpixel((x, y), (x % 255, y % 255, (x + y) % 255))
    path = tmp_path / "f01.webp"
    img.save(str(path), "WEBP", quality=80)
    return str(path)


@pytest.fixture
def mock_db_conn():
    """
    Returns a mock psycopg2 connection + cursor pair.
    Used to test save_to_database without a real PostgreSQL server.
    """
    conn = MagicMock()
    cur = MagicMock()
    conn.cursor.return_value = cur
    return conn, cur


@pytest.fixture
def minimal_video_info():
    """Minimal yt-dlp info dict for testing save_to_database."""
    return {
        "id": "test-abc123",
        "title": "Test Video Title",
        "channel": "Test Channel",
        "channel_id": "UC_testchannel",
        "categories": ["Gaming"],
        "duration": 300,
        "view_count": 100_000,
        "channel_follower_count": 50_000,
        "upload_date": "20240101",
    }
