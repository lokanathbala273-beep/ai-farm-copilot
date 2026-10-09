#!/usr/bin/env python3
"""
Phase 1 & Phase 2: Official Kaggle Dataset Downloader (Incremental & Resumable)
===============================================================================
Downloads selected plant disease datasets from Kaggle using the official Kaggle API,
extracts archives into `data/raw/kaggle/<subdir>/`, counts actual downloaded files
and verified images, and updates `data/metadata/dataset_manifest.csv`.

Never fabricates counts, never logs secret keys, and never bypasses access controls.
"""

import argparse
import csv
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path
from typing import Dict, List, Tuple
import requests
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from scripts.discover_datasets import (  # noqa: E402
    CURATED_KAGGLE_DATASETS,
    MANIFEST_PATH,
    RAW_KAGGLE_DIR,
    TARGET_IMAGES,
    ensure_directory_structure,
    get_kaggle_credentials,
    print_auth_setup_instructions,
    write_dataset_manifest,
)

SUPPORTED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def load_manifest() -> List[Dict[str, str]]:
    if not MANIFEST_PATH.exists():
        write_dataset_manifest(CURATED_KAGGLE_DATASETS)
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def verify_and_count_directory(folder: Path) -> Tuple[int, int, int]:
    """
    Walks `folder` and returns (total_files, valid_images, corrupt_images)
    by verifying image headers with Pillow.
    """
    if not folder.exists():
        return 0, 0, 0
    total_files = 0
    valid_images = 0
    corrupt_images = 0
    for root, _, files in os.walk(folder):
        for fname in files:
            if fname == ".gitkeep" or fname.startswith("."):
                continue
            total_files += 1
            fpath = Path(root) / fname
            if fpath.suffix.lower() in SUPPORTED_IMAGE_EXTENSIONS:
                try:
                    with Image.open(fpath) as img:
                        img.verify()
                    valid_images += 1
                except Exception:
                    corrupt_images += 1
    return total_files, valid_images, corrupt_images


import os  # noqa: E402


