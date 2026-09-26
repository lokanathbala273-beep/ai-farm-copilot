import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

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
