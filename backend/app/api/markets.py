from typing import List, Optional
from fastapi import APIRouter
from backend.app.schemas.schemas import MarketComparisonRequest, MarketOption
from backend.app.services.market_service import market_service

router = APIRouter(prefix="/markets", tags=["Market Optimizer"])

@router.get("/prices")
def get_mandi_prices():
    """Returns available APMC market price telemetry with source and freshness."""
    return market_service.MANDI_DATA

@router.post("/optimize", response_model=List[MarketOption])
def optimize_market_routes(req: MarketComparisonRequest):
    """
    Ranks nearby APMC Mandis by Net Realization after calculating
    logistics freight and market commission fees.
    """
    return market_service.optimize_markets(
        crop=req.crop,
        quantity_quintals=req.quantity_quintals,
        grade=req.grade or "Grade A"
    )