def download_via_official_kaggle_api(
    dataset_id: str,
    dest_dir: Path,
    username: str,
    key: str,
) -> Tuple[bool, str]:
    """
    Downloads a dataset from the official Kaggle API:
    1. Uses `kaggle datasets download -d <dataset_id> -p <dest_dir> --unzip` if `kaggle` CLI is installed.
    2. Otherwise uses the official Kaggle REST API v1 endpoint:
       GET https://www.kaggle.com/api/v1/datasets/download/<owner>/<slug>
       with HTTP Basic Auth (username, key) and extracts the ZIP archive.
    """
    dest_dir.mkdir(parents=True, exist_ok=True)
    slug_safe = dataset_id.replace("/", "__")
    target_extract_dir = dest_dir / slug_safe
    target_extract_dir.mkdir(parents=True, exist_ok=True)

    kaggle_bin = shutil.which("kaggle")
    if kaggle_bin:
        env = os.environ.copy()
        env["KAGGLE_USERNAME"] = username
        env["KAGGLE_KEY"] = key
        cmd = [kaggle_bin, "datasets", "download", "-d", dataset_id, "-p", str(target_extract_dir), "--unzip"]
        proc = subprocess.run(cmd, env=env, capture_output=True, text=True)
        if proc.returncode == 0:
            return True, f"Downloaded & extracted via Kaggle CLI into {target_extract_dir}"

    # Official Kaggle REST API v1 streaming download
    url = f"https://www.kaggle.com/api/v1/datasets/download/{dataset_id}"
    zip_path = target_extract_dir / f"{slug_safe}.zip"
    try:
        with requests.get(url, auth=(username, key), stream=True, timeout=60) as resp:
            if resp.status_code == 401:
                return False, "HTTP 401 Unauthorized — Invalid Kaggle API credentials."
            if resp.status_code == 403:
                return (
                    False,
                    f"HTTP 403 Forbidden — Dataset '{dataset_id}' requires accepting terms/rules on Kaggle first. "
                    f"Manual URL: https://www.kaggle.com/datasets/{dataset_id}",
                )
            if resp.status_code == 404:
                return (
                    False,
                    f"HTTP 404 Not Found — Dataset '{dataset_id}' is unavailable via API. "
                    f"Manual URL: https://www.kaggle.com/datasets/{dataset_id}",
                )
            if resp.status_code != 200:
                return False, f"HTTP {resp.status_code} returned by Kaggle API for '{dataset_id}'."

            total_bytes = int(resp.headers.get("Content-Length", "0") or "0")
            downloaded_bytes = 0
            chunk_size = 1024 * 1024  # 1 MB chunks
            with open(zip_path, "wb") as out_f:
                for chunk in resp.iter_content(chunk_size=chunk_size):
                    if chunk:
                        out_f.write(chunk)
                        downloaded_bytes += len(chunk)
                        if total_bytes > 0:
                            pct = (downloaded_bytes / total_bytes) * 100
                            sys.stdout.write(
                                f"\r   ↳ Downloading {dataset_id}: {downloaded_bytes / (1024*1024):.1f} / "
                                f"{total_bytes / (1024*1024):.1f} MB ({pct:.1f}%)"
                            )
                            sys.stdout.flush()
            print()

        if not zipfile.is_zipfile(zip_path):
            if zip_path.exists():
                zip_path.unlink()
            return False, f"Downloaded file for '{dataset_id}' is not a valid ZIP archive."

        print(f"   ↳ Extracting {zip_path.name} into {target_extract_dir} ...")
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(target_extract_dir)
        zip_path.unlink()
        return True, f"Successfully downloaded and extracted into {target_extract_dir}"

    except requests.RequestException as exc:
        if zip_path.exists():
            zip_path.unlink()
        return False, f"Network error while downloading '{dataset_id}': {exc.__class__.__name__}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Download Plant Disease Datasets from Kaggle API")
    parser.add_argument(
        "--datasets",
        type=str,
        default=None,
        help="Comma-separated list of Kaggle dataset IDs to download (default: all in manifest until TARGET_IMAGES reached)",
    )
    parser.add_argument(
        "--target-images",
        type=int,
        default=TARGET_IMAGES,
        help=f"Target unique labelled leaf images (default: {TARGET_IMAGES})",
    )
    parser.add_argument(
        "--yes",
        "-y",
        action="store_true",
        help="Skip interactive confirmation prompt before downloading",
    )
    args = parser.parse_args()

    ensure_directory_structure()
    rows = load_manifest()

    username, key, auth_source = get_kaggle_credentials()
    if not username or not key:
        print("\n❌ ERROR: Kaggle API authentication is not configured.")
        print_auth_setup_instructions()
        return 1

    selected_ids = None
    if args.datasets:
        selected_ids = {d.strip() for d in args.datasets.split(",") if d.strip()}

    to_download = [r for r in rows if (not selected_ids or r["dataset_id"] in selected_ids)]
    if not to_download:
        print("No matching datasets found in manifest.")
        return 1

    est_total_mb = sum(int(r.get("approx_size_mb", 0)) for r in to_download)
    est_total_imgs = sum(int(r.get("estimated_unique_images", 0)) for r in to_download)
    _, _, free_b = shutil.disk_usage(PROJECT_ROOT)
    free_gb = free_b / (1024 ** 3)

    print("\n" + "=" * 80)
    print("📥 KAGGLE DATASET DOWNLOAD PLAN")
    print("=" * 80)
    print(f"• Auth Source            : {auth_source} (Key hidden)")
    print(f"• Datasets Selected      : {len(to_download)}")
    print(f"• Estimated Download Size: ~{est_total_mb:,} MB (~{est_total_mb / 1024:.2f} GB)")
    print(f"• Estimated Unique Images: ~{est_total_imgs:,} (Target: {args.target_images:,})")
    print(f"• Available Disk Space   : {free_gb:.2f} GB")
    print("-" * 80)
    for idx, r in enumerate(to_download, 1):
        print(f"  {idx}. {r['dataset_id']} -> data/raw/kaggle/{r['target_subdir']}/ (~{r['approx_size_mb']} MB)")
    print("=" * 80)

    if not args.yes:
        reply = input("\nProceed with downloading these datasets from Kaggle? [y/N]: ").strip().lower()
        if reply not in ("y", "yes"):
            print("Download cancelled by user.")
            return 0

    cumulative_valid_images = 0
    for r in rows:
        if selected_ids and r["dataset_id"] not in selected_ids:
            continue

        ds_id = r["dataset_id"]
        subdir = RAW_KAGGLE_DIR / r["target_subdir"]
        print(f"\n🚀 Processing dataset: {ds_id} ...")

        ok, msg = download_via_official_kaggle_api(ds_id, subdir, username, key)
        print(f"   ↳ Result: {msg}")

        files_cnt, valid_cnt, corrupt_cnt = verify_and_count_directory(subdir)
        r["downloaded_file_count"] = str(files_cnt)
        r["valid_image_count"] = str(valid_cnt)
        r["download_status"] = "DOWNLOADED" if ok and valid_cnt > 0 else f"FAILED: {msg[:80]}"
        write_dataset_manifest(rows)

        cumulative_valid_images = sum(int(item.get("valid_image_count", 0)) for item in rows)
        print(f"   ↳ Verified valid images in '{r['target_subdir']}': {valid_cnt:,} (Corrupt skipped: {corrupt_cnt})")

        if not selected_ids and cumulative_valid_images >= args.target_images:
            print(f"\n✅ Reached target image threshold ({cumulative_valid_images:,} >= {args.target_images:,}).")
            break

    print("\n" + "=" * 80)
    print(f"📊 DOWNLOAD SUMMARY: {cumulative_valid_images:,} valid raw images on disk.")
    print(f"Next step: run `python scripts/prepare_dataset.py` to deduplicate and split.")
    print("=" * 80)
    return 0


if __name__ == "__main__":
    sys.exit(main())
