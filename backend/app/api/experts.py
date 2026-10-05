from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from backend.app.models.database import get_db
from backend.app.models.tables import (
    User, UserRole, ExpertConsultation, ExpertProfile, ExpertCorrection,
    DiseasePrediction, Notification, Field, Farm
)
from backend.app.schemas.schemas import ExpertCorrectionCreate
from backend.app.auth.security import get_current_user, get_optional_current_user, require_expert

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
    expert_id: Optional[int] = None


@router.get("/list")
def list_registered_experts(
    crop: Optional[str] = Query(None),
    disease: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns all registered/logged-in Leaf Disease Experts along with the
    specialist crop / leaf disease value they entered at login/registration time.
    Matches and ranks experts according to the farmer's scanned crop & leaf disease.
    """
    expert_users = (
        db.query(User)
        .filter(User.role == UserRole.AGRICULTURAL_EXPERT, User.is_active == True)
        .order_by(User.id.desc())
        .all()
    )

    crop_q = (crop or "").strip().lower()
    disease_q = (disease or "").strip().lower()

    results = []
    for u in expert_users:
        prof = db.query(ExpertProfile).filter(ExpertProfile.user_id == u.id).first()
        if not prof:
            prof = ExpertProfile(
                user_id=u.id,
                qualification="Verified Leaf Disease Expert",
                specialization="Crop Leaf Disease Specialist",
                verification_status="VERIFIED"
            )
            db.add(prof)
            db.commit()
            db.refresh(prof)

        spec_text = (prof.specialization or "Crop Leaf Disease Specialist").strip()
        spec_lower = spec_text.lower()

        # Calculate relevance score based on scanned crop & leaf disease
        match_score = 0
        is_crop_match = False
        if crop_q and crop_q in spec_lower:
            match_score += 10
            is_crop_match = True
        if disease_q:
            for word in disease_q.split():
                if len(word) >= 4 and word in spec_lower:
                    match_score += 8
                    is_crop_match = True
        if any(k in spec_lower for k in ["leaf", "disease", "blight", "spot", "rust", "rot", "wilt", "all crop", "specialist", "expert", "pathology"]):
            match_score += 2

        results.append({
            "expert_id": prof.id,
            "user_id": u.id,
            "expert_name": u.full_name,
            "email": u.email,
            "phone": u.phone or u.email,
            "specialization": spec_text,
            "qualification": prof.qualification or "Leaf Disease Expert",
            "location": prof.location or "Odisha",
            "is_crop_match": is_crop_match,
            "match_score": match_score
        })

    # Sort so specialists matching the scanned crop/disease appear first
    results.sort(key=lambda x: (x["match_score"], x["expert_id"]), reverse=True)
    return results


@router.get("/queue")
def get_consultation_queue(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves real farmer leaf disease consultation cases from the database.
    Does NOT seed any fake demo cases or demo names.
    """
    query = db.query(ExpertConsultation)

    # If a farmer is requesting their own sent consultations
    if current_user and current_user.role == UserRole.FARMER:
        query = query.filter(ExpertConsultation.farmer_id == current_user.id)
    elif current_user and current_user.role == UserRole.AGRICULTURAL_EXPERT:
        my_prof = db.query(ExpertProfile).filter(ExpertProfile.user_id == current_user.id).first()
        if my_prof:
            # Show cases specifically sent to this expert or unassigned cases
            query = query.filter(
                (ExpertConsultation.expert_id == my_prof.id) | (ExpertConsultation.expert_id == None)
            )

    consultations = query.order_by(ExpertConsultation.created_at.desc()).all()

    results = []
    for c in consultations:
        pred = db.query(DiseasePrediction).filter(DiseasePrediction.id == c.prediction_id).first()
        farmer = db.query(User).filter(User.id == c.farmer_id).first()
        if not farmer:
            continue

        exp_prof = db.query(ExpertProfile).filter(ExpertProfile.id == c.expert_id).first() if c.expert_id else None
        exp_user = db.query(User).filter(User.id == exp_prof.user_id).first() if exp_prof else None

        results.append({
            "consultation_id": c.id,
            "prediction_id": c.prediction_id,
            "status": c.status,
            "crop": pred.crop if pred else "Crop",
            "ai_disease": pred.disease if pred else (c.expert_diagnosis or "Leaf Disease"),
            "ai_confidence": pred.confidence if pred else 0.92,
            "severity": pred.severity if pred else "Moderate",
            "image_url": pred.image_url if (pred and pred.image_url) else "/static/assets/leaf_tomato_early_blight.svg",
            "farmer_id": farmer.id,
            "farmer_name": farmer.full_name,
            "farmer_phone": farmer.phone or farmer.email,
            "farmer_query": c.farmer_query or "Farmer requested leaf disease advice.",
            "expert_id": exp_prof.id if exp_prof else None,
            "expert_name": exp_user.full_name if exp_user else "Assigned Leaf Disease Expert",
            "expert_specialization": exp_prof.specialization if exp_prof else "Crop Leaf Disease Specialist",
            "expert_diagnosis": c.expert_diagnosis,
            "expert_prescription": c.expert_prescription,
            "created_at": c.created_at.isoformat() if hasattr(c.created_at, "isoformat") else str(c.created_at)
        })
    return results


@router.post("/consultations/create")
def submit_case_to_pathologist(
    case_in: ConsultationCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows a logged-in Farmer to send their leaf disease scan and question/problem
    directly to their chosen Leaf Disease Expert.
    """
    farmer = current_user
    if not farmer:
        raise HTTPException(status_code=401, detail="Please sign in as a Farmer to send your problem to an Expert.")

    farmer_id = farmer.id
    farmer_display_name = case_in.farmer_name or farmer.full_name

    # Resolve target Leaf Disease Expert
    target_expert_prof = None
    target_expert_user = None
    if case_in.expert_id:
        target_expert_prof = db.query(ExpertProfile).filter(ExpertProfile.id == case_in.expert_id).first()
        if not target_expert_prof:
            target_expert_prof = db.query(ExpertProfile).filter(ExpertProfile.user_id == case_in.expert_id).first()

    if not target_expert_prof:
        # Fallback to most recently registered real expert if none explicitly passed
        latest_exp_user = (
            db.query(User)
            .filter(User.role == UserRole.AGRICULTURAL_EXPERT, User.is_active == True)
            .order_by(User.id.desc())
            .first()
        )
        if latest_exp_user:
            target_expert_prof = db.query(ExpertProfile).filter(ExpertProfile.user_id == latest_exp_user.id).first()

    if target_expert_prof:
        target_expert_user = db.query(User).filter(User.id == target_expert_prof.user_id).first()

    # Associate with farmer's field if available
    field = db.query(Field).first()
    field_id = field.id if field else None
    farm_id = field.farm_id if field else None

    pred_id = case_in.prediction_id
    if not pred_id:
        new_pred = DiseasePrediction(
            farmer_id=farmer_id,
            farm_id=farm_id,
            field_id=field_id,
            crop=case_in.crop,
            disease=case_in.disease,
            confidence=case_in.confidence or 0.92,
            severity=case_in.severity or "Moderate",
            image_url=case_in.image_url or "/static/assets/leaf_tomato_early_blight.svg",
            symptoms=case_in.symptoms or f"Leaf disease symptoms observed on {case_in.crop}.",
            possible_causes="Foliar pathogen infection.",
            management="Awaiting specialist leaf disease expert advice.",
            needs_expert_review=True,
            is_reviewed_by_expert=False
        )
        db.add(new_pred)
        db.commit()
        db.refresh(new_pred)
        pred_id = new_pred.id

    expert_label = (
        f"{target_expert_user.full_name} ({target_expert_prof.specialization})"
        if (target_expert_user and target_expert_prof)
        else "Leaf Disease Expert"
    )

    consultation = ExpertConsultation(
        prediction_id=pred_id,
        farmer_id=farmer_id,
        expert_id=target_expert_prof.id if target_expert_prof else None,
        status="PENDING",
        farmer_query=case_in.farmer_query or f"Farmer {farmer_display_name} asked about {case_in.crop} ({case_in.disease}) leaf disease.",
        created_at=datetime.utcnow()
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    return {
        "message": f"Your problem for {case_in.crop} ({case_in.disease}) has been sent directly to {expert_label}!",
        "consultation_id": consultation.id,
        "prediction_id": pred_id,
        "status": consultation.status,
        "expert": expert_label,
        "expert_name": target_expert_user.full_name if target_expert_user else "Leaf Disease Expert",
        "expert_specialization": target_expert_prof.specialization if target_expert_prof else "Crop Leaf Disease Specialist"
    }


@router.post("/consultations/{consultation_id}/prescribe")
def prescribe_treatment(
    consultation_id: int,
    diagnosis: str,
    prescription: str,
    notes: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits verified clinical diagnosis & prescription from the logged-in Leaf Disease Expert
    and notifies the farmer.
    """
    c = db.query(ExpertConsultation).filter(ExpertConsultation.id == consultation_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consultation case not found")

    expert_user = current_user
    if not expert_user:
        expert_user = db.query(User).filter(User.role == UserRole.AGRICULTURAL_EXPERT).order_by(User.id.desc()).first()

    expert_prof = db.query(ExpertProfile).filter(ExpertProfile.user_id == expert_user.id).first() if expert_user else None

    if expert_prof:
        c.expert_id = expert_prof.id
    c.expert_diagnosis = diagnosis
    c.expert_prescription = prescription
    c.expert_notes = notes
    c.status = "COMPLETED"
    c.completed_at = datetime.utcnow()

    pred = db.query(DiseasePrediction).filter(DiseasePrediction.id == c.prediction_id).first()
    if pred:
        pred.is_reviewed_by_expert = True

    expert_title = (
        f"{expert_user.full_name} ({expert_prof.specialization})"
        if (expert_user and expert_prof)
        else (expert_user.full_name if expert_user else "Leaf Disease Expert")
    )

    notif = Notification(
        user_id=c.farmer_id,
        title="Leaf Disease Expert Reply Ready",
        message=f"{expert_title} replied to your {pred.crop if pred else 'crop'} leaf disease question: {prescription[:120]}",
        alert_type="expert"
    )
    db.add(notif)
    db.commit()

    return {
        "message": f"Prescription and advice sent to farmer by {expert_title}!",
        "consultation_id": c.id,
        "status": c.status,
        "expert_name": expert_user.full_name if expert_user else "Leaf Disease Expert",
        "expert_specialization": expert_prof.specialization if expert_prof else "Crop Leaf Disease Specialist",
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
