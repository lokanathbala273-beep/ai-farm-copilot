#!/usr/bin/env python3
"""
Phase 7: Held-Out Test Set Model Evaluation
===========================================
Evaluates the trained model strictly on `data/processed/test` (never seen during training
or validation selection) and outputs actual measured metrics:
  - Overall accuracy
  - Per-class precision, recall, F1-score, and test support counts
  - Confusion matrix & classification report
  - Identification of poorly performing classes (F1 < 0.75)
  - Dataset composition summary & real-world field caveat

Never fabricates metrics; fails honestly if the model or test split is missing.
"""

import argparse
import json
import pickle
import sys
from pathlib import Path
from typing import Dict, List
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from scripts.train_model import (  # noqa: E402
    METADATA_DIR_DEFAULT,
    PROCESSED_DIR_DEFAULT,
    WEIGHTS_DIR,
    discover_split_files,
    stream_feature_batches,
)


def evaluate_held_out_test_set(
    processed_dir: Path = PROCESSED_DIR_DEFAULT,
    metadata_dir: Path = METADATA_DIR_DEFAULT,
    weights_dir: Path = WEIGHTS_DIR,
    batch_size: int = 64,
) -> Dict:
    meta_file = weights_dir / "model_metadata.json"
    if not meta_file.exists():
        raise FileNotFoundError(
            f"Missing trained model metadata at {meta_file}. Run `python scripts/train_model.py` first."
        )

    with open(meta_file, "r", encoding="utf-8") as mf:
        model_meta = json.load(mf)

    model_path = Path(model_meta["model_path"])
    if not model_path.exists():
        raise FileNotFoundError(f"Trained model file not found at {model_path}.")

    class_names: List[str] = model_meta["class_names"]
    image_size = int(model_meta.get("image_size", 224))

    test_dir = processed_dir / "test"
    _, test_items = discover_split_files(test_dir)
    if not test_items:
        raise RuntimeError(
            f"No held-out test images found in {test_dir}. Run `python scripts/prepare_dataset.py` first."
        )

    # Map test folder indices to model class_names indices
    test_class_dirs = sorted([d.name for d in test_dir.iterdir() if d.is_dir() and not d.name.startswith(".")])
    dir_idx_to_model_idx = {
        i: class_names.index(cname)
        for i, cname in enumerate(test_class_dirs)
        if cname in class_names
    }
    remapped_test_items = [
        (fpath, dir_idx_to_model_idx[d_idx])
        for fpath, d_idx in test_items
        if d_idx in dir_idx_to_model_idx
    ]

    y_true_list: List[int] = []
    y_pred_list: List[int] = []

    if model_path.suffix == ".keras":
        import tensorflow as tf  # type: ignore
        from PIL import Image

        model = tf.keras.models.load_model(str(model_path))
        for start in range(0, len(remapped_test_items), batch_size):
            batch = remapped_test_items[start:start + batch_size]
            imgs = []
            labels = []
            for fpath, lbl in batch:
                with Image.open(fpath) as im:
                    arr = np.asarray(im.convert("RGB").resize((image_size, image_size)), dtype=np.float32)
                    imgs.append(arr)
                    labels.append(lbl)
            preds = np.argmax(model.predict(np.stack(imgs), verbose=0), axis=1)
            y_true_list.extend(labels)
            y_pred_list.extend(preds.tolist())
    else:
        with open(model_path, "rb") as pf:
            saved = pickle.load(pf)
        scaler = saved["scaler"]
        clf = saved["clf"]
        for x_b, y_b in stream_feature_batches(
            remapped_test_items, batch_size=batch_size, image_size=image_size, augment=False, seed=42
        ):
            x_scaled = scaler.transform(x_b)
            preds = clf.predict(x_scaled)
            y_true_list.extend(y_b.tolist())
            y_pred_list.extend(preds.tolist())

    y_true = np.array(y_true_list, dtype=np.int64)
    y_pred = np.array(y_pred_list, dtype=np.int64)
    labels_all = list(range(len(class_names)))

    overall_acc = float(accuracy_score(y_true, y_pred))
    prec, rec, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=labels_all, zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred, labels=labels_all).tolist()
    cls_report_txt = classification_report(
        y_true, y_pred, labels=labels_all, target_names=class_names, zero_division=0
    )

    per_class = {}
    underperforming = {}
    for idx, cname in enumerate(class_names):
        p_val = round(float(prec[idx]), 4)
        r_val = round(float(rec[idx]), 4)
        f1_val = round(float(f1[idx]), 4)
        sup_val = int(support[idx])
        per_class[cname] = {
            "precision": p_val,
            "recall": r_val,
            "f1_score": f1_val,
            "test_count": sup_val,
        }
        if sup_val > 0 and f1_val < 0.75:
            underperforming[cname] = per_class[cname]

    dataset_report_path = metadata_dir / "dataset_report.json"
    dataset_composition = {}
    if dataset_report_path.exists():
        with open(dataset_report_path, "r", encoding="utf-8") as df:
            dataset_composition = json.load(df)

    eval_report = {
        "model_version": model_meta.get("model_version", "DeepFoliar-Trained-v1.0"),
        "framework": model_meta.get("framework"),
        "model_path": str(model_path),
        "held_out_test_samples": len(y_true),
        "overall_accuracy": round(overall_acc, 4),
        "per_class_metrics": per_class,
        "underperforming_classes_f1_below_0_75": underperforming,
        "confusion_matrix": cm,
        "class_names": class_names,
        "classification_report": cls_report_txt,
        "dataset_composition_summary": {
            "actual_unique_image_count": dataset_composition.get("actual_unique_image_count", 0),
            "split_distribution": dataset_composition.get("split_distribution", {}),
            "crop_distribution": dataset_composition.get("crop_distribution", {}),
        },
        "real_world_caveat": (
            "NOTE: High accuracy on held-out benchmark test sets does not guarantee identical real-world "
            "field performance under variable lighting, complex backgrounds, multi-pathogen infections, "
            "or camera motion blur. Low-confidence predictions (<70%) are automatically escalated to "
            "agricultural experts."
        ),
    }

    metadata_dir.mkdir(parents=True, exist_ok=True)
    out_json = metadata_dir / "evaluation_report.json"
    with open(out_json, "w", encoding="utf-8") as ef:
        json.dump(eval_report, ef, indent=2)

    return eval_report


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate Trained Leaf Disease Model on Held-Out Test Set")
    parser.add_argument("--processed-dir", type=Path, default=PROCESSED_DIR_DEFAULT)
    parser.add_argument("--metadata-dir", type=Path, default=METADATA_DIR_DEFAULT)
    parser.add_argument("--weights-dir", type=Path, default=WEIGHTS_DIR)
    parser.add_argument("--batch-size", type=int, default=64)
    args = parser.parse_args()

    try:
        report = evaluate_held_out_test_set(
            processed_dir=args.processed_dir,
            metadata_dir=args.metadata_dir,
            weights_dir=args.weights_dir,
            batch_size=args.batch_size,
        )
    except (FileNotFoundError, RuntimeError) as exc:
        print(f"\n⚠️ {exc}")
        return 1

    print("\n" + "=" * 80)
    print("📊 HELD-OUT TEST SET EVALUATION REPORT (ACTUAL MEASURED METRICS)")
    print("=" * 80)
    print(f"• Model Path         : {report['model_path']}")
    print(f"• Held-Out Test Count: {report['held_out_test_samples']:,} images")
    print(f"• Overall Accuracy   : {report['overall_accuracy'] * 100:.2f}%")
    print("-" * 80)
    print(report["classification_report"])
    if report["underperforming_classes_f1_below_0_75"]:
        print("⚠️ Classes Performing Below 0.75 F1-Score:")
        for cname, m in report["underperforming_classes_f1_below_0_75"].items():
            print(f"  - {cname}: F1={m['f1_score']} (Precision={m['precision']}, Recall={m['recall']}, n={m['test_count']})")
    print("-" * 80)
    print(report["real_world_caveat"])
    print("=" * 80 + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
