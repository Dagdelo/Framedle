"""
Unit tests for find_top_moments().
No network, no filesystem, no database — pure function.
"""
import pytest
from extract_frames import find_top_moments, NUM_FRAMES, MIN_SPACING_SEC


class TestFindTopMomentsBasicSelection:
    def test_returns_exactly_num_frames_when_enough_segments(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0)
        assert len(result) == NUM_FRAMES

    def test_returns_fewer_when_not_enough_spaced_segments(self, tightly_packed_heatmap):
        result = find_top_moments(tightly_packed_heatmap, duration=60.0, min_spacing=10.0)
        assert len(result) < NUM_FRAMES

    def test_returns_all_segments_when_fewer_than_num_frames(self, sparse_heatmap):
        result = find_top_moments(sparse_heatmap, duration=180.0)
        assert len(result) <= 3

    def test_raises_on_empty_heatmap(self):
        with pytest.raises(ValueError, match="empty or unavailable"):
            find_top_moments([], duration=300.0)


class TestFindTopMomentsSpacingEnforcement:
    def test_no_two_selected_moments_closer_than_min_spacing(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0, min_spacing=10.0)
        timestamps = [m["timestamp"] for m in result]
        for i in range(len(timestamps)):
            for j in range(i + 1, len(timestamps)):
                diff = abs(timestamps[i] - timestamps[j])
                assert diff >= MIN_SPACING_SEC, (
                    f"Moments at {timestamps[i]:.1f}s and {timestamps[j]:.1f}s "
                    f"are only {diff:.1f}s apart (min={MIN_SPACING_SEC}s)"
                )

    def test_custom_min_spacing_is_respected(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0, min_spacing=20.0)
        timestamps = [m["timestamp"] for m in result]
        for i in range(len(timestamps)):
            for j in range(i + 1, len(timestamps)):
                assert abs(timestamps[i] - timestamps[j]) >= 20.0


class TestFindTopMomentsTimestampClamping:
    def test_timestamp_is_never_below_0_5_seconds(self):
        heatmap = [{"start_time": 0.0, "end_time": 0.5, "value": 0.95}]
        result = find_top_moments(heatmap, duration=300.0, n=1)
        assert result[0]["timestamp"] >= 0.5

    def test_timestamp_is_never_within_0_5_seconds_of_end(self):
        duration = 100.0
        heatmap = [{"start_time": 99.0, "end_time": 100.0, "value": 0.95}]
        result = find_top_moments(heatmap, duration=duration, n=1)
        assert result[0]["timestamp"] <= duration - 0.5


class TestFindTopMomentsOutputShape:
    def test_each_result_has_required_keys(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0)
        required_keys = {"timestamp", "value", "start_time", "end_time", "rank"}
        for moment in result:
            assert required_keys.issubset(moment.keys()), (
                f"Missing keys: {required_keys - moment.keys()}"
            )

    def test_ranks_are_assigned_sequentially_from_1(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0)
        ranks = [m["rank"] for m in result]
        assert ranks == list(range(1, len(result) + 1))

    def test_rank_1_has_highest_heat_value(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0)
        values = [m["value"] for m in result]
        assert values[0] == max(values)

    def test_values_decrease_monotonically_by_rank(self, sample_heatmap):
        result = find_top_moments(sample_heatmap, duration=120.0)
        values = [m["value"] for m in result]
        for i in range(len(values) - 1):
            assert values[i] >= values[i + 1]

    def test_all_timestamps_are_within_video_duration(self, sample_heatmap):
        duration = 120.0
        result = find_top_moments(sample_heatmap, duration=duration)
        for moment in result:
            assert 0 <= moment["timestamp"] <= duration

    def test_deterministic_given_same_inputs(self, sample_heatmap):
        result_a = find_top_moments(sample_heatmap, duration=120.0)
        result_b = find_top_moments(sample_heatmap, duration=120.0)
        assert [m["timestamp"] for m in result_a] == [m["timestamp"] for m in result_b]

    def test_selects_segment_midpoint_as_timestamp(self):
        heatmap = [{"start_time": 10.0, "end_time": 20.0, "value": 1.0}]
        result = find_top_moments(heatmap, duration=300.0, n=1)
        assert result[0]["timestamp"] == 15.0
