from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from ai.datasets.disease_kb import DISEASE_DATABASE

router = APIRouter(prefix="/disease", tags=["Plant Pathology Database"])

@router.get("/database")
def get_disease_database(crop: Optional[str] = Query(None, description="Filter by crop name")):
    if crop:
        if crop not in DISEASE_DATABASE:
            raise HTTPException(status_code=404, detail=f"Crop '{crop}' not found in disease database")
        return {crop: DISEASE_DATABASE[crop]}
    return DISEASE_DATABASE

@router.get("/detail")
def get_disease_detail(crop: str, disease: str):
    if crop not in DISEASE_DATABASE or disease not in DISEASE_DATABASE[crop]:
        raise HTTPException(status_code=404, detail="Disease profile not found")
    data = DISEASE_DATABASE[crop][disease]
    return {
        "crop": crop,
        "disease": disease,
        **data
    }
