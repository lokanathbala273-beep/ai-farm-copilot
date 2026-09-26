import io
import math
from typing import Tuple, Dict, Any
from PIL import Image
import numpy as np

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB

class ImageValidationError(Exception):
    pass

def validate_image_bytes(file_bytes: bytes, filename: str = "") -> Image.Image:
    """Validates file size, file format, and attempts PIL decoding."""
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise ImageValidationError(f"File size {len(file_bytes) / (1024*1024):.1f}MB exceeds 15MB maximum allowed limit.")
    
    if len(file_bytes) < 100:
        raise ImageValidationError("Uploaded image file is empty or corrupted.")

    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.load()
    except Exception as e:
        raise ImageValidationError(f"Invalid image format. Supported formats are JPG, JPEG, PNG, WEBP. Error: {str(e)}")

    fmt = (image.format or "").upper()
    if fmt not in ["JPEG", "JPG", "PNG", "WEBP"]:
        raise ImageValidationError(f"Unsupported image format: {fmt}. Only JPG, PNG, and WEBP are supported.")

    if image.mode != "RGB":
        image = image.convert("RGB")

    return image

def check_foliar_tissue(image: Image.Image) -> Tuple[bool, float, Dict[str, float]]:
    """
    Evaluates whether the image contains plant foliar tissue using
    Excess Green Index (ExG = 2*G - R - B) and HSV Chromaticity.
    Rejects completely non-foliar photos (e.g. walls, furniture, random objects).
    """
    img_arr = np.array(image.resize((128, 128)), dtype=np.float32)
    r = img_arr[:, :, 0]
    g = img_arr[:, :, 1]
    b = img_arr[:, :, 2]

    # Excess Green Index
    exg = 2.0 * g - r - b
    green_pixels = np.sum(exg > 15.0)

    # Brown / necrotic tissue check (typical of leaf lesions)
    brown_pixels = np.sum((r > 60.0) & (g > 40.0) & (b < 80.0) & (r > g) & (g > b))

    # Total vegetative / pathological foliar ratio
    total_pixels = 128 * 128
    foliar_ratio = float((green_pixels + brown_pixels) / total_pixels)

    metrics = {
        "green_coverage": float(green_pixels / total_pixels),
        "lesion_necrotic_coverage": float(brown_pixels / total_pixels),
        "foliar_ratio": foliar_ratio
    }

    # Minimum 8% green/leaf foliar coverage to confirm plant leaf
    is_leaf = foliar_ratio >= 0.08
    return is_leaf, foliar_ratio, metrics

def extract_botanical_features(image: Image.Image) -> np.ndarray:
    """
    Extracts botanical color moments, chromaticity, and lesion contrast vectors
    from a standardized 224x224 leaf image.
    """
    resized = image.resize((224, 224))
    rgb_arr = np.array(resized, dtype=np.float32) / 255.0
    
    # RGB color moments
    means = np.mean(rgb_arr, axis=(0, 1))
    stds = np.std(rgb_arr, axis=(0, 1))

    # Lesion spot contrast
    r, g, b = rgb_arr[:, :, 0], rgb_arr[:, :, 1], rgb_arr[:, :, 2]
    lesion_contrast = np.mean(np.abs(g - r))
    necrotic_density = np.mean((r > g) & (g > b))

    # Spatial texture gradient
    dx = np.diff(g, axis=1)
    dy = np.diff(g, axis=0)
    texture_roughness = float(np.mean(np.abs(dx)) + np.mean(np.abs(dy)))

    feature_vector = np.array([
        means[0], means[1], means[2],
        stds[0], stds[1], stds[2],
        float(lesion_contrast),
        float(necrotic_density),
        texture_roughness
    ], dtype=np.float32)

    return feature_vector
