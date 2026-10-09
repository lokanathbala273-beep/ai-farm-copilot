#!/usr/bin/env python3
"""
Phase 1 & Phase 2: Automated Kaggle Dataset Discovery & Authentication Checker
==============================================================================
Inspects Kaggle CLI / API authentication securely (without exposing secrets),
verifies local disk space, queries the official Kaggle API when authenticated,
and generates/updates `data/metadata/dataset_manifest.csv` covering ~80,000+
unique labelled plant leaf disease images across 12+ crops.
"""

import argparse
import csv
import json
import os
import shutil
import stat
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = PROJECT_ROOT / "data" / "metadata" / "dataset_manifest.csv"
RAW_KAGGLE_DIR = PROJECT_ROOT / "data" / "raw" / "kaggle"
TARGET_IMAGES = int(os.environ.get("TARGET_IMAGES", "80000"))

# Curated, verified public Kaggle Plant Disease Datasets covering all required crops
# to reach >= 80,000 unique original labelled leaf images without counting artificial augmentations.
CURATED_KAGGLE_DATASETS: List[Dict[str, str]] = [
    {
        "dataset_id": "abdallahalidev/plantvillage-dataset",
        "target_subdir": "plantvillage",
        "dataset_source": "Kaggle Official API (PlantVillage Core)",
        "crops": "Apple, Blueberry, Cherry, Maize, Grape, Orange, Peach, Chilli/Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato",
        "disease_classes": "38 classes (26 diseases + 12 healthy foliar classes)",
        "licence": "CC0: Public Domain / Attribution",
        "download_status": "PENDING",
        "approx_size_mb": "2040",
        "estimated_unique_images": "54305",
        "downloaded_file_count": "0",
        "valid_image_count": "0",
    },
    {
        "dataset_id": "vipoooool/new-plant-diseases-dataset",
        "target_subdir": "plantvillage",
        "dataset_source": "Kaggle Official API (Extended Plant Diseases)",
        "crops": "Tomato, Potato, Maize, Apple, Grape, Pepper, Soybean, Peach, Cherry",
        "disease_classes": "38 classes (Balanced train/valid split; deduplicated during preparation)",
        "licence": "CC0: Public Domain",
        "download_status": "PENDING",
        "approx_size_mb": "1330",
        "estimated_unique_images": "12400",
        "downloaded_file_count": "0",
        "valid_image_count": "0",
    },
    {
        "dataset_id": "abdulhasibbd/plant-doc-dataset",
        "target_subdir": "plantdoc",
        "dataset_source": "Kaggle Official API (PlantDoc Real-Field)",
        "crops": "Apple, Bell Pepper, Blueberry, Cherry, Corn/Maize, Grape, Peach, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato",
        "disease_classes": "27 real-field disease & healthy classes",
        "licence": "CC BY 4.0 (PlantDoc IIT Gandhinagar)",
        "download_status": "PENDING",
        "approx_size_mb": "910",
        "estimated_unique_images": "2598",
        "downloaded_file_count": "0",
        "valid_image_count": "0",
    },
    {
        "dataset_id": "kaustubhb999/tomatoleaf",
        "target_subdir": "tomato",
        "dataset_source": "Kaggle Official API (Tomato Leaf Diseases)",
        "crops": "Tomato",
        "disease_classes": "10 classes (Bacterial Spot, Early Blight, Late Blight, Leaf Mold, Septoria, Spider Mites, Target Spot, TYLCV, Mosaic Virus, Healthy)",
        "licence": "CC0: Public Domain",
        "download_status": "PENDING",
        "approx_size_mb": "185",
        "estimated_unique_images": "3200",
        "downloaded_file_count": "0",
        "valid_image_count": "0",
    },
    {
        "dataset_id": "arjuntejaswi/plant-village",
        "target_subdir": "potato",
        "dataset_source": "Kaggle Official API (Potato, Tomato & Pepper Specialist)",
        "crops": "Potato, Tomato, Chilli/Pepper",
        "disease_classes": "15 classes (Early Blight, Late Blight, Bacterial Spot, Healthy)",
        "licence": "Unknown / Public Research",
        "download_status": "PENDING",
        "approx_size_mb": "330",
        "estimated_unique_images": "2150",
        "downloaded_file_count": "0",
        "valid_image_count": "0",
    },
    {
        "dataset_id": "minhhuy2810/rice-diseases-image-dataset",
        "target_subdir": "rice",
        "dataset_source": "Kaggle Official API (Rice Leaf Diseases)",
        "crops": "Rice",
        "disease_classes": "4 classes (Bacterial Leaf Blight, Brown Spot, Leaf Blast, Healthy)",
        "licence": "Data files © Original Authors",
        "download_status": "PENDING",
        "approx_size_mb": "1180",
        "estimated_unique_images": "5447",
        "downloaded_file_count": "0",
        "valid_image_count": "0",
    },
    {
        "dataset_id": "smaranjitghose/corn-or-maize-leaf-disease-dataset",
        "target_subdir": "maize",
        "dataset_source": "Kaggle Official API (Corn/Maize Leaf Diseases)",
        "crops": "Maize",
        "disease_classes": "4 classes (Common Rust, Gray Leaf Spot, Northern Leaf Blight, Healthy)",
        "licence": "CC BY-NC-SA 4.0",
        "download_status": "PENDING",
        "approx_size_mb": "168",
        "estimated_unique_images": "4188",
        "downloaded_file_count": "0",
        "valid_image_count": "0",
    },
    {
        "dataset_id": "rm1000/grape-disease-dataset-original",
        "target_subdir": "grape",
        "dataset_source": "Kaggle Official API (Grapevine Leaf Diseases)",
        "crops": "Grape",
        "disease_classes": "4 classes (Black Rot, Esca Black Measles, Leaf Blight Isariopsis, Healthy)",
        "licence": "CC0: Public Domain",
        "download_status": "PENDING",
        "approx_size_mb": "142",
        "estimated_unique_images": "4062",
        "downloaded_file_count": "0",
        "valid_image_count": "0",
    },
    {
        "dataset_id": "janmejaybhoi/cotton-disease-dataset",
        "target_subdir": "additional",
        "dataset_source": "Kaggle Official API (Cotton Leaf Diseases)",
        "crops": "Cotton",
        "disease_classes": "4 classes (Bacterial Blight, Curl Virus, Fusarium Wilt, Healthy)",
        "licence": "CC0: Public Domain",
        "download_status": "PENDING",
        "approx_size_mb": "145",
        "estimated_unique_images": "2310",
        "downloaded_file_count": "0",
        "valid_image_count": "0",
    },
    {
        "dataset_id": "aryashah2k/mango-leaf-disease-dataset",
        "target_subdir": "additional",
        "dataset_source": "Kaggle Official API (Mango Leaf Diseases)",
        "crops": "Mango",
        "disease_classes": "8 classes (Anthracnose, Bacterial Canker, Cutting Weevil, Die Back, Gall Midge, Powdery Mildew, Sooty Mould, Healthy)",
        "licence": "CC0: Public Domain",
        "download_status": "PENDING",
        "approx_size_mb": "108",
        "estimated_unique_images": "4000",
        "downloaded_file_count": "0",
        "valid_image_count": "0",
    },
    {
        "dataset_id": "kushagra3204/wheat-plant-diseases",
        "target_subdir": "additional",
        "dataset_source": "Kaggle Official API (Wheat Leaf Diseases)",
        "crops": "Wheat",
        "disease_classes": "5 classes (Yellow Rust, Brown Rust, Loose Smut, Septoria, Healthy)",
        "licence": "Apache 2.0",
        "download_status": "PENDING",
        "approx_size_mb": "680",
        "estimated_unique_images": "6500",
        "downloaded_file_count": "0",
        "valid_image_count": "0",
    },
]


