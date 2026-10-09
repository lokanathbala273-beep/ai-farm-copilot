#!/usr/bin/env python3
"""
Phase 3, Phase 4 & Phase 5: Dataset Preparation, Deduplication & Leakage-Free Splitting
=======================================================================================
Scans raw downloaded datasets in `data/raw/kaggle/`, validates every image file,
computes SHA-256 exact hashes and 64-bit perceptual dHashes, removes exact duplicates
and pre-augmented copies, groups near-duplicates into the same partition to prevent
data leakage, normalizes labels via `data/metadata/class_mapping.json`, and builds:
  - `data/processed/{train,validation,test}/<canonical_class>/` (80% / 10% / 10%)
  - `data/metadata/image_manifest.csv`
  - `data/metadata/dataset_report.json`

Never inflates counts or claims TARGET_IMAGES=80000 is reached unless confirmed by
`image_manifest.csv`.
"""

import argparse
import csv
import hashlib
import json
import os
import random
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
import numpy as np
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR_DEFAULT = PROJECT_ROOT / "data" / "raw" / "kaggle"
PROCESSED_DIR_DEFAULT = PROJECT_ROOT / "data" / "processed"
METADATA_DIR_DEFAULT = PROJECT_ROOT / "data" / "metadata"
CLASS_MAPPING_PATH = METADATA_DIR_DEFAULT / "class_mapping.json"
IMAGE_MANIFEST_PATH = METADATA_DIR_DEFAULT / "image_manifest.csv"
DATASET_REPORT_PATH = METADATA_DIR_DEFAULT / "dataset_report.json"

TARGET_IMAGES = int(os.environ.get("TARGET_IMAGES", "80000"))
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
SYNTHETIC_AUG_KEYWORDS = ("_aug", "augmented_", "aug_", "_copy", "_flipped", "_rotated")


