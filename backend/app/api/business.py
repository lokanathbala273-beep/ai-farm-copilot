from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.models.database import get_db
from backend.app.models.tables import User, BusinessPlan, Farm
from backend.app.schemas.schemas import BusinessPlanCreate
from backend.app.auth.security import get_current_user
from backend.app.services.business_service import business_service

router = APIRouter(prefix="/business", tags=["Farm Business Maker"])

@router.post("/calculate")
def calculate_plan(plan_in: BusinessPlanCreate):
    calc = business_service.calculate_business_plan(plan_in.model_dump())
    return calc

@router.post("/save")
def save_plan(plan_in: BusinessPlanCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == plan_in.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    calc = business_service.calculate_business_plan(plan_in.model_dump())

    plan = BusinessPlan(
        farmer_id=current_user.id,
        farm_id=plan_in.farm_id,
        crop=plan_in.crop,
        land_area_acres=plan_in.land_area_acres,
        seed_cost=plan_in.seed_cost,
        fertilizer_cost=plan_in.fertilizer_cost,
        labour_cost=plan_in.labour_cost,
        irrigation_cost=plan_in.irrigation_cost,
        crop_protection_cost=plan_in.crop_protection_cost,
        equipment_cost=plan_in.equipment_cost,
        transport_cost=plan_in.transport_cost,
        other_cost=plan_in.other_cost,
        expected_yield_quintals=plan_in.expected_yield_quintals,
        expected_selling_price_per_quintal=plan_in.expected_selling_price_per_quintal,
        estimated_total_cost=calc["estimated_total_cost"],
        estimated_revenue=calc["estimated_revenue"],
        estimated_net_return=calc["estimated_net_return"]
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {
        "plan_id": plan.id,
        "calculation": calc
    }

@router.get("/plans")
def list_plans(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plans = db.query(BusinessPlan).filter(BusinessPlan.farm_id == farm_id).order_by(BusinessPlan.created_at.desc()).all()
    return plans