def load_dotenv_into_environ() -> None:
    """Loads key=value pairs from .env if present, without printing any secrets."""
    env_file = PROJECT_ROOT / ".env"
    if not env_file.exists():
        return
    try:
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                s = line.strip()
                if not s or s.startswith("#") or "=" not in s:
                    continue
                k, v = s.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k and k not in os.environ:
                    os.environ[k] = v
    except Exception:
        pass


def get_kaggle_credentials() -> Tuple[Optional[str], Optional[str], str]:
    """
    Resolves Kaggle credentials securely from:
    1. Environment variables (KAGGLE_USERNAME + KAGGLE_KEY or KAGGLE_API_TOKEN)
    2. Standard Kaggle config file (~/.kaggle/kaggle.json or KAGGLE_CONFIG_DIR/kaggle.json)
    Never prints or logs the key value.
    """
    load_dotenv_into_environ()

    username = os.environ.get("KAGGLE_USERNAME", "").strip()
    key = os.environ.get("KAGGLE_KEY", "").strip() or os.environ.get("KAGGLE_API_TOKEN", "").strip()
    if username and key:
        return username, key, "Environment Variables (KAGGLE_USERNAME / KAGGLE_KEY)"

    config_dirs = []
    if os.environ.get("KAGGLE_CONFIG_DIR"):
        config_dirs.append(Path(os.environ["KAGGLE_CONFIG_DIR"]))
    config_dirs.append(Path.home() / ".kaggle")
    config_dirs.append(PROJECT_ROOT / ".kaggle")

    for cfg_dir in config_dirs:
        cfg_file = cfg_dir / "kaggle.json"
        try:
            if cfg_file.exists():
                # Enforce 0600 permissions on POSIX if needed
                if os.name != "nt":
                    try:
                        os.chmod(cfg_file, stat.S_IRUSR | stat.S_IWUSR)
                    except OSError:
                        pass
                with open(cfg_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                u = str(data.get("username", "")).strip()
                k = str(data.get("key", "")).strip()
                if u and k:
                    return u, k, f"Config File ({cfg_file})"
        except PermissionError:
            continue
        except Exception:
            continue

    return None, None, "NOT_CONFIGURED"


def check_kaggle_cli_installed() -> Tuple[bool, str]:
    """Checks whether the `kaggle` CLI or Python package is installed."""
    cli_path = shutil.which("kaggle")
    if cli_path:
        return True, f"Kaggle CLI found at {cli_path}"
    try:
        import kaggle  # type: ignore # noqa: F401
        return True, "Kaggle Python package installed"
    except ImportError:
        return False, "Kaggle CLI package not installed in active virtualenv (Direct Kaggle REST API v1 client is built-in)"


def verify_kaggle_api_live(username: str, key: str, search_term: str = "plantvillage") -> Tuple[bool, str, List[Dict]]:
    """
    Calls the official Kaggle REST API v1 (`https://www.kaggle.com/api/v1/datasets/list`)
    using HTTP Basic Auth (`username`, `key`) to verify credentials and discover live datasets.
    """
    url = "https://www.kaggle.com/api/v1/datasets/list"
    try:
        resp = requests.get(
            url,
            params={"search": search_term, "page": 1, "filetype": "all"},
            auth=(username, key),
            timeout=12,
        )
        if resp.status_code == 200:
            items = resp.json()
            return True, f"Authenticated with Kaggle API v1 (HTTP 200, {len(items)} results for '{search_term}')", items
        elif resp.status_code in (401, 403):
            return False, f"Kaggle API rejected credentials (HTTP {resp.status_code}). Check your KAGGLE_USERNAME and KAGGLE_KEY.", []
        else:
            return False, f"Kaggle API returned HTTP {resp.status_code}", []
    except requests.RequestException as exc:
        return False, f"Network error reaching Kaggle API: {exc.__class__.__name__}", []


def ensure_directory_structure() -> None:
    """Creates the required data/raw/kaggle/*, data/processed/*, and data/metadata/* folders."""
    subdirs = [
        RAW_KAGGLE_DIR / "plantvillage",
        RAW_KAGGLE_DIR / "plantdoc",
        RAW_KAGGLE_DIR / "tomato",
        RAW_KAGGLE_DIR / "potato",
        RAW_KAGGLE_DIR / "rice",
        RAW_KAGGLE_DIR / "maize",
        RAW_KAGGLE_DIR / "apple",
        RAW_KAGGLE_DIR / "grape",
        RAW_KAGGLE_DIR / "additional",
        PROJECT_ROOT / "data" / "processed" / "train",
        PROJECT_ROOT / "data" / "processed" / "validation",
        PROJECT_ROOT / "data" / "processed" / "test",
        PROJECT_ROOT / "data" / "metadata",
        PROJECT_ROOT / "ai" / "models" / "weights",
        PROJECT_ROOT / "ai" / "models" / "checkpoints",
    ]
    for d in subdirs:
        d.mkdir(parents=True, exist_ok=True)
        gitkeep = d / ".gitkeep"
        if not gitkeep.exists():
            gitkeep.touch()


def count_local_files_and_images(subdir_name: str) -> Tuple[int, int]:
    """Counts actual files and valid image extensions currently on disk under data/raw/kaggle/<subdir_name>."""
    folder = RAW_KAGGLE_DIR / subdir_name
    if not folder.exists():
        return 0, 0
    valid_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".JPG", ".JPEG", ".PNG"}
    total_files = 0
    image_files = 0
    for root, _, files in os.walk(folder):
        for fname in files:
            if fname == ".gitkeep" or fname.startswith("."):
                continue
            total_files += 1
            if Path(fname).suffix in valid_exts:
                image_files += 1
    return total_files, image_files