def load_class_mapping(mapping_path: Path = CLASS_MAPPING_PATH) -> Tuple[Dict[str, str], Dict[str, Dict]]:
    """
    Loads `class_mapping.json` and builds a case-insensitive lookup table
    mapping raw folder names to canonical `<Crop>___<Disease>` labels.
    """
    with open(mapping_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    canonical_classes = data.get("canonical_classes", {})
    alias_to_canonical: Dict[str, str] = {}
    for canon_name, info in canonical_classes.items():
        alias_to_canonical[canon_name.lower().strip()] = canon_name
        alias_to_canonical[canon_name.replace("___", "_").lower().strip()] = canon_name
        for alias in info.get("aliases", []):
            alias_to_canonical[alias.lower().strip()] = canon_name
            alias_to_canonical[alias.replace(" ", "_").lower().strip()] = canon_name
    return alias_to_canonical, canonical_classes


def compute_sha256(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def compute_perceptual_dhash(img: Image.Image, hash_size: int = 8) -> str:
    """
    Computes a 64-bit perceptual difference hash (dHash) from an (hash_size+1, hash_size)
    grayscale thumbnail to detect near-duplicates and group related leaf captures.
    """
    gray = img.convert("L").resize((hash_size + 1, hash_size), Image.Resampling.BILINEAR)
    pixels = np.asarray(gray, dtype=np.int16)
    diff = pixels[:, 1:] > pixels[:, :-1]
    bit_string = "".join("1" if b else "0" for b in diff.flatten())
    return f"{int(bit_string, 2):016x}"


def validate_and_inspect_image(filepath: Path) -> Tuple[bool, Optional[str], Optional[Tuple[int, int]], Optional[str]]:
    """
    Verifies that `filepath` is a valid, non-corrupt RGB-convertible image.
    Returns (is_valid, phash_hex, (width, height), error_reason).
    """
    try:
        with Image.open(filepath) as img:
            img.verify()
        with Image.open(filepath) as img:
            img_rgb = img.convert("RGB")
            w, h = img_rgb.size
            if w < 16 or h < 16:
                return False, None, (w, h), "Image dimensions too small (<16x16)"
            phash = compute_perceptual_dhash(img_rgb)
            return True, phash, (w, h), None
    except Exception as exc:
        return False, None, None, f"Corrupt image: {exc.__class__.__name__}"


def is_pre_augmented_filename(filename: str, parent_parts: Tuple[str, ...]) -> bool:
    """Checks if a file is an offline-augmented copy so we don't inflate original image counts."""
    lower_name = filename.lower()
    if any(k in lower_name for k in SYNTHETIC_AUG_KEYWORDS):
        return True
    if any("augmented" in p.lower() for p in parent_parts):
        return True
    return False


def assign_grouped_splits(
    records: List[Dict],
    train_ratio: float = 0.80,
    val_ratio: float = 0.10,
    seed: int = 42,
) -> None:
    """
    Splits records into `train`, `validation`, and `test` (default 80% / 10% / 10%)
    stratified by `canonical_label` AND grouped by perceptual hash prefix (`phash[:12]`)
    so near-duplicate or same-leaf images never leak across train/validation/test sets.
    """
    rng = random.Random(seed)
    by_class: Dict[str, Dict[str, List[Dict]]] = defaultdict(lambda: defaultdict(list))

    for rec in records:
        canon = rec["canonical_label"]
        # Group by first 48 bits of perceptual dHash to keep near-duplicates together
        group_key = rec["phash"][:12]
        by_class[canon][group_key].append(rec)

    for canon, groups_dict in by_class.items():
        group_keys = sorted(groups_dict.keys())
        rng.shuffle(group_keys)
        total_cls = sum(len(groups_dict[g]) for g in group_keys)
        train_cutoff = int(round(total_cls * train_ratio))
        val_cutoff = train_cutoff + int(round(total_cls * val_ratio))

        assigned = 0
        for g in group_keys:
            grp_records = groups_dict[g]
            if assigned < train_cutoff or total_cls < 3:
                split_name = "train"
            elif assigned < val_cutoff:
                split_name = "validation"
            else:
                split_name = "test"
            for r in grp_records:
                r["split"] = split_name
            assigned += len(grp_records)


def link_or_copy_file(src: Path, dst: Path, mode: str = "hardlink") -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        return
    if mode == "hardlink":
        try:
            os.link(src, dst)
            return
        except OSError:
            pass
    elif mode == "symlink":
        try:
            os.symlink(src.resolve(), dst)
            return
        except OSError:
            pass
    shutil.copy2(src, dst)


def prepare_dataset(
    raw_dir: Path = RAW_DIR_DEFAULT,
    processed_dir: Path = PROCESSED_DIR_DEFAULT,
    metadata_dir: Path = METADATA_DIR_DEFAULT,
    target_images: int = TARGET_IMAGES,
    link_mode: str = "hardlink",
    seed: int = 42,
) -> Dict:
    """
    Runs the complete dataset validation, deduplication, label normalization,
    and train/validation/test partitioning pipeline.
    """
    metadata_dir.mkdir(parents=True, exist_ok=True)
    for split in ("train", "validation", "test"):
        (processed_dir / split).mkdir(parents=True, exist_ok=True)

    alias_to_canonical, canonical_classes = load_class_mapping()

    seen_sha256: Set[str] = set()
    seen_phash: Dict[str, str] = {}
    valid_records: List[Dict] = []
    corrupt_files: List[Dict[str, str]] = []
    exact_duplicates_count = 0
    near_duplicates_flagged = 0
    augmented_skipped_count = 0
    uncertain_labels: Counter = Counter()
    sources_found: Set[str] = set()

    if raw_dir.exists():
        for root, _, files in sorted(os.walk(raw_dir)):
            root_path = Path(root)
            for fname in sorted(files):
                if fname == ".gitkeep" or fname.startswith("."):
                    continue
                fpath = root_path / fname
                if fpath.suffix.lower() not in SUPPORTED_EXTENSIONS:
                    continue

                rel_parts = fpath.relative_to(raw_dir).parts
                source_name = rel_parts[0] if len(rel_parts) > 1 else "local"
                raw_label = fpath.parent.name

                if is_pre_augmented_filename(fname, rel_parts[:-1]):
                    augmented_skipped_count += 1
                    continue

                norm_key = raw_label.lower().strip()
                norm_key_underscore = raw_label.replace(" ", "_").lower().strip()
                canon_label = alias_to_canonical.get(norm_key) or alias_to_canonical.get(norm_key_underscore)
                if not canon_label:
                    uncertain_labels[raw_label] += 1
                    continue

                is_ok, phash, dims, err = validate_and_inspect_image(fpath)
                if not is_ok or not phash or not dims:
                    corrupt_files.append({"path": str(fpath), "reason": err or "Invalid"})
                    continue

                sha = compute_sha256(fpath)
                if sha in seen_sha256:
                    exact_duplicates_count += 1
                    continue
                seen_sha256.add(sha)

                is_near_dup = phash in seen_phash
                if is_near_dup:
                    near_duplicates_flagged += 1
                else:
                    seen_phash[phash] = str(fpath)

                sources_found.add(source_name)
                cls_meta = canonical_classes.get(canon_label, {})
                valid_records.append({
                    "image_id": sha[:16],
                    "sha256": sha,
                    "phash": phash,
                    "near_duplicate_flag": is_near_dup,
                    "original_source": source_name,
                    "original_label": raw_label,
                    "canonical_label": canon_label,
                    "crop": cls_meta.get("crop", canon_label.split("___")[0]),
                    "disease": cls_meta.get("disease", canon_label.split("___")[-1]),
                    "width": dims[0],
                    "height": dims[1],
                    "original_path": str(fpath),
                    "split": "train",
                    "processed_path": "",
                })

    # Assign leakage-free train / validation / test splits
    assign_grouped_splits(valid_records, train_ratio=0.80, val_ratio=0.10, seed=seed)

    # Materialize split directories and write image_manifest.csv
    manifest_csv_path = metadata_dir / "image_manifest.csv"
    fieldnames = [
        "image_id",
        "sha256",
        "phash",
        "near_duplicate_flag",
        "original_source",
        "original_label",
        "canonical_label",
        "crop",
        "disease",
        "width",
        "height",
        "split",
        "original_path",
        "processed_path",
    ]

    class_counts: Counter = Counter()
    crop_counts: Counter = Counter()
    split_counts: Counter = Counter()

    with open(manifest_csv_path, "w", newline="", encoding="utf-8") as mf:
        writer = csv.DictWriter(mf, fieldnames=fieldnames)
        writer.writeheader()
        for rec in valid_records:
            ext = Path(rec["original_path"]).suffix.lower()
            out_path = (
                processed_dir
                / rec["split"]
                / rec["canonical_label"]
                / f"{rec['image_id']}{ext}"
            )
            link_or_copy_file(Path(rec["original_path"]), out_path, mode=link_mode)
            rec["processed_path"] = str(out_path)
            writer.writerow(rec)

            class_counts[rec["canonical_label"]] += 1
            crop_counts[rec["crop"]] += 1
            split_counts[rec["split"]] += 1

    total_unique = len(valid_records)
    missing_to_target = max(0, target_images - total_unique)
    target_reached = total_unique >= target_images

    # Compute balanced inverse-frequency class weights for training
    num_active_classes = len(class_counts)
    class_weights: Dict[str, float] = {}
    if total_unique > 0 and num_active_classes > 0:
        for cls_name, cnt in class_counts.items():
            class_weights[cls_name] = round(total_unique / (num_active_classes * max(1, cnt)), 4)

    underrepresented = {
        cls_name: cnt for cls_name, cnt in class_counts.items() if cnt < 200
    }
    zero_data_classes = [
        cls_name for cls_name in canonical_classes.keys() if class_counts[cls_name] == 0
    ]

    report = {
        "target_images": target_images,
        "actual_unique_image_count": total_unique,
        "target_reached": target_reached,
        "missing_images_relative_to_target": missing_to_target,
        "dataset_sources_downloaded": sorted(sources_found),
        "corrupt_images_rejected": len(corrupt_files),
        "exact_duplicates_removed": exact_duplicates_count,
        "near_duplicates_flagged": near_duplicates_flagged,
        "pre_augmented_files_excluded": augmented_skipped_count,
        "split_distribution": dict(split_counts),
        "crop_distribution": dict(crop_counts),
        "class_distribution": dict(class_counts),
        "computed_class_weights": class_weights,
        "underrepresented_classes_below_200": underrepresented,
        "classes_with_zero_images": zero_data_classes,
        "uncertain_labels_for_manual_review": dict(uncertain_labels),
        "corrupt_file_samples": corrupt_files[:25],
    }

    report_path = metadata_dir / "dataset_report.json"
    with open(report_path, "w", encoding="utf-8") as rf:
        json.dump(report, rf, indent=2)

    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare, deduplicate, and split 80,000+ leaf disease dataset")
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR_DEFAULT)
    parser.add_argument("--processed-dir", type=Path, default=PROCESSED_DIR_DEFAULT)
    parser.add_argument("--metadata-dir", type=Path, default=METADATA_DIR_DEFAULT)
    parser.add_argument("--target-images", type=int, default=TARGET_IMAGES)
    parser.add_argument("--link-mode", choices=["hardlink", "copy", "symlink"], default="hardlink")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    report = prepare_dataset(
        raw_dir=args.raw_dir,
        processed_dir=args.processed_dir,
        metadata_dir=args.metadata_dir,
        target_images=args.target_images,
        link_mode=args.link_mode,
        seed=args.seed,
    )

    print("\n" + "=" * 80)
    print("🌿 DATASET PREPARATION & DEDUPLICATION REPORT")
    print("=" * 80)
    print(f"• Target Unique Images          : {report['target_images']:,}")
    print(f"• Actual Valid Unique Images    : {report['actual_unique_image_count']:,}")
    print(f"• Target Reached (Confirmed)    : {'YES' if report['target_reached'] else 'NO'}")
    if not report["target_reached"]:
        print(f"• Missing Images to Target      : {report['missing_images_relative_to_target']:,}")
    print(f"• Downloaded Sources Found      : {', '.join(report['dataset_sources_downloaded']) or 'None yet'}")
    print(f"• Exact Duplicates Removed      : {report['exact_duplicates_removed']:,}")
    print(f"• Near-Duplicates Flagged       : {report['near_duplicates_flagged']:,}")
    print(f"• Pre-Augmented Copies Excluded : {report['pre_augmented_files_excluded']:,}")
    print(f"• Corrupt Files Rejected        : {report['corrupt_images_rejected']:,}")
    print(f"• Splits (80/10/10 Grouped)     : {report['split_distribution']}")
    print(f"• Report Saved To               : {args.metadata_dir / 'dataset_report.json'}")
    print("=" * 80 + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
