from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.database import get_db
from backend.app.models.tables import User, FarmerProfile, Farm, Field, FarmExpense, DiseasePrediction, PesticideOrder
from backend.app.schemas.schemas import CopilotMessageRequest, CopilotMessageResponse
from backend.app.auth.security import get_current_user
from backend.app.services.copilot_service import copilot_service
from backend.app.services.weather_service import weather_service

router = APIRouter(prefix="/copilot", tags=["AI Farm Co-Pilot"])

@router.post("/chat", response_model=CopilotMessageResponse)
def copilot_chat(
    req: CopilotMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    farm = None
    if req.farm_id:
        farm = db.query(Farm).filter(Farm.id == req.farm_id).first()
    elif profile:
        farm = db.query(Farm).filter(Farm.farmer_id == profile.id).first()

    farm_name = farm.farm_name if farm else "Smart Farm"
    lat = farm.latitude if farm else 20.2961
    lon = farm.longitude if farm else 85.8245

    # Get live weather for farm coordinates
    weather = weather_service.get_weather(lat, lon)

    # Get total recorded expenses
    total_exp = 0.0
    if farm:
        exp_sum = db.query(func.sum(FarmExpense.amount)).filter(FarmExpense.farm_id == farm.id).scalar()
        total_exp = float(exp_sum or 0.0)

    # Get recent disease prediction
    recent_pred = (
        db.query(DiseasePrediction)
        .filter(DiseasePrediction.farmer_id == current_user.id)
        .order_by(DiseasePrediction.created_at.desc())
        .first()
    )
    recent_disease_str = f"{recent_pred.disease} in {recent_pred.crop}" if recent_pred else "None recorded"

    # Get actual Pesticide Orders for this farmer
    user_orders = (
        db.query(PesticideOrder)
        .filter(
            (PesticideOrder.user_id == current_user.id)
            | (PesticideOrder.customer_phone == (current_user.phone or ""))
        )
        .order_by(PesticideOrder.created_at.desc())
        .limit(5)
        .all()
    )
    orders_summary = []
    for o in user_orders:
        prod_names = ", ".join(f"{it.get('name')} (x{it.get('quantity', 1)})" for it in (o.items or []))
        orders_summary.append({
            "order_code": o.order_code,
            "products": prod_names or "Pesticide Item",
            "total_amount": o.total_amount,
            "payment_method": o.payment_method,
            "payment_status": o.payment_status,
            "order_status": o.order_status,
            "razorpay_payment_id": o.razorpay_payment_id,
        })

    # Context compilation
    farmer_ctx = {
        "farm_name": farm_name,
        "current_crops": profile.current_crops if profile and profile.current_crops else ["Rice", "Tomato", "Potato"],
        "total_expenses": total_exp,
        "recent_disease": recent_disease_str,
        "temperature": weather.get("temperature", 28.5),
        "humidity": weather.get("humidity", 78.0),
        "recent_orders": orders_summary,
    }

    result = copilot_service.answer_query(
        query=req.message,
        lang=req.language or "en",
        farmer_context=farmer_ctx
    )

    return result

