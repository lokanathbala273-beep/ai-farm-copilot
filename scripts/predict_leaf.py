#!/usr/bin/env python3
"""
Phase 8: Leaf Disease CLI Inference Script
==========================================
Runs inference on a leaf image using the active model in `model_registry`
(`DeepFoliarTrainedClassifier` when trained weights are present, or
`BotanicalEnsembleClassifier` fallback) and outputs:
  - Predicted crop & disease / healthy status
  - Top-3 candidate classes with confidence scores
  - Low-confidence / unsupported-crop warnings
  - General disease information & safe next-step recommendations
"""

import argparse
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ai.models.registry import model_registry  # noqa: E402
from ai.preprocessing.transforms import ImageValidationError, validate_image_bytes  # noqa: E402


def predict_single_image(
    image_path: Path,
    selected_crop: str = "Tomato",
    confidence_threshold: float = 0.70,
) -> dict:
    if not image_path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")

    raw_bytes = image_path.read_bytes()
    pil_img = validate_image_bytes(raw_bytes, image_path.name)

    classifier = model_registry.get_active_model()
    res = classifier.predict(
        pil_img,
        selected_crop=selected_crop,
        confidence_threshold=confidence_threshold,
    )
    return res.to_dict()


def main() -> int:
    parser = argparse.ArgumentParser(description="Predict plant leaf disease from an image file")
    parser.add_argument("image", type=Path, help="Path to leaf image (.jpg, .png, .webp)")
    parser.add_argument("--crop", type=str, default="Tomato", help="Optional crop hint (default: Tomato)")
    parser.add_argument("--threshold", type=float, default=0.70, help="Confidence threshold (default: 0.70)")
    parser.add_argument("--json", action="store_true", help="Output result as JSON")
    args = parser.parse_args()

    try:
        out = predict_single_image(args.image, selected_crop=args.crop, confidence_threshold=args.threshold)
    except (FileNotFoundError, ImageValidationError) as exc:
        print(f"❌ Error: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(out, indent=2))
        return 0

    print("\n" + "=" * 76)
    print("🌿 LEAF DISEASE PREDICTION RESULT")
    print("=" * 76)
    print(f"• Model Version     : {out['model_version']}")
    print(f"• Foliar Valid      : {out['is_foliar_valid']}")
    print(f"• Predicted Crop    : {out['crop']}")
    print(f"• Predicted Status  : {out['disease']} (Severity: {out['severity']})")
    print(f"• Top-1 Confidence  : {out['confidence']*100:.2f}%")
    if out.get("low_confidence_warning"):
        print(f"⚠️ Low-Confidence   : {out['low_confidence_warning']}")
    if out.get("unsupported_or_uncertain_warning"):
        print(f"⚠️ Advisory Warning : {out['unsupported_or_uncertain_warning']}")
    print("\n🏆 Top-3 Candidate Classes:")
    for cand in out.get("top_candidates", []):
        print(f"  #{cand['rank']}: {cand['crop']} — {cand['disease']} ({cand['confidence']*100:.2f}%)")
    print(f"\n🔬 Symptoms         : {out['symptoms']}")
    print(f"🦠 Possible Causes  : {out['possible_causes']}")
    print(f"🛡️ Safe Next Steps  :")
    for step in out.get("safe_next_steps", []):
        print(f"  • {step}")
    print("=" * 76 + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
