from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.models.database import get_db
from backend.app.models.tables import User, Field, Farm, FarmerProfile
from backend.app.schemas.schemas import FieldCreate, FieldResponse
from backend.app.auth.security import get_current_user

router = APIRouter(prefix="/fields", tags=["Field Management"])

@router.get("", response_model=List[FieldResponse])
def get_user_fields(farm_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if not profile:
        return []

    if farm_id:
        return db.query(Field).filter(Field.farm_id == farm_id).all()

    # Get all fields for farmer's farms
    farm_ids = [f.id for f in db.query(Farm.id).filter(Farm.farmer_id == profile.id).all()]
    return db.query(Field).filter(Field.farm_id.in_(farm_ids)).all()

@router.post("", response_model=FieldResponse)
def create_field(field_in: FieldCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == field_in.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    field = Field(
        farm_id=field_in.farm_id,
        field_name=field_in.field_name,
        area=field_in.area,
        crop=field_in.crop,
        variety=field_in.variety or "High-Yield Hybrid",
        planting_date=field_in.planting_date,
        expected_harvest_date=field_in.expected_harvest_date,
        growth_stage=field_in.growth_stage or "Vegetative",
        soil_type=field_in.soil_type or "Alluvial Loam",
        irrigation=field_in.irrigation or "Drip",
        current_health=field_in.current_health or "healthy",
        notes=field_in.notes
    )
    db.add(field)
    db.commit()
    db.refresh(field)
    return field

@router.put("/{field_id}/status")
def update_field_health(field_id: int, health_status: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if health_status not in ["healthy", "attention", "disease_risk", "water_stress"]:
        raise HTTPException(status_code=400, detail="Invalid health status")
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    field.current_health = health_status
    db.commit()
    return {"message": "Field status updated successfully", "field_id": field.id, "current_health": health_status}
