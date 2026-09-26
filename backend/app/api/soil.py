from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from backend.app.models.database import get_db
from backend.app.models.tables import User, SoilTest, Farm
from backend.app.schemas.schemas import SoilTestCreate, SoilAnalysisResponse
from backend.app.auth.security import get_current_user
from backend.app.services.soil_service import soil_service

router = APIRouter(prefix="/soil", tags=["Soil Intelligence"])

@router.post("/analyze", response_model=SoilAnalysisResponse)
def analyze_soil_parameters(data: SoilTestCreate):
    res = soil_service.analyze_soil(
        ph=data.ph,
        n=data.nitrogen_kg_ha,
        p=data.phosphorus_kg_ha,
        k=data.potassium_kg_ha,
        oc=data.organic_carbon_pct,
        moisture=data.moisture_pct,
        soil_type=data.soil_type
    )
    return res

@router.post("/test")
async def create_soil_test(
    farm_id: int = Form(...),
    ph: float = Form(6.5),
    nitrogen_kg_ha: float = Form(240.0),
    phosphorus_kg_ha: float = Form(22.0),
    potassium_kg_ha: float = Form(180.0),
    organic_carbon_pct: float = Form(0.55),
    moisture_pct: float = Form(45.0),
    soil_type: str = Form("Alluvial Loam"),
    notes: Optional[str] = Form(None),
    report_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    report_url = None
    if report_file:
        file_bytes = await report_file.read()
        filename = f"soil_{farm_id}_{report_file.filename}"
        save_path = f"/uploads/soil_reports/{filename}"
        report_url = save_path

    # Run analysis
    analysis = soil_service.analyze_soil(
        ph=ph, n=nitrogen_kg_ha, p=phosphorus_kg_ha, k=potassium_kg_ha,
        oc=organic_carbon_pct, moisture=moisture_pct, soil_type=soil_type
    )

    test = SoilTest(
        farm_id=farm_id,
        ph=ph,
        nitrogen_kg_ha=nitrogen_kg_ha,
        phosphorus_kg_ha=phosphorus_kg_ha,
        potassium_kg_ha=potassium_kg_ha,
        organic_carbon_pct=organic_carbon_pct,
        moisture_pct=moisture_pct,
        soil_type=soil_type,
        notes=notes,
        report_file_url=report_url,
        analysis_summary=analysis["management_guidance"],
        crop_suitability=analysis["crop_suitability"],
        nutrient_recommendations=analysis["recommendations"]
    )
    db.add(test)
    db.commit()
    db.refresh(test)

    return {
        "test_id": test.id,
        "farm_id": test.farm_id,
        "ph": test.ph,
        "analysis": analysis,
        "created_at": test.created_at.isoformat()
    }

@router.get("/history")
def get_soil_history(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tests = db.query(SoilTest).filter(SoilTest.farm_id == farm_id).order_by(SoilTest.created_at.desc()).all()
    return tests
