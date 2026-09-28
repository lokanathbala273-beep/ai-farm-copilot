from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from backend.app.models.database import get_db
from backend.app.models.tables import (
    User, UserRole, ExpertConsultation, ExpertProfile, ExpertCorrection,
    DiseasePrediction, Notification, Field, Farm
)
from backend.app.schemas.schemas import ExpertCorrectionCreate
from backend.app.auth.security import get_current_user, require_expert

router = APIRouter(prefix="/experts", tags=["Agricultural Expert Portal"])

class ConsultationCreateRequest(BaseModel):
    crop: str
    disease: str
    confidence: Optional[float] = 0.92
    severity: Optional[str] = "Moderate"
    image_url: Optional[str] = None
    farmer_name: Optional[str] = None
    farmer_phone: Optional[str] = None
    farmer_query: Optional[str] = None
    symptoms: Optional[str] = None
    prediction_id: Optional[int] = None

@router.get("/queue")
def get_consultation_queue(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Retrieves pending and active pathologist cases, displaying leaf scans,
    crop disease diagnosis, farmer details, and prescription status.
    """
    consultations = (
        db.query(ExpertConsultation)
        .order_by(ExpertConsultation.created_at.desc())
        .all()
    )

    if not consultations:
        # Seed an initial demonstration case for pathologist review
        farmer = db.query(User).filter(User.role == "FARMER").first() or db.query(User).first()
        field = db.query(Field).first()
        if farmer and field:
            pred = DiseasePrediction(
                farmer_id=farmer.id,
                farm_id=field.farm_id if field else 1,
                field_id=field.id,
                crop="Tomato",
                disease="Early Blight",
                confidence=0.94,
                severity="Moderate",
                image_url="/static/assets/leaf_tomato_early_blight.svg",
                symptoms="Concentric circular brown target rings observed on lower foliar canopy of tomato vines.",
                needs_expert_review=True
            )
            db.add(pred)
            db.commit()
            db.refresh(pred)
            c = ExpertConsultation(
                prediction_id=pred.id,
                farmer_id=farmer.id,
                status="PENDING",
                farmer_query=f"Farmer {farmer.full_name} submitted Tomato leaf scan for verified clinical diagnosis & IPM fungicide dosage from Dr. P.K. Mohapatra."
            )
            db.add(c)
            db.commit()
            consultations = [c]

    results = []
    for c in consultations:
        pred = db.query(DiseasePrediction).filter(DiseasePrediction.id == c.prediction_id).first()
        farmer = db.query(User).filter(User.id == c.farmer_id).first()
        results.append({
            "consultation_id": c.id,
            "prediction_id": c.prediction_id,
            "status": c.status,
            "crop": pred.crop if pred else "Tomato",
            "ai_disease": pred.disease if pred else (c.expert_diagnosis or "Early Blight"),
            "ai_confidence": pred.confidence if pred else 0.92,
            "severity": pred.severity if pred else "Moderate",
            "image_url": pred.image_url if (pred and pred.image_url) else "/static/assets/leaf_tomato_early_blight.svg",
            "farmer_name": farmer.full_name if farmer else "Farmer Account",
            "farmer_phone": farmer.phone if farmer else "+91-9437012345",
            "farmer_query": c.farmer_query or "Farmer requested verified pathological diagnosis and IPM spray prescription.",
            "expert_diagnosis": c.expert_diagnosis,
            "expert_prescription": c.expert_prescription,
            "created_at": c.created_at.isoformat() if hasattr(c.created_at, "isoformat") else str(c.created_at)
        })
    return results

@router.post("/consultations/create")
def submit_case_to_pathologist(
    case_in: ConsultationCreateRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Adds a farmer disease case directly into the Agricultural Expert & Pathologist Review Queue.
    Linked to Dr. P.K. Mohapatra and OUAT clinical pathology panel.
    """
    farmer = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            from backend.app.auth.security import decode_access_token
            payload = decode_access_token(token)
            if payload and "sub" in payload:
                farmer = db.query(User).filter(User.phone == payload["sub"]).first()
        except Exception:
            pass

    if not farmer:
        farmer = db.query(User).filter(User.role == "FARMER").first()
    if not farmer:
        farmer = db.query(User).first()

    farmer_id = farmer.id if farmer else 1

    # Ensure a field exists to associate with prediction
    field = db.query(Field).first()
    field_id = field.id if field else 1

    pred_id = case_in.prediction_id
    if not pred_id:
        # Create a new DiseasePrediction record
        new_pred = DiseasePrediction(
            farmer_id=farmer_id,
            farm_id=field.farm_id if field else 1,
            field_id=field_id,
            crop=case_in.crop,
            disease=case_in.disease,
            confidence=case_in.confidence or 0.92,
            severity=case_in.severity or "Moderate",
            image_url=case_in.image_url or "/static/assets/leaf_tomato_early_blight.svg",
            symptoms=case_in.symptoms or f"Concentric rings and dark brown necrosis observed on lower leaves of {case_in.crop}.",
            possible_causes="Alternaria solani fungal pathogen / high relative humidity (>85%).",
            management="Remove infected lower foliar canopy. Apply Mancozeb 75 WP or Azoxystrobin spray.",
            needs_expert_review=True,
            is_reviewed_by_expert=False
        )
        db.add(new_pred)
        db.commit()
        db.refresh(new_pred)
        pred_id = new_pred.id

    # Create the consultation in the Pathologist Queue
    consultation = ExpertConsultation(
        prediction_id=pred_id,
        farmer_id=farmer_id,
        status="PENDING",
        farmer_query=case_in.farmer_query or f"Farmer {case_in.farmer_name or (farmer.full_name if farmer else 'Farmer')} submitted {case_in.crop} ({case_in.disease}) for urgent clinical review by Dr. P.K. Mohapatra & plant pathologists.",
        created_at=datetime.utcnow()
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    return {
        "message": f"Disease case for {case_in.crop} ({case_in.disease}) successfully submitted to Pathologist Review Queue!",
        "consultation_id": consultation.id,
        "prediction_id": pred_id,
        "status": consultation.status,
        "expert": "Dr. P.K. Mohapatra (OUAT Pathology)"
    }

@router.post("/consultations/{consultation_id}/prescribe")
def prescribe_treatment(
    consultation_id: int,
    diagnosis: str,
    prescription: str,
    notes: Optional[str] = None,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Submits verified clinical diagnosis & prescription from the plant pathologist.
    Notifies the farmer with customized chemical/organic treatment guidelines.
    """
    c = db.query(ExpertConsultation).filter(ExpertConsultation.id == consultation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultation case not found")

    expert_user = None
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            from backend.app.auth.security import decode_access_token
            payload = decode_access_token(token)
            if payload and "sub" in payload:
                expert_user = db.query(User).filter(User.phone == payload["sub"]).first()
        except Exception:
            pass

    if not expert_user:
        expert_user = db.query(User).filter(User.role == "AGRICULTURAL_EXPERT").first()
    if not expert_user:
        expert_user = db.query(User).first()

    expert_prof = db.query(ExpertProfile).filter(ExpertProfile.user_id == expert_user.id).first() if expert_user else None

    c.expert_id = expert_prof.id if expert_prof else 1
    c.expert_diagnosis = diagnosis
    c.expert_prescription = prescription
    c.expert_notes = notes
    c.status = "COMPLETED"
    c.completed_at = datetime.utcnow()

    # Mark prediction reviewed
    pred = db.query(DiseasePrediction).filter(DiseasePrediction.id == c.prediction_id).first()
    if pred:
        pred.is_reviewed_by_expert = True

    # Send in-app notification to the farmer
    expert_title = f"Dr. {expert_user.full_name}" if expert_user else "Dr. P.K. Mohapatra (OUAT)"
    notif = Notification(
        user_id=c.farmer_id,
        title="Expert Pathologist Prescription Ready",
        message=f"{expert_title} completed review for your {pred.crop if pred else 'crop'} case: '{diagnosis}'. Prescription: {prescription[:100]}...",
        alert_type="expert"
    )
    db.add(notif)
    db.commit()

    return {
        "message": f"Clinical prescription recorded and farmer notified by {expert_title}!",
        "consultation_id": c.id,
        "status": c.status,
        "completed_at": c.completed_at.isoformat()
    }

@router.post("/corrections")
def submit_expert_correction(
    correction_in: ExpertCorrectionCreate,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    pred = db.query(DiseasePrediction).filter(DiseasePrediction.id == correction_in.prediction_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")

    expert_prof = db.query(ExpertProfile).filter(ExpertProfile.user_id == current_user.id).first()

    corr = ExpertCorrection(
        prediction_id=pred.id,
        expert_id=expert_prof.id if expert_prof else 1,
        original_disease=pred.disease,
        corrected_disease=correction_in.corrected_disease,
        confidence_rating=correction_in.confidence_rating,
        botanical_notes=correction_in.botanical_notes,
        verified_for_training=True
    )
    db.add(corr)
    db.commit()
    db.refresh(corr)

    return {"message": "Expert pathological correction saved for dataset validation loop.", "correction_id": corr.id}
