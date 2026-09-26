from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.models.database import get_db
from backend.app.models.tables import (
    User, UserRole, ExpertConsultation, ExpertProfile, ExpertCorrection,
    DiseasePrediction, Notification
)
from backend.app.schemas.schemas import ExpertCorrectionCreate
from backend.app.auth.security import get_current_user, require_expert

router = APIRouter(prefix="/experts", tags=["Agricultural Expert Portal"])

@router.get("/queue")
def get_consultation_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves pending cases, especially low confidence AI predictions needing human agronomist review."""
    consultations = (
        db.query(ExpertConsultation)
        .order_by(ExpertConsultation.created_at.desc())
        .all()
    )
    results = []
    for c in consultations:
        pred = db.query(DiseasePrediction).filter(DiseasePrediction.id == c.prediction_id).first()
        farmer = db.query(User).filter(User.id == c.farmer_id).first()
        results.append({
            "consultation_id": c.id,
            "prediction_id": c.prediction_id,
            "status": c.status,
            "crop": pred.crop if pred else "Unknown",
            "ai_disease": pred.disease if pred else "Unknown",
            "ai_confidence": pred.confidence if pred else 0.0,
            "severity": pred.severity if pred else "Moderate",
            "image_url": pred.image_url if pred else "",
            "farmer_name": farmer.full_name if farmer else "Farmer",
            "farmer_phone": farmer.phone if farmer else "N/A",
            "farmer_query": c.farmer_query,
            "expert_diagnosis": c.expert_diagnosis,
            "expert_prescription": c.expert_prescription,
            "created_at": c.created_at.isoformat()
        })
    return results

@router.post("/consultations/{consultation_id}/prescribe")
def prescribe_treatment(
    consultation_id: int,
    diagnosis: str,
    prescription: str,
    notes: Optional[str] = None,
    current_user: User = Depends(require_expert),
    db: Session = Depends(get_db)
):
    c = db.query(ExpertConsultation).filter(ExpertConsultation.id == consultation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultation not found")

    expert_prof = db.query(ExpertProfile).filter(ExpertProfile.user_id == current_user.id).first()

    c.expert_id = expert_prof.id if expert_prof else None
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
    notif = Notification(
        user_id=c.farmer_id,
        title="Expert Consultation Completed",
        message=f"Dr. {current_user.full_name} reviewed your {pred.crop if pred else 'crop'} case: '{diagnosis}'. Check the Expert Portal for prescription.",
        alert_type="expert"
    )
    db.add(notif)
    db.commit()

    return {"message": "Prescription recorded and farmer notified", "consultation_id": c.id}

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
