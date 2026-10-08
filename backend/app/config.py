import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load .env file if present
_env_path = BASE_DIR / ".env"
if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

class Settings:
    PROJECT_NAME: str = "AI Farm Co-Pilot & Market Optimizer"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "agritech-super-secret-jwt-key-2026-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/database/farm_copilot.db")
    
    # Uploads
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    LEAF_UPLOAD_DIR: Path = BASE_DIR / "uploads" / "leaves"
    SOIL_UPLOAD_DIR: Path = BASE_DIR / "uploads" / "soil_reports"
    PRODUCT_UPLOAD_DIR: Path = BASE_DIR / "uploads" / "products"
    
    # External APIs
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"
    
    # Razorpay Payment Gateway (Loaded strictly from Environment Variables)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
    
    # AI Models
    ACTIVE_MODEL_VERSION: str = "AgroVision-Ensemble-v1.0"
    CONFIDENCE_THRESHOLD: float = 0.70  # Below 70% prompts expert escalation
    
    # Server port
    PORT: int = int(os.getenv("PORT", "8080"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

settings = Settings()

# Ensure directories exist
settings.LEAF_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.SOIL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.PRODUCT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

