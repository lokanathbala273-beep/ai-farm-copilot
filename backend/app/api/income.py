from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.models.database import get_db
from backend.app.models.tables import User, FarmIncome, Farm
from backend.app.schemas.schemas import FarmIncomeCreate
from backend.app.auth.security import get_current_user

router = APIRouter(prefix="/income", tags=["Farm Income Tracker"])

@router.post("")
def add_income(
    inc_in: FarmIncomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == inc_in.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    gross = inc_in.quantity_quintals * inc_in.selling_price_per_quintal
    net_realization = gross - inc_in.transport_cost - inc_in.other_costs

    income = FarmIncome(
        farmer_id=current_user.id,
        farm_id=inc_in.farm_id,
        field_id=inc_in.field_id,
        crop=inc_in.crop,
        quantity_quintals=inc_in.quantity_quintals,
        selling_price_per_quintal=inc_in.selling_price_per_quintal,
        buyer_name=inc_in.buyer_name,
        market_name=inc_in.market_name,
        date=inc_in.date,
        transport_cost=inc_in.transport_cost,
        other_costs=inc_in.other_costs,
        net_realization=net_realization
    )
    db.add(income)
    db.commit()
    db.refresh(income)
    return income

@router.get("")
def list_incomes(
    farm_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(FarmIncome).filter(FarmIncome.farmer_id == current_user.id)
    if farm_id:
        q = q.filter(FarmIncome.farm_id == farm_id)
    return q.order_by(FarmIncome.created_at.desc()).all()

@router.get("/summary")
def get_income_summary(
    farm_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(FarmIncome).filter(FarmIncome.farmer_id == current_user.id)
    if farm_id:
        q = q.filter(FarmIncome.farm_id == farm_id)
    incomes = q.all()

    total_net = sum(i.net_realization for i in incomes)
    by_crop = {}
    for i in incomes:
        by_crop[i.crop] = by_crop.get(i.crop, 0.0) + i.net_realization

    return {
        "total_net_income": round(total_net, 2),
        "total_sales_count": len(incomes),
        "crop_breakdown": by_crop
    }
