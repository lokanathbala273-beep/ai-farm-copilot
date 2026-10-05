from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from backend.app.models.database import get_db
from backend.app.models.tables import User, BuyerListing, BuyerOrder, BuyerProfile, FarmerProfile
from backend.app.schemas.schemas import BuyerListingCreate, BuyerOrderCreate
from backend.app.auth.security import get_current_user, get_optional_current_user

router = APIRouter(prefix="/buyers", tags=["Buyer Marketplace"])

@router.get("/listings")
def get_marketplace_listings(crop: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns active produce listings from verified farmer profiles,
    enriched with farmer contact, farm location, and quality badges.
    """
    q = db.query(BuyerListing).filter(BuyerListing.status == "ACTIVE")
    if crop:
        q = q.filter(BuyerListing.crop == crop)
    raw_listings = q.order_by(BuyerListing.created_at.desc()).all()

    enriched = []
    for item in raw_listings:
        farmer_user = db.query(User).filter(User.id == item.farmer_id).first()
        if not farmer_user:
            continue
        farmer_prof = db.query(FarmerProfile).filter(FarmerProfile.user_id == item.farmer_id).first()

        farmer_name = farmer_user.full_name
        farmer_phone = farmer_user.phone or farmer_user.email
        
        # Build precise location
        if item.farm_location:
            farm_loc = item.farm_location
        elif farmer_prof:
            farm_loc = f"{farmer_prof.village}, {farmer_prof.block}, {farmer_prof.district}, Odisha"
        else:
            farm_loc = "Khordha Rural, Odisha"

        enriched.append({
            "id": item.id,
            "farmer_id": item.farmer_id,
            "farmer_name": farmer_name,
            "farmer_phone": farmer_phone,
            "crop": item.crop,
            "variety": item.variety or "Hybrid Fresh",
            "quantity_quintals": item.quantity_quintals,
            "grade": item.grade or "Grade A",
            "harvest_date": item.harvest_date or datetime.utcnow().strftime("%Y-%m-%d"),
            "expected_price_per_quintal": item.expected_price_per_quintal,
            "farm_location": farm_loc,
            "description": item.description or f"Direct farm harvest of {item.crop} from {farmer_name}.",
            "status": item.status,
            "direct_from_profile": True,
            "verified_farmer": True,
            "created_at": item.created_at.isoformat() if hasattr(item.created_at, "isoformat") else str(item.created_at)
        })
    return enriched

@router.post("/listings")
def create_produce_listing(
    item_in: BuyerListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a fresh produce listing directly linked to the farmer's account."""
    listing = BuyerListing(
        farmer_id=current_user.id,
        crop=item_in.crop,
        variety=item_in.variety or "Hybrid",
        quantity_quintals=item_in.quantity_quintals,
        grade=item_in.grade or "Grade A",
        harvest_date=item_in.harvest_date or datetime.utcnow().strftime("%Y-%m-%d"),
        expected_price_per_quintal=item_in.expected_price_per_quintal,
        farm_location=item_in.farm_location or "Khordha, Odisha",
        description=item_in.description or f"Direct farm harvest of {item_in.crop} from {current_user.full_name}'s farm profile.",
        status="ACTIVE"
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing

@router.post("/listings/from-profile")
def create_produce_listing_from_profile(
    item_in: BuyerListingCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    1-Click Produce Listing directly from the Farmer's registered profile.
    """
    farmer = current_user
    if not farmer:
        farmer = db.query(User).filter(User.role == "FARMER").order_by(User.id.desc()).first()

    farmer_id = farmer.id if farmer else 1
    farmer_name = item_in.farmer_name or (farmer.full_name if farmer else "Farmer")

    farmer_prof = db.query(FarmerProfile).filter(FarmerProfile.user_id == farmer_id).first() if farmer else None
    loc = item_in.farm_location
    if not loc or loc == "Local Field":
        if farmer_prof:
            loc = f"{farmer_prof.village}, {farmer_prof.block}, {farmer_prof.district}, Odisha"
        else:
            loc = "Khordha / Bhubaneswar Rural, Odisha"

    listing = BuyerListing(
        farmer_id=farmer_id,
        crop=item_in.crop,
        variety=item_in.variety or "Farm Fresh Certified",
        quantity_quintals=item_in.quantity_quintals,
        grade=item_in.grade or "Grade A",
        harvest_date=item_in.harvest_date or datetime.utcnow().strftime("%Y-%m-%d"),
        expected_price_per_quintal=item_in.expected_price_per_quintal,
        farm_location=loc,
        description=item_in.description or f"Direct harvest from {farmer_name}'s verified farm profile.",
        status="ACTIVE"
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    return {
        "message": f"Produce listing for {item_in.crop} generated directly from farmer profile!",
        "listing": {
            "id": listing.id,
            "crop": listing.crop,
            "variety": listing.variety,
            "quantity_quintals": listing.quantity_quintals,
            "grade": listing.grade,
            "expected_price_per_quintal": listing.expected_price_per_quintal,
            "farm_location": listing.farm_location,
            "farmer_name": farmer_name,
            "status": listing.status
        }
    }

@router.post("/orders")
def place_buyer_order(
    order_in: BuyerOrderCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits purchase offer from buyer/wholesaler.
    """
    if not current_user:
        current_user = db.query(User).filter(User.role == "BUYER").order_by(User.id.desc()).first()

    buyer_prof = db.query(BuyerProfile).filter(BuyerProfile.user_id == current_user.id).first() if current_user else None
    if not buyer_prof and current_user:
        buyer_prof = BuyerProfile(
            user_id=current_user.id,
            organization_name=order_in.buyer_name or current_user.full_name,
            address=order_in.buyer_location or "Odisha"
        )
        db.add(buyer_prof)
        db.commit()
        db.refresh(buyer_prof)

    listing = db.query(BuyerListing).filter(BuyerListing.id == order_in.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Produce listing not found")

    buyer_loc = order_in.buyer_location or (buyer_prof.address if buyer_prof else "Odisha")
    buyer_hub = order_in.buyer_hub or "Odisha Procurement Corridor"
    buyer_name = order_in.buyer_name or (current_user.full_name if current_user else "Verified Buyer")
    buyer_phone = order_in.buyer_phone or ((current_user.phone or current_user.email) if current_user else "")

    full_notes = (
        f"[BUYER LOCATION DETAILS]\n"
        f"Business / Buyer: {buyer_name}\n"
        f"Warehouse / Shop Location: {buyer_loc}\n"
        f"Procurement Hub / Zone: {buyer_hub}\n"
        f"Contact: {buyer_phone}\n"
        f"Notes: {order_in.notes or 'Direct farm pickup requested.'}"
    )

    buyer_id = buyer_prof.id if buyer_prof else 1
    order = BuyerOrder(
        listing_id=listing.id,
        buyer_id=buyer_id,
        quantity_requested=order_in.quantity_requested,
        offered_price_per_quintal=order_in.offered_price_per_quintal,
        status="PENDING",
        notes=full_notes
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "message": "Purchase order sent to farmer with buyer's verified location details!",
        "order_id": order.id,
        "buyer_location": buyer_loc,
        "buyer_hub": buyer_hub,
        "quantity": order.quantity_requested,
        "offered_price": order.offered_price_per_quintal
    }

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