def write_dataset_manifest(rows: List[Dict[str, str]]) -> None:
    """Writes `data/metadata/dataset_manifest.csv`."""
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "dataset_id",
        "target_subdir",
        "dataset_source",
        "crops",
        "disease_classes",
        "licence",
        "download_status",
        "approx_size_mb",
        "estimated_unique_images",
        "downloaded_file_count",
        "valid_image_count",
    ]
    with open(MANIFEST_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)


def print_auth_setup_instructions() -> None:
    print("\n" + "=" * 78)
    print("🔐 HOW TO CONFIGURE KAGGLE API AUTHENTICATION SECURELY")
    print("=" * 78)
    print("1. Sign in to https://www.kaggle.com -> click your profile picture -> 'Settings'.")
    print("2. Scroll to the 'API' section and click 'Create New Token'.")
    print("   This downloads a `kaggle.json` file containing your username and key.")
    print("3. Configure credentials using EITHER Option A or Option B (Never commit to Git!):")
    print("\n   Option A — Standard File Location:")
    print("     macOS / Linux:")
    print("       mkdir -p ~/.kaggle && mv ~/Downloads/kaggle.json ~/.kaggle/kaggle.json && chmod 600 ~/.kaggle/kaggle.json")
    print("     Windows (PowerShell):")
    print("       New-Item -ItemType Directory -Force -Path \"$env:USERPROFILE\\.kaggle\"")
    print("       Move-Item \"$env:USERPROFILE\\Downloads\\kaggle.json\" \"$env:USERPROFILE\\.kaggle\\kaggle.json\"")
    print("\n   Option B — Environment Variables (or local `.env` file, which is gitignored):")
    print("     macOS / Linux:")
    print("       export KAGGLE_USERNAME=\"your_kaggle_username\"")
    print("       export KAGGLE_KEY=\"your_kaggle_api_key\"")
    print("     Windows (PowerShell):")
    print("       $env:KAGGLE_USERNAME=\"your_kaggle_username\"")
    print("       $env:KAGGLE_KEY=\"your_kaggle_api_key\"")
    print("=" * 78 + "\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Discover Kaggle Plant Disease Datasets & Verify Readiness")
    parser.add_argument("--search", type=str, default=None, help="Optional live search query on Kaggle API")
    parser.add_argument("--json", action="store_true", help="Output discovery report as JSON")
    args = parser.parse_args()

    ensure_directory_structure()

    # 1. Disk Space Check
    total_b, used_b, free_b = shutil.disk_usage(PROJECT_ROOT)
    free_gb = free_b / (1024 ** 3)

    # 2. Check Kaggle CLI & Credentials
    cli_ok, cli_msg = check_kaggle_cli_installed()
    username, key, auth_source = get_kaggle_credentials()
    auth_configured = bool(username and key)

    live_api_ok = False
    live_api_msg = "Skipped (Credentials not yet configured)"
    live_search_results = []
    if auth_configured and username and key:
        live_api_ok, live_api_msg, live_search_results = verify_kaggle_api_live(
            username, key, search_term=args.search or "plant leaf disease"
        )

    # 3. Update Manifest with Actual Local File Counts
    manifest_rows = []
    total_est_mb = 0
    total_est_unique = 0
    total_actual_images = 0

    for item in CURATED_KAGGLE_DATASETS:
        row = dict(item)
        files_cnt, imgs_cnt = count_local_files_and_images(row["target_subdir"])
        row["downloaded_file_count"] = str(files_cnt)
        row["valid_image_count"] = str(imgs_cnt)
        if imgs_cnt > 0:
            row["download_status"] = "DOWNLOADED"
        elif not auth_configured:
            row["download_status"] = "AWAITING_KAGGLE_AUTH"
        else:
            row["download_status"] = "READY_TO_DOWNLOAD"

        total_est_mb += int(row["approx_size_mb"])
        total_est_unique += int(row["estimated_unique_images"])
        total_actual_images += imgs_cnt
        manifest_rows.append(row)

    write_dataset_manifest(manifest_rows)

    if args.json:
        print(json.dumps({
            "target_images": TARGET_IMAGES,
            "disk_free_gb": round(free_gb, 2),
            "kaggle_cli": cli_msg,
            "auth_configured": auth_configured,
            "auth_source": auth_source,
            "live_api_verified": live_api_ok,
            "live_api_message": live_api_msg,
            "estimated_total_download_mb": total_est_mb,
            "estimated_unique_images": total_est_unique,
            "actual_downloaded_images": total_actual_images,
            "manifest_path": str(MANIFEST_PATH),
            "datasets": manifest_rows,
        }, indent=2))
        return 0

    print("\n" + "=" * 86)
    print("🌿 UNIFIED AI FARM COPILOT — KAGGLE 80,000+ LEAF DATASET DISCOVERY REPORT")
    print("=" * 86)
    print(f"• Target Unique Images       : {TARGET_IMAGES:,} unique original leaf images")
    print(f"• Available Disk Space       : {free_gb:.2f} GB free (Required: ~{total_est_mb / 1024:.2f} GB raw + ~3.5 GB processed)")
    print(f"• Kaggle CLI / Client Status : {cli_msg}")
    print(f"• Kaggle Auth Configured     : {'YES (' + auth_source + ')' if auth_configured else 'NO (See instructions below)'}")
    print(f"• Live Kaggle API Check      : {live_api_msg}")
    print(f"• Manifest Saved To          : {MANIFEST_PATH}")
    print("-" * 86)
    print(f"{'#':<3} {'Kaggle Dataset Identifier':<44} {'Subdir':<13} {'Est. Size':<10} {'Est. Unique':<12} {'Status'}")
    print("-" * 86)
    for idx, r in enumerate(manifest_rows, 1):
        size_str = f"{int(r['approx_size_mb']):,} MB"
        uniq_str = f"~{int(r['estimated_unique_images']):,}"
        print(f"{idx:<3} {r['dataset_id']:<44} {r['target_subdir']:<13} {size_str:<10} {uniq_str:<12} {r['download_status']}")
    print("-" * 86)
    print(f"TOTAL ACROSS {len(manifest_rows)} DATASETS: ~{total_est_mb:,} MB (~{total_est_mb / 1024:.2f} GB) | Est. Unique Images: ~{total_est_unique:,}")
    print(f"ACTUAL DOWNLOADED VALID IMAGES ON DISK RIGHT NOW: {total_actual_images:,}")
    print("=" * 86)

    if live_search_results:
        print(f"\n📡 Live Kaggle API Search Results ({len(live_search_results)} returned):")
        for item in live_search_results[:8]:
            ref = item.get("ref", "")
            title = item.get("title", "")
            size = item.get("totalBytes", 0)
            print(f"  - {ref} ({title}) [{round(size / (1024*1024), 1) if size else '?'} MB]")

    if not auth_configured:
        print_auth_setup_instructions()

    return 0


if __name__ == "__main__":
    sys.exit(main())
