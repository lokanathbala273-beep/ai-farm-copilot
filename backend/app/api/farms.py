from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.models.database import get_db
from backend.app.models.tables import User, Farm, FarmerProfile, Field
from backend.app.schemas.schemas import FarmCreate, FarmResponse, FieldResponse, LiveLocationUpdateRequest
from backend.app.auth.security import get_current_user

router = APIRouter(prefix="/farms", tags=["Farm Management"])

@router.get("", response_model=List[FarmResponse])
def get_user_farms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if not profile:
        # If user has no farmer profile yet, create one
        profile = FarmerProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    farms = db.query(Farm).filter(Farm.farmer_id == profile.id).all()
    return farms

@router.post("", response_model=FarmResponse)
def create_farm(farm_in: FarmCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if not profile:
        profile = FarmerProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    farm = Farm(
        farmer_id=profile.id,
        farm_name=farm_in.farm_name,
        location=farm_in.location or "Bhubaneswar Rural",
        latitude=farm_in.latitude or 20.2961,
        longitude=farm_in.longitude or 85.8245,
        area=farm_in.area,
        soil_type=farm_in.soil_type or "Alluvial Loam",
        irrigation_type=farm_in.irrigation_type or "Drip & Borewell",
        ownership_type=farm_in.ownership_type or "Owned",
        farming_method=farm_in.farming_method or "Integrated Pest Management"
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm

@router.get("/{farm_id}")
def get_farm_details(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    fields = db.query(Field).filter(Field.farm_id == farm_id).all()
    return {
        "farm": farm,
        "fields": fields,
        "total_fields": len(fields)
    }

@router.post("/update-location")
def update_live_location(
    loc_in: LiveLocationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if not profile:
        profile = FarmerProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    farm = None
    if loc_in.farm_id:
        farm = db.query(Farm).filter(Farm.id == loc_in.farm_id, Farm.farmer_id == profile.id).first()
    if not farm and profile.farms:
        farm = profile.farms[0]

    if farm:
        farm.latitude = loc_in.latitude
        farm.longitude = loc_in.longitude
        if loc_in.location_name:
            farm.location = loc_in.location_name
        db.commit()
        db.refresh(farm)
        return {
            "success": True,
            "message": "Live farm location updated successfully from device GPS.",
            "farm_id": farm.id,
            "latitude": farm.latitude,
            "longitude": farm.longitude,
            "location": farm.location
        }

    return {
        "success": True,
        "message": "Live coordinates received.",
        "latitude": loc_in.latitude,
        "longitude": loc_in.longitude
    }

