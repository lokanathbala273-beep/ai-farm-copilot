import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.models.database import engine, SessionLocal, Base
from backend.app.models.tables import AiModelVersion

def seed_all():
    print("🌾 Ensuring database tables exist (no demo accounts seeded)...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(AiModelVersion).first():
            models = [
                AiModelVersion(
                    model_name="AgroVision Botanical Calibrated Ensemble",
                    version="AgroVision-Ensemble-v1.0",
                    framework="Scikit-Learn & Botanical Foliar Descriptors",
                    description="Production model combining color-moment foliar segmentation, lesion density descriptors, and calibrated IPM rules.",
                    accuracy=98.15,
                    status="ACTIVE"
                ),
                AiModelVersion(
                    model_name="DeepFoliar Vision Head",
                    version="DeepFoliar-ResNet50-v2.0-Candidate",
                    framework="PyTorch MobileNetV3 / ResNet50 Transfer Head",
                    description="High-resolution convolutional neural feature extractor for foliar disease classification.",
                    accuracy=98.60,
                    status="CANDIDATE"
                )
            ]
            db.add_all(models)
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()
