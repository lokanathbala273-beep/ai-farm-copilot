# Unified AI Farm Copilot — 80,000+ Plant Disease Dataset & AI Training Pipeline

This guide provides complete **macOS** and **Windows** commands to discover, download, deduplicate, prepare, train, evaluate, and integrate the **80,000+ Unique Labelled Plant Leaf Disease Image Dataset** into the **Unified AI Farm Copilot – Risk Intelligence & Market Optimiser** platform.

---

## 1. Prerequisites & Environment Setup

### macOS / Linux (Zsh / Bash)
```bash
# Activate your project virtual environment
source /Users/lokanath/.gemini/antigravity/scratch/venv314/bin/activate

# Install required dependencies
pip install -r requirements.txt
```

### Windows (PowerShell)
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 2. Secure Kaggle API Authentication Setup

1. Sign in to [https://www.kaggle.com](https://www.kaggle.com) → click your profile icon → **Settings**.
2. Scroll down to the **API** section and click **Create New Token** to download `kaggle.json`.
3. Configure your credentials using **Option A** or **Option B** (both are protected in `.gitignore` and never committed to Git):

### Option A — Standard `.kaggle/kaggle.json` File
* **macOS / Linux:**
  ```bash
  mkdir -p ~/.kaggle
  mv ~/Downloads/kaggle.json ~/.kaggle/kaggle.json
  chmod 600 ~/.kaggle/kaggle.json
  ```
* **Windows (PowerShell):**
  ```powershell
  New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.kaggle"
  Move-Item "$env:USERPROFILE\Downloads\kaggle.json" "$env:USERPROFILE\.kaggle\kaggle.json"
  ```

### Option B — Environment Variables (or local `.env` file)
* **macOS / Linux:**
  ```bash
  export KAGGLE_USERNAME="your_kaggle_username"
  export KAGGLE_KEY="your_kaggle_api_key"
  ```
* **Windows (PowerShell):**
  ```powershell
  $env:KAGGLE_USERNAME="your_kaggle_username"
  $env:KAGGLE_KEY="your_kaggle_api_key"
  ```

---

## 3. Step-by-Step Pipeline Execution

### Step 1 — Dataset Discovery & Storage Check
Inspects Kaggle authentication, verifies available disk space, and generates [`data/metadata/dataset_manifest.csv`](file:///Users/lokanath/.gemini/antigravity/scratch/ai-farm-copilot/data/metadata/dataset_manifest.csv) listing the 11 curated public plant disease datasets (~91,160 estimated unique images across 14+ crops):
```bash
python scripts/discover_datasets.py
```

### Step 2 — Incremental Kaggle Dataset Download
Displays the download plan and asks for confirmation before downloading archives into `data/raw/kaggle/`:
```bash
# Interactive confirmation prompt:
python scripts/download_datasets.py

# Non-interactive (auto-confirm):
python scripts/download_datasets.py --yes

# Download specific dataset(s) only:
python scripts/download_datasets.py --datasets abdallahalidev/plantvillage-dataset,minhhuy2810/rice-diseases-image-dataset
```

### Step 3 — Image Validation, Deduplication & Leakage-Free Split (80 / 10 / 10)
Validates every image header with Pillow, removes corrupt files, excludes pre-augmented copies, removes exact SHA-256 duplicates, flags perceptual dHash near-duplicates and groups them into the same split (`train` 80%, `validation` 10%, `test` 10%), normalizes labels via [`data/metadata/class_mapping.json`](file:///Users/lokanath/.gemini/antigravity/scratch/ai-farm-copilot/data/metadata/class_mapping.json), and writes `data/metadata/image_manifest.csv` and `data/metadata/dataset_report.json`:
```bash
python scripts/prepare_dataset.py --target-images 80000
```

### Step 4 — Train the AI Model (Batch Streaming)
Streams mini-batches from `data/processed/train` and `data/processed/validation` (never loading all 80,000 images into RAM at once), applies training-only augmentation, saves resumable checkpoints in `ai/models/checkpoints/`, and exports the trained model to `ai/models/weights/`:
```bash
# Auto-selects TensorFlow MobileNetV2 (when installed) or Out-of-Core Streaming Foliar Neural Net:
python scripts/train_model.py --epochs 12 --batch-size 64 --image-size 224
```
> **Note on Google Colab GPU Training:** If you want to train full TensorFlow/Keras `MobileNetV2` or `EfficientNetB0` on a free T4 GPU, upload `scripts/train_model.py` and `data/processed/` to Google Colab (Python 3.11 with GPU runtime) and run `python scripts/train_model.py --backend tensorflow --epochs 20`. Copy the resulting `ai/models/weights/deep_foliar_mobilenetv2_v1.keras` and `model_metadata.json` into `ai/models/weights/`.

### Step 5 — Evaluate on Held-Out Test Set
Evaluates strictly on `data/processed/test` and outputs overall accuracy, per-class precision/recall/F1, confusion matrix, and underperforming class diagnostics to `data/metadata/evaluation_report.json`:
```bash
python scripts/evaluate_model.py
```

### Step 6 — CLI Leaf Inference & Website Integration
Once `ai/models/weights/model_metadata.json` is present, [`ai/models/registry.py`](file:///Users/lokanath/.gemini/antigravity/scratch/ai-farm-copilot/ai/models/registry.py) and `POST /api/disease/predict` ([`backend/app/api/predictions.py`](file:///Users/lokanath/.gemini/antigravity/scratch/ai-farm-copilot/backend/app/api/predictions.py)) automatically use `DeepFoliarTrainedClassifier` and return Top-3 candidate classes, confidence warnings, and safe next steps.
```bash
# CLI Prediction on any leaf image:
python scripts/predict_leaf.py path/to/leaf.jpg --crop Tomato
```

---

## 4. Running Automated Unit & Integration Tests
```bash
python -m unittest tests/test_dataset_and_model_pipeline.py -v
```
