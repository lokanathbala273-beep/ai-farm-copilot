from typing import List, Dict, Any
from fastapi import APIRouter
from ai.datasets.disease_kb import CROPS_METADATA, DISEASE_DATABASE

router = APIRouter(prefix="/crops", tags=["Crops & Botany"])

@router.get("")
def list_crops() -> List[Dict[str, Any]]:
    crops_list = []
    for idx, (crop_name, meta) in enumerate(CROPS_METADATA.items(), 1):
        diseases = list(DISEASE_DATABASE.get(crop_name, {}).keys())
        crops_list.append({
            "id": idx,
            "name": crop_name,
            "scientific_name": meta["scientific_name"],
            "category": meta["category"],
            "optimal_temp_range": f"{meta['optimal_temp_min']}°C - {meta['optimal_temp_max']}°C",
            "optimal_humidity_range": f"{meta['optimal_humidity_min']}% - {meta['optimal_humidity_max']}%",
            "growth_duration_days": meta["growth_duration_days"],
            "water_requirement_mm": meta["water_requirement_mm"],
            "tracked_diseases": diseases
        })
    return crops_list
