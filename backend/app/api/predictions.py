import os
import uuid
import base64
import requests
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from PIL import Image
import io

from backend.app.config import settings
from backend.app.models.database import get_db
from backend.app.models.tables import User, DiseasePrediction, ExpertConsultation, Field, Notification
from backend.app.schemas.schemas import DiseasePredictionResponse
from backend.app.auth.security import get_current_user
from ai.models.registry import model_registry
from ai.preprocessing.transforms import validate_image_bytes, ImageValidationError

router = APIRouter(prefix="/disease", tags=["Leaf Disease Detection"])

@router.post("/predict")
async def predict_plant_disease(
    crop: str = Form("Tomato"),
    farm_id: Optional[int] = Form(None),
    field_id: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    webcam_url: Optional[str] = Form(None),  # Remote camera / IP webcam snapshot URL
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes leaf disease prediction pipeline.
    Accepts:
    1. Direct file upload (multipart/form-data)
    2. Base64 encoded snapshot from browser webcam
    3. URL link to webcam / remote IP camera stream snapshot
    """
    file_bytes = b""
    orig_filename = "leaf_scan.jpg"

    # Case 1: Photo capture through URL link of webcam
    if webcam_url and webcam_url.strip():
        try:
            resp = requests.get(webcam_url.strip(), timeout=6)
            if resp.status_code == 200:
                file_bytes = resp.content
                orig_filename = "webcam_url_snapshot.jpg"
            else:
                raise HTTPException(status_code=400, detail=f"Failed to fetch image from webcam URL. Status code: {resp.status_code}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not connect to webcam URL: {str(e)}")

    # Case 2: Base64 webcam snapshot
    elif image_base64 and image_base64.strip():
        try:
            b64_str = image_base64.strip()
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            file_bytes = base64.b64decode(b64_str)
            orig_filename = "webcam_capture.jpg"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {str(e)}")

    # Case 3: Uploaded file
    elif image:
        file_bytes = await image.read()
        orig_filename = image.filename or "upload.jpg"
    else:
        raise HTTPException(
            status_code=400,
            detail="No image provided. Please upload a file, capture from webcam, or provide a webcam URL link."
        )

    # Validate image bytes and format
    try:
        pil_img = validate_image_bytes(file_bytes, orig_filename)
    except ImageValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Save to leaf uploads storage
    file_id = f"{uuid.uuid4().hex[:12]}_{orig_filename.replace(' ', '_')}"
    save_path = settings.LEAF_UPLOAD_DIR / file_id
    try:
        pil_img.save(str(save_path), format="JPEG", quality=90)
    except Exception:
        with open(save_path, "wb") as f:
            f.write(file_bytes)

    image_rel_url = f"/uploads/leaves/{file_id}"

    # Perform modular AI inference
    active_classifier = model_registry.get_active_model()
    pred_res = active_classifier.predict(pil_img, selected_crop=crop)

    # Check non-foliar rejection
    if not pred_res.is_foliar_valid:
        raise HTTPException(
            status_code=400,
            detail="Non-plant foliage detected. Please upload a clear photo of the crop leaf in good lighting."
        )

    # Save prediction in database
    prediction = DiseasePrediction(
        farmer_id=current_user.id,
        farm_id=farm_id,
        field_id=field_id,
        crop=pred_res.crop,
        disease=pred_res.disease,
        confidence=pred_res.confidence,
        severity=pred_res.severity,
        image_url=image_rel_url,
        symptoms=pred_res.symptoms,
        possible_causes=pred_res.possible_causes,
        prevention=pred_res.prevention,
        management=pred_res.management,
        treatment_guidance=pred_res.treatments,
        needs_expert_review=pred_res.needs_expert_review,
        model_version=pred_res.model_version,
        is_reviewed_by_expert=False
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    # If confidence is low, automatically queue for expert review
    if pred_res.needs_expert_review:
        consultation = ExpertConsultation(
            prediction_id=prediction.id,
            farmer_id=current_user.id,
            status="PENDING",
            farmer_query="Low confidence detection (<70%). Requires expert pathological confirmation."
        )
        db.add(consultation)

        # Notify farmer
        notif = Notification(
            user_id=current_user.id,
            title="AI Confidence Advisory",
            message=f"Diagnosis for {pred_res.crop} had lower confidence ({pred_res.confidence*100:.1f}%). Escalated to Agricultural Expert review queue.",
            alert_type="disease"
        )
        db.add(notif)
        db.commit()

    # If field is linked and disease is severe, update field health status
    if field_id:
        fld = db.query(Field).filter(Field.id == field_id).first()
        if fld and pred_res.disease != "Healthy":
            fld.current_health = "disease_risk"
            db.commit()

    return {
        "prediction_id": prediction.id,
        "crop": prediction.crop,
        "disease": prediction.disease,
        "confidence": prediction.confidence,
        "severity": prediction.severity,
        "image_url": prediction.image_url,
        "symptoms": prediction.symptoms,
        "possible_causes": prediction.possible_causes,
        "prevention": prediction.prevention,
        "management": prediction.management,
        "treatment_guidance": prediction.treatment_guidance,
        "needs_expert_review": prediction.needs_expert_review,
        "model_version": prediction.model_version,
        "is_reviewed_by_expert": prediction.is_reviewed_by_expert,
        "top_candidates": pred_res.top_candidates,
        "low_confidence_warning": pred_res.low_confidence_warning,
        "unsupported_or_uncertain_warning": pred_res.unsupported_or_uncertain_warning,
        "safe_next_steps": pred_res.safe_next_steps,
        "created_at": prediction.created_at.isoformat()
    }

@router.get("/history")
def get_prediction_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieves digital leaf scan history for the logged-in farmer."""
    history = (
        db.query(DiseasePrediction)
        .filter(DiseasePrediction.farmer_id == current_user.id)
        .order_by(DiseasePrediction.created_at.desc())
        .limit(50)
        .all()
    )
    return history

@router.get("/history/{prediction_id}")
def get_single_prediction(prediction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record = db.query(DiseasePrediction).filter(DiseasePrediction.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction record not found")
    return record
