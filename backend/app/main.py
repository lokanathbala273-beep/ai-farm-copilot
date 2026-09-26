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
from backend.app.models.database import engine, Base
from backend.app.api import (
    auth, farms, fields, crops, disease, predictions,
    copilot, weather, soil, business, expenses, income,
    markets, buyers, experts, sellers, admin, notifications
)

# Ensure tables exist
Base.metadata.create_all(bind=engine)

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
        return FileResponse(str(index_file))
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
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
