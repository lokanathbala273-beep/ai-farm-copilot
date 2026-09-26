from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.models.database import get_db
from backend.app.models.tables import User, Farm, FarmerProfile
from backend.app.auth.security import get_current_user
from backend.app.services.weather_service import weather_service

router = APIRouter(prefix="/weather", tags=["Weather Intelligence"])

@router.get("")
def get_current_weather(
    lat: Optional[float] = Query(None, description="Farmer live device GPS latitude"),
    lon: Optional[float] = Query(None, description="Farmer live device GPS longitude"),
    location_name: Optional[str] = Query(None, description="Optional detected location name"),
    farm_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_lat = lat
    target_lon = lon
    region_label = location_name or "Live GPS Location"
    crops = ["Rice", "Tomato", "Potato"]

    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    if profile:
        crops = profile.current_crops or crops

    # If coordinates not provided directly in query, check farm
    if target_lat is None or target_lon is None:
        if farm_id:
            farm = db.query(Farm).filter(Farm.id == farm_id).first()
            if farm:
                target_lat = farm.latitude
                target_lon = farm.longitude
                region_label = farm.location
        elif profile and profile.farms:
            first_farm = profile.farms[0]
            target_lat = first_farm.latitude
            target_lon = first_farm.longitude
            region_label = first_farm.location

    # Default fallback to agricultural belt if still None
    if target_lat is None or target_lon is None:
        target_lat = 20.2961
        target_lon = 85.8245
        region_label = "Khordha / Bhubaneswar"

    # Fetch live weather at exact coordinates
    weather_data = weather_service.get_weather(target_lat, target_lon)
    alerts = weather_service.generate_smart_alerts(weather_data, crops)

    # If live GPS was shared, update farm coordinates in background if available
    if lat is not None and lon is not None and profile and profile.farms:
        active_farm = profile.farms[0]
        active_farm.latitude = lat
        active_farm.longitude = lon
        if location_name:
            active_farm.location = location_name
        db.commit()

    return {
        "location": {
            "latitude": target_lat,
            "longitude": target_lon,
            "region": region_label,
            "is_live_gps": lat is not None and lon is not None
        },
        "weather": weather_data,
        "smart_alerts": alerts
    }
