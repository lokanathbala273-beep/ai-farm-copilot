from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.database import get_db
from backend.app.models.tables import User, FarmExpense, Farm
from backend.app.schemas.schemas import FarmExpenseCreate, ExpenseVoiceParseRequest, ExpenseVoiceParseResponse
from backend.app.auth.security import get_current_user
from backend.app.services.business_service import business_service

router = APIRouter(prefix="/expenses", tags=["Farm Expense Tracker"])

@router.post("/parse-voice", response_model=ExpenseVoiceParseResponse)
def parse_voice_expense(req: ExpenseVoiceParseRequest):
    return business_service.parse_voice_expense(req.transcript)

@router.post("")
def add_expense(
    exp_in: FarmExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == exp_in.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    expense = FarmExpense(
        farmer_id=current_user.id,
        farm_id=exp_in.farm_id,
        field_id=exp_in.field_id,
        amount=exp_in.amount,
        category=exp_in.category,
        date=exp_in.date,
        notes=exp_in.notes,
        raw_voice_transcript=exp_in.raw_voice_transcript
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.get("")
def list_expenses(
    farm_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(FarmExpense).filter(FarmExpense.farmer_id == current_user.id)
    if farm_id:
        q = q.filter(FarmExpense.farm_id == farm_id)
    return q.order_by(FarmExpense.created_at.desc()).all()

@router.get("/summary")
def get_expenses_summary(
    farm_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(FarmExpense).filter(FarmExpense.farmer_id == current_user.id)
    if farm_id:
        q = q.filter(FarmExpense.farm_id == farm_id)
    expenses = q.all()

    total_amount = sum(e.amount for e in expenses)
    by_category = {}
    for e in expenses:
        by_category[e.category] = by_category.get(e.category, 0.0) + e.amount

    return {
        "total_expenses": round(total_amount, 2),
        "total_entries": len(expenses),
        "category_breakdown": by_category
    }
