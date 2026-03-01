"""
Unit tests for generate_variants().
Uses real Pillow image operations on tmp_path — no network, no DB, no R2.
"""
import pytest
from pathlib import Path
from extract_frames import generate_variants, VARIANTS, FRAME_WIDTH, WEBP_QUALITY


EXPECTED_VARIANT_NAMES = list(VARIANTS.keys())


class TestGenerateVariantsOutputFiles:
    def test_produces_a_file_for_every_defined_variant(self, sample_image, tmp_path):
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        assert set(paths.keys()) == set(EXPECTED_VARIANT_NAMES)

    def test_all_output_files_exist_on_disk(self, sample_image, tmp_path):
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        for name, path in paths.items():
            assert Path(path).exists(), f"Missing variant file: {name} at {path}"

    def test_output_files_are_not_empty(self, sample_image, tmp_path):
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        for name, path in paths.items():
            assert Path(path).stat().st_size > 0, f"Empty file for variant: {name}"

    def test_output_files_are_webp_format(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        for name, path in paths.items():
            img = Image.open(path)
            assert img.format == "WEBP", f"Variant {name} is {img.format}, expected WEBP"

    def test_filenames_use_rank_prefix(self, sample_image, tmp_path):
        paths = generate_variants(sample_image, video_id="test123", rank=3, work_dir=str(tmp_path))
        for name, path in paths.items():
            assert Path(path).name.startswith("f03_"), (
                f"Expected f03_ prefix for rank 3, got: {Path(path).name}"
            )


class TestGenerateVariantsDimensions:
    def test_thumbnail_variant_has_width_320(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        img = Image.open(paths["thumb"])
        assert img.width == 320

    def test_thumbnail_variant_preserves_aspect_ratio(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        img = Image.open(paths["thumb"])
        assert img.width == 320
        assert img.height == 180

    def test_crop_25_result_is_upscaled_to_frame_width(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        img = Image.open(paths["crop_25"])
        assert img.width == FRAME_WIDTH

    def test_crop_50_result_is_upscaled_to_frame_width(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        img = Image.open(paths["crop_50"])
        assert img.width == FRAME_WIDTH

    def test_fragment_variants_are_quarter_size(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        for frag_key in ("frag_tl", "frag_tr", "frag_bl", "frag_br"):
            img = Image.open(paths[frag_key])
            assert img.width == 640, f"{frag_key} width should be half of 1280"
            assert img.height == 360, f"{frag_key} height should be half of 720"


class TestGenerateVariantsPixelation:
    def test_px8_variant_has_8x8_grid_appearance(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        img = Image.open(paths["px8"])
        px0 = img.getpixel((0, 0))
        block_size = img.width // 8
        px_in_block = img.getpixel((block_size - 1, 0))
        assert px0 == px_in_block, "Pixels within the same block should be identical (NEAREST upscale)"

    def test_all_pixelation_variants_present(self, sample_image, tmp_path):
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        for px in ("px8", "px16", "px32", "px64", "px128"):
            assert px in paths


class TestGenerateVariantsDesaturation:
    def test_desat_variant_has_equal_rgb_channels(self, sample_image, tmp_path):
        from PIL import Image
        paths = generate_variants(sample_image, video_id="test123", rank=1, work_dir=str(tmp_path))
        img = Image.open(paths["desat"]).convert("RGB")
        for x in range(0, min(img.width, 500), 50):
            r, g, b = img.getpixel((x, 0))
            assert r == g == b, f"Pixel at ({x}, 0) is not grayscale: R={r} G={g} B={b}"


class TestGenerateVariantsIdempotency:
    def test_running_twice_produces_identical_file_sizes(self, sample_image, tmp_path):
        import os
        (tmp_path / "a").mkdir(exist_ok=True)
        (tmp_path / "b").mkdir(exist_ok=True)
        paths_a = generate_variants(sample_image, video_id="v1", rank=1, work_dir=str(tmp_path / "a"))
        paths_b = generate_variants(sample_image, video_id="v1", rank=1, work_dir=str(tmp_path / "b"))
        for name in EXPECTED_VARIANT_NAMES:
            size_a = os.path.getsize(paths_a[name])
            size_b = os.path.getsize(paths_b[name])
            assert size_a == size_b, (
                f"Variant {name}: sizes differ between runs ({size_a} vs {size_b})"
            )
