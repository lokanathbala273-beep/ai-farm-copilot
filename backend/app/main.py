import sys
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.config import settings
from backend.app.models.database import engine, Base, SessionLocal
from backend.app.models.tables import (
    User, FarmerProfile, ExpertProfile, SellerProfile, BuyerProfile,
    Farm, Field, ExpertConsultation, DiseasePrediction, BuyerListing, BuyerOrder, Notification
)
from backend.app.api import (
    auth, farms, fields, crops, disease, predictions,
    copilot, weather, soil, business, expenses, income,
    markets, buyers, experts, sellers, admin, notifications
)

from sqlalchemy import text

# Ensure tables exist
Base.metadata.create_all(bind=engine)
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN biometric_token VARCHAR(255)"))
        conn.commit()
except Exception:
    pass

def purge_demo_records_on_startup():
    """Removes all seeded demo users, demo consultations, and demo listings from the database."""
    db = SessionLocal()
    try:
        demo_emails = {
            "admin@aifarm.org",
            "farmer.ramesh@aifarm.org",
            "farmer.ramesh@gmail.com",
            "farmer.rames@gmail.com",
            "dr.mohapatra@aifarm.org",
            "dr.mohapatra@gmail.com",
            "seller.kisan@aifarm.org",
            "seller.kisan@gmail.com",
            "buyer.trading@aifarm.org",
            "buyer.trading@gmail.com",
            "farmer_face_test@gmail.com",
            "farmer_fp_test@gmail.com"
        }
        demo_names = {
            "ramesh patel",
            "ramesh chandra patel",
            "ramesh pradhan",
            "sita devi",
            "kishan kumar",
            "dr. debabrata mohapatra",
            "dr. p. k. mohapatra (plant pathologist)",
            "dr. p.k. mohapatra",
            "sunil agrochemicals",
            "sunil sahoo (kisan agro inputs)",
            "utkal agro traders",
            "utkal fresh produce traders",
            "system administrator",
            "agritech directorate admin"
        }

        all_users = db.query(User).all()
        demo_user_ids = []
        for u in all_users:
            email_low = (u.email or "").lower()
            name_low = (u.full_name or "").strip().lower()
            if (
                email_low in demo_emails
                or email_low.startswith("farmer_face_")
                or email_low.startswith("farmer_fp_")
                or email_low.startswith("farmer_vec_")
                or email_low.startswith("farmer_std_")
                or name_low in demo_names
                or "ramesh patel" in name_low
            ):
                demo_user_ids.append(u.id)

        if demo_user_ids:
            db.query(ExpertConsultation).filter(ExpertConsultation.farmer_id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.query(DiseasePrediction).filter(DiseasePrediction.farmer_id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.query(BuyerListing).filter(BuyerListing.farmer_id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.query(Notification).filter(Notification.user_id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.query(FarmerProfile).filter(FarmerProfile.user_id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.query(ExpertProfile).filter(ExpertProfile.user_id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.query(SellerProfile).filter(SellerProfile.user_id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.query(BuyerProfile).filter(BuyerProfile.user_id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(demo_user_ids)).delete(synchronize_session=False)
            db.commit()

        # Also clean any orphaned consultations or listings
        valid_user_ids = [u.id for u in db.query(User).all()]
        if valid_user_ids:
            db.query(ExpertConsultation).filter(~ExpertConsultation.farmer_id.in_(valid_user_ids)).delete(synchronize_session=False)
            db.query(BuyerListing).filter(~BuyerListing.farmer_id.in_(valid_user_ids)).delete(synchronize_session=False)
        else:
            db.query(ExpertConsultation).delete(synchronize_session=False)
            db.query(BuyerListing).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        print("Startup demo cleanup note:", e)
    finally:
        db.close()

purge_demo_records_on_startup()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI Farm Co-Pilot, Leaf Disease Computer Vision Scanner, Farm Business Planner & APMC Market Optimizer.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1)
app.include_router(farms.router, prefix=api_v1)
app.include_router(fields.router, prefix=api_v1)
app.include_router(crops.router, prefix=api_v1)
app.include_router(disease.router, prefix=api_v1)
app.include_router(predictions.router, prefix=api_v1)
app.include_router(copilot.router, prefix=api_v1)
app.include_router(weather.router, prefix=api_v1)
app.include_router(soil.router, prefix=api_v1)
app.include_router(business.router, prefix=api_v1)
app.include_router(expenses.router, prefix=api_v1)
app.include_router(income.router, prefix=api_v1)
app.include_router(markets.router, prefix=api_v1)
app.include_router(buyers.router, prefix=api_v1)
app.include_router(experts.router, prefix=api_v1)
app.include_router(sellers.router, prefix=api_v1)
app.include_router(admin.router, prefix=api_v1)
app.include_router(notifications.router, prefix=api_v1)

# Mount static and upload directories
STATIC_DIR = PROJECT_ROOT / "frontend" / "static"
LOCALES_DIR = PROJECT_ROOT / "frontend" / "locales"

app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
app.mount("/locales", StaticFiles(directory=str(LOCALES_DIR)), name="locales")

@app.get("/")
async def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(
            str(index_file),
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    return {"message": "AI Farm Co-Pilot API is running", "docs": "/docs"}

@app.get("/download/zip")
@app.get("/download/ai-farm-copilot.zip")
async def download_project_zip():
    zip_path = PROJECT_ROOT.parent / "ai-farm-copilot.zip"
    if not zip_path.exists():
        zip_path = PROJECT_ROOT / "ai-farm-copilot.zip"
    if zip_path.exists():
        return FileResponse(
            path=str(zip_path),
            filename="ai-farm-copilot.zip",
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=ai-farm-copilot.zip"}
        )
    return JSONResponse(status_code=404, content={"detail": "ZIP archive not found on server"})

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "active_model": settings.ACTIVE_MODEL_VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=False)
