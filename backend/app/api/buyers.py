from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.models.database import get_db
from backend.app.models.tables import User, BuyerListing, BuyerOrder, BuyerProfile
from backend.app.schemas.schemas import BuyerListingCreate, BuyerOrderCreate
from backend.app.auth.security import get_current_user

router = APIRouter(prefix="/buyers", tags=["Buyer Marketplace"])

@router.get("/listings")
def get_marketplace_listings(crop: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(BuyerListing).filter(BuyerListing.status == "ACTIVE")
    if crop:
        q = q.filter(BuyerListing.crop == crop)
    return q.order_by(BuyerListing.created_at.desc()).all()

@router.post("/listings")
def create_produce_listing(
    item_in: BuyerListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    listing = BuyerListing(
        farmer_id=current_user.id,
        crop=item_in.crop,
        variety=item_in.variety or "Hybrid",
        quantity_quintals=item_in.quantity_quintals,
        grade=item_in.grade,
        harvest_date=item_in.harvest_date,
        expected_price_per_quintal=item_in.expected_price_per_quintal,
        farm_location=item_in.farm_location,
        description=item_in.description,
        status="ACTIVE"
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing

@router.post("/orders")
def place_buyer_order(
    order_in: BuyerOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    buyer_prof = db.query(BuyerProfile).filter(BuyerProfile.user_id == current_user.id).first()
    if not buyer_prof:
        buyer_prof = BuyerProfile(user_id=current_user.id)
        db.add(buyer_prof)
        db.commit()
        db.refresh(buyer_prof)

    listing = db.query(BuyerListing).filter(BuyerListing.id == order_in.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Produce listing not found")

    order = BuyerOrder(
        listing_id=listing.id,
        buyer_id=buyer_prof.id,
        quantity_requested=order_in.quantity_requested,
        offered_price_per_quintal=order_in.offered_price_per_quintal,
        status="PENDING",
        notes=order_in.notes
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

@router.get("/orders")
def get_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    buyer_prof = db.query(BuyerProfile).filter(BuyerProfile.user_id == current_user.id).first()
    if buyer_prof:
        return db.query(BuyerOrder).filter(BuyerOrder.buyer_id == buyer_prof.id).all()
    # If farmer, get orders for their listings
    orders = (
        db.query(BuyerOrder)
        .join(BuyerListing)
        .filter(BuyerListing.farmer_id == current_user.id)
        .all()
    )
    return orders
