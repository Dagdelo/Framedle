"""
Integration tests for save_to_database().
Requires a real PostgreSQL connection (TEST_DATABASE_URL env var).
Skipped automatically when the database is not available.
"""
import os
import pytest

# Skip this entire module if TEST_DATABASE_URL is not set.
pytestmark = pytest.mark.skipif(
    not os.environ.get("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL not set — skipping DB integration tests",
)


@pytest.fixture
def db_conn():
    import psycopg2
    conn = psycopg2.connect(os.environ["TEST_DATABASE_URL"], sslmode="prefer")
    conn.autocommit = False
    yield conn
    conn.rollback()
    conn.close()


@pytest.fixture
def clean_db(db_conn):
    """Truncate test tables before each test."""
    cur = db_conn.cursor()
    cur.execute("TRUNCATE TABLE frames, videos CASCADE")
    db_conn.commit()
    cur.close()
    yield db_conn


class TestSaveToDatabase:
    def test_inserts_video_row(self, clean_db, minimal_video_info):
        from extract_frames import save_to_database
        moments = [{
            "rank": 1, "timestamp": 45.0, "value": 0.9,
            "width": 1280, "height": 720, "file_size": 50_000,
        }]
        save_to_database(minimal_video_info, moments, heatmap=[], r2_results={})
        cur = clean_db.cursor()
        cur.execute("SELECT video_id, title FROM videos WHERE video_id = %s",
                    (minimal_video_info["id"],))
        row = cur.fetchone()
        assert row is not None
        assert row[0] == minimal_video_info["id"]
        assert row[1] == minimal_video_info["title"]
        cur.close()

    def test_inserts_frame_row_for_each_moment(self, clean_db, minimal_video_info):
        from extract_frames import save_to_database
        moments = [
            {"rank": i, "timestamp": i * 15.0, "value": 1.0 - (i * 0.1),
             "width": 1280, "height": 720, "file_size": 40_000}
            for i in range(1, 4)
        ]
        save_to_database(minimal_video_info, moments, heatmap=[], r2_results={})
        cur = clean_db.cursor()
        cur.execute("SELECT COUNT(*) FROM frames WHERE video_id = %s",
                    (minimal_video_info["id"],))
        count = cur.fetchone()[0]
        assert count == 3
        cur.close()

    def test_upsert_does_not_create_duplicate_video_row(self, clean_db, minimal_video_info):
        from extract_frames import save_to_database
        moments = [{"rank": 1, "timestamp": 30.0, "value": 0.8,
                    "width": 1280, "height": 720, "file_size": 45_000}]
        save_to_database(minimal_video_info, moments, heatmap=[], r2_results={})
        updated_info = {**minimal_video_info, "title": "Updated Title"}
        save_to_database(updated_info, moments, heatmap=[], r2_results={})
        cur = clean_db.cursor()
        cur.execute("SELECT COUNT(*) FROM videos WHERE video_id = %s",
                    (minimal_video_info["id"],))
        count = cur.fetchone()[0]
        assert count == 1, "ON CONFLICT DO UPDATE should not create duplicate rows"
        cur.close()

    def test_upsert_updates_title_on_reprocessing(self, clean_db, minimal_video_info):
        from extract_frames import save_to_database
        moments = [{"rank": 1, "timestamp": 30.0, "value": 0.8,
                    "width": 1280, "height": 720, "file_size": 45_000}]
        save_to_database(minimal_video_info, moments, heatmap=[], r2_results={})
        updated_info = {**minimal_video_info, "title": "Updated Title"}
        save_to_database(updated_info, moments, heatmap=[], r2_results={})
        cur = clean_db.cursor()
        cur.execute("SELECT title FROM videos WHERE video_id = %s",
                    (minimal_video_info["id"],))
        title = cur.fetchone()[0]
        assert title == "Updated Title"
        cur.close()

    def test_reprocessing_replaces_frames_not_duplicates(self, clean_db, minimal_video_info):
        from extract_frames import save_to_database
        moments = [{"rank": 1, "timestamp": 30.0, "value": 0.8,
                    "width": 1280, "height": 720, "file_size": 45_000}]
        save_to_database(minimal_video_info, moments, heatmap=[], r2_results={})
        moments2 = [
            {"rank": 1, "timestamp": 30.0, "value": 0.8,
             "width": 1280, "height": 720, "file_size": 45_000},
            {"rank": 2, "timestamp": 60.0, "value": 0.6,
             "width": 1280, "height": 720, "file_size": 42_000},
        ]
        save_to_database(minimal_video_info, moments2, heatmap=[], r2_results={})
        cur = clean_db.cursor()
        cur.execute("SELECT COUNT(*) FROM frames WHERE video_id = %s",
                    (minimal_video_info["id"],))
        count = cur.fetchone()[0]
        assert count == 2, "Re-processing should replace old frames, not accumulate them"
        cur.close()

    def test_raises_when_database_url_is_missing(self, minimal_video_info, monkeypatch):
        import extract_frames
        monkeypatch.setattr(extract_frames, "DATABASE_URL", None)
        with pytest.raises(RuntimeError, match="DATABASE_URL"):
            extract_frames.save_to_database(minimal_video_info, [], [], {})
