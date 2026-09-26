from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.models.database import get_db
from backend.app.models.tables import User, Product, SellerProfile
from backend.app.schemas.schemas import ProductCreate
from backend.app.auth.security import get_current_user, require_seller

router = APIRouter(prefix="/sellers", tags=["Agricultural Inputs Seller Portal"])

@router.get("/products")
def list_products(
    crop: Optional[str] = None,
    seller_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = db.query(Product).filter(Product.is_approved == True)
    if seller_only:
        prof = db.query(SellerProfile).filter(SellerProfile.user_id == current_user.id).first()
        if prof:
            q = q.filter(Product.seller_id == prof.id)
    if crop:
        q = q.filter(Product.target_crop == crop)
    return q.all()

@router.post("/products")
def add_product(
    prod_in: ProductCreate,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    prof = db.query(SellerProfile).filter(SellerProfile.user_id == current_user.id).first()
    if not prof:
        prof = SellerProfile(user_id=current_user.id)
        db.add(prof)
        db.commit()
        db.refresh(prof)

    product = Product(
        seller_id=prof.id,
        product_name=prod_in.product_name,
        product_type=prod_in.product_type,
        active_ingredient=prod_in.active_ingredient,
        target_crop=prod_in.target_crop,
        target_disease=prod_in.target_disease,
        application_method=prod_in.application_method,
        dosage_rate=prod_in.dosage_rate,
        manufacturer=prod_in.manufacturer,
        pack_size=prod_in.pack_size,
        price=prod_in.price,
        stock=prod_in.stock,
        is_approved=True,
        approval_number=prod_in.approval_number,
        safety_warning=prod_in.safety_warning,
        region=prod_in.region
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/products/{product_id}/stock")
def update_stock(
    product_id: int,
    new_stock: int,
    current_user: User = Depends(require_seller),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    prod.stock = new_stock
    db.commit()
    return {"message": "Stock updated successfully", "product_id": prod.id, "new_stock": prod.stock}
