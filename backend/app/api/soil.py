import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.auth.security import get_current_user
from backend.app.models.database import get_db
from backend.app.models.tables import Farm, SoilTest, User
from backend.app.services.soil_service import soil_service

router = APIRouter(prefix="/soil", tags=["Soil Intelligence & DSS"])

SOIL_LEDGER_PATH = Path(__file__).resolve().parents[3] / "data" / "soil_history_ledger.json"


def _load_ledger() -> List[Dict[str, Any]]:
    if not SOIL_LEDGER_PATH.exists():
        # Seed with 2 realistic historical lab records for the demo farm so farmers can inspect how multi-date comparison works,
        # plus allow clearing or filtering by farm_id / source.
        default_records = [
            {
                "id": 101,
                "farm_id": 1,
                "test_date": "2025-11-15",
                "data_source_type": "MEASURED_LAB_VALUE",
                "data_source_name": "OUAT Central Soil Testing Lab, Bhubaneswar (SHC #OD-KHO-2025-412)",
                "location": "Odisha > Khordha > Balianta > Balipatna",
                "soil_type": "Deltaic Alluvial",
                "ph": 5.8,
                "nitrogen_kg_ha": 210.0,
                "phosphorus_kg_ha": 18.5,
                "potassium_kg_ha": 155.0,
                "organic_carbon_pct": 0.44,
                "ec_ds_m": 0.32,
                "overall_fertility_score": 68.0,
            },
            {
                "id": 102,
                "farm_id": 1,
                "test_date": "2026-05-10",
                "data_source_type": "MEASURED_LAB_VALUE",
                "data_source_name": "District Soil Testing Lab, Khordha (SHC #OD-KHO-2026-889)",
                "location": "Odisha > Khordha > Balianta > Balipatna",
                "soil_type": "Deltaic Alluvial",
                "ph": 6.3,
                "nitrogen_kg_ha": 248.0,
                "phosphorus_kg_ha": 23.0,
                "potassium_kg_ha": 182.0,
                "organic_carbon_pct": 0.56,
                "ec_ds_m": 0.28,
                "overall_fertility_score": 81.0,
            },
        ]
        SOIL_LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
        SOIL_LEDGER_PATH.write_text(json.dumps(default_records, indent=2), encoding="utf-8")
        return default_records
    try:
        return json.loads(SOIL_LEDGER_PATH.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save_ledger(records: List[Dict[str, Any]]) -> None:
    SOIL_LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
    SOIL_LEDGER_PATH.write_text(json.dumps(records, indent=2), encoding="utf-8")


class SoilDSSRequest(BaseModel):
    farm_id: Optional[int] = 1
    ph: Optional[float] = None
    nitrogen_kg_ha: Optional[float] = None
    phosphorus_kg_ha: Optional[float] = None
    potassium_kg_ha: Optional[float] = None
    organic_carbon_pct: Optional[float] = None
    ec_ds_m: Optional[float] = None
    moisture_pct: Optional[float] = None
    soil_type: Optional[str] = "Alluvial Loam"
    season: Optional[str] = "Kharif"
    water_availability: Optional[str] = "Medium"
    target_crop: Optional[str] = None
    data_source_type: Optional[str] = "MEASURED_LAB_VALUE"
    data_source_name: Optional[str] = "Farmer Submitted Lab Report"
    test_date: Optional[str] = None
    location_label: Optional[str] = None
    weather_context: Optional[Dict[str, Any]] = None
    save_record: Optional[bool] = False


class SoilAssistantQueryRequest(BaseModel):
    question: str
    lang: str = "en"
    soil_context: Optional[Dict[str, Any]] = None


SAMPLE_SHC_REPORTS: Dict[str, str] = {
    "odisha_shc_2026": (
        "Department of Agriculture & Farmers' Empowerment, Govt. of Odisha\n"
        "OUAT Soil Testing Laboratory, Bhubaneswar\n"
        "Soil Health Card Report No: SHC/OD/KHO/2026/0942\n"
        "Sample Date: 2026-08-18\n"
        "Farmer Village: Balipatna, Block: Balianta, District: Khordha\n"
        "Soil Texture: Alluvial Loam\n"
        "----------------------------------------------------\n"
        "1. Soil Reaction (pH): 6.2\n"
        "2. Electrical Conductivity (EC): 0.31 dS/m\n"
        "3. Organic Carbon (OC): 0.58 %\n"
        "4. Available Nitrogen (N): 245 kg/ha\n"
        "5. Available Phosphorus (P2O5): 24.5 kg/ha\n"
        "6. Available Potassium (K2O): 188 kg/ha\n"
        "7. Available Zinc (Zn): 0.74 ppm\n"
        "8. Available Boron (B): 0.58 ppm\n"
        "9. Available Sulphur (S): 12.4 ppm\n"
    ),
    "acidic_laterite_shc": (
        "ICAR - Krishi Vigyan Kendra (KVK) Soil Lab Report\n"
        "Test Date: 12-07-2026\n"
        "Location: Khordha Block, Red Lateritic Belt\n"
        "----------------------------------------------------\n"
        "pH : 5.2\n"
        "EC : 0.19 dS/m\n"
        "Organic Carbon (OC) : 0.38 %\n"
        "Available Nitrogen (N) : 78 kg/acre\n"
        "Available Phosphorus (P) : 6.2 kg/acre\n"
        "Available Potassium (K) : 52 kg/acre\n"
        "Available Zinc (Zn) : 0.45 ppm\n"
    ),
}


@router.get("/locations")
def get_soil_locations():
    """Module 1: State -> District -> Block -> Village hierarchy for Location-Based Soil Intelligence."""
    return {
        "hierarchy": soil_service.get_location_hierarchy(),
        "default_selection": {
            "state": "Odisha",
            "district": "Khordha",
            "block": "Balianta",
            "village": "Balipatna",
        },
    }


@router.get("/regional-lookup")
def lookup_regional_soil_baseline(
    state: str = Query("Odisha"),
    district: str = Query("Khordha"),
    block: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
):
    """Module 1: Lookup verified regional soil records with source, date, resolution, and missing-data flags."""
    return soil_service.lookup_regional_soil(state=state, district=district, block=block, village=village)


@router.post("/ocr-extract")
async def extract_soil_report_endpoint(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    sample_id: Optional[str] = Form(None),
):
    """Module 2: Soil Report Reader (PDF / Image / Text OCR + unit validation + farmer confirmation)."""
    if sample_id and sample_id in SAMPLE_SHC_REPORTS:
        res = soil_service.extract_soil_report_ocr(
            file_bytes=b"",
            filename=f"{sample_id}.txt",
            raw_text_override=SAMPLE_SHC_REPORTS[sample_id],
        )
        res["sample_id"] = sample_id
        return res

    if raw_text and raw_text.strip():
        return soil_service.extract_soil_report_ocr(
            file_bytes=b"",
            filename="manual_text_paste.txt",
            raw_text_override=raw_text,
        )

    if file is not None:
        file_bytes = await file.read()
        return soil_service.extract_soil_report_ocr(
            file_bytes=file_bytes,
            filename=file.filename or "uploaded_report.pdf",
        )

    raise HTTPException(
        status_code=400,
        detail="Please upload a Soil Health Report file (.pdf, .png, .jpg, .txt) or provide report text.",
    )


@router.post("/analyze")
def analyze_soil_parameters(data: SoilDSSRequest):
    """Modules 3, 4, 6, 7 & Legacy Compatibility: Full AI Soil Decision Support System analysis."""
    res = soil_service.analyze_soil_dss(
        ph=data.ph,
        n=data.nitrogen_kg_ha,
        p=data.phosphorus_kg_ha,
        k=data.potassium_kg_ha,
        oc=data.organic_carbon_pct,
        ec=data.ec_ds_m,
        moisture=data.moisture_pct,
        soil_type=data.soil_type or "Alluvial Loam",
        season=data.season or "Kharif",
        water_availability=data.water_availability or "Medium",
        target_crop=data.target_crop,
        data_source_type=data.data_source_type or "MEASURED_LAB_VALUE",
        data_source_name=data.data_source_name or "Farmer Submitted Lab Report",
        test_date=data.test_date,
        weather_context=data.weather_context,
    )

    if data.save_record:
        records = _load_ledger()
        new_entry = {
            "id": int(datetime.utcnow().timestamp() * 1000) % 1000000,
            "farm_id": data.farm_id or 1,
            "test_date": data.test_date or datetime.utcnow().strftime("%Y-%m-%d"),
            "data_source_type": data.data_source_type or "MEASURED_LAB_VALUE",
            "data_source_name": data.data_source_name or "Farmer Verified Soil Assessment",
            "location": data.location_label or "Odisha > Khordha",
            "soil_type": data.soil_type or "Alluvial Loam",
            "ph": data.ph,
            "nitrogen_kg_ha": data.nitrogen_kg_ha,
            "phosphorus_kg_ha": data.phosphorus_kg_ha,
            "potassium_kg_ha": data.potassium_kg_ha,
            "organic_carbon_pct": data.organic_carbon_pct,
            "ec_ds_m": data.ec_ds_m,
            "overall_fertility_score": res.get("overall_fertility_score"),
        }
        records.append(new_entry)
        _save_ledger(records)
        res["saved_record"] = new_entry
        res["trend_analysis"] = soil_service.compute_soil_trends(records)

    return res


@router.post("/save-record")
def save_soil_record_for_trends(data: SoilDSSRequest):
    """Module 5: Save a dated soil assessment into the Soil Health Trend Tracker."""
    records = _load_ledger()
    analysis = soil_service.analyze_soil_dss(
        ph=data.ph,
        n=data.nitrogen_kg_ha,
        p=data.phosphorus_kg_ha,
        k=data.potassium_kg_ha,
        oc=data.organic_carbon_pct,
        ec=data.ec_ds_m,
        moisture=data.moisture_pct,
        soil_type=data.soil_type or "Alluvial Loam",
        season=data.season or "Kharif",
        water_availability=data.water_availability or "Medium",
        target_crop=data.target_crop,
        data_source_type=data.data_source_type or "MEASURED_LAB_VALUE",
        data_source_name=data.data_source_name or "Farmer Verified Soil Report",
        test_date=data.test_date,
    )
    new_entry = {
        "id": int(datetime.utcnow().timestamp() * 1000) % 1000000,
        "farm_id": data.farm_id or 1,
        "test_date": data.test_date or datetime.utcnow().strftime("%Y-%m-%d"),
        "data_source_type": data.data_source_type or "MEASURED_LAB_VALUE",
        "data_source_name": data.data_source_name or "Farmer Verified Soil Report",
        "location": data.location_label or "Odisha > Khordha",
        "soil_type": data.soil_type or "Alluvial Loam",
        "ph": data.ph,
        "nitrogen_kg_ha": data.nitrogen_kg_ha,
        "phosphorus_kg_ha": data.phosphorus_kg_ha,
        "potassium_kg_ha": data.potassium_kg_ha,
        "organic_carbon_pct": data.organic_carbon_pct,
        "ec_ds_m": data.ec_ds_m,
        "overall_fertility_score": analysis.get("overall_fertility_score"),
    }
    records.append(new_entry)
    _save_ledger(records)
    return {
        "status": "saved",
        "record": new_entry,
        "trend_analysis": soil_service.compute_soil_trends(records),
    }


@router.get("/trends")
def get_soil_trends(
    farm_id: int = Query(1),
    mode: str = Query("all", description="'all' returns stored records, 'single' simulates <2 records check"),
):
    """Module 5: Soil Health Trend Tracker (requires >= 2 dated records to compute trends)."""
    records = _load_ledger()
    filtered = [r for r in records if int(r.get("farm_id", 1)) == int(farm_id)] or records
    if mode == "single":
        filtered = filtered[-1:] if filtered else []
    elif mode == "empty":
        filtered = []
    return soil_service.compute_soil_trends(filtered)


@router.post("/assistant-query")
def query_multilingual_soil_assistant(payload: SoilAssistantQueryRequest):
    """Module 6: Multilingual Soil Assistant (English, Odia, Hindi) with explicit source attribution."""
    ctx = payload.soil_context or {}
    q = (payload.question or "").strip().lower()
    lang = payload.lang if payload.lang in ("en", "od", "hi") else "en"

    source_type = ctx.get("data_source_type", "UNKNOWN")
    source_name = ctx.get("data_source_name", "No active soil report")
    ph = ctx.get("ph")
    n = ctx.get("nitrogen_kg_ha")
    p = ctx.get("phosphorus_kg_ha")
    k = ctx.get("potassium_kg_ha")
    oc = ctx.get("organic_carbon_pct")

    is_measured = source_type == "MEASURED_LAB_VALUE"
    source_tag_en = (
        f"[Source: Lab-Measured Report — {source_name}]"
        if is_measured
        else f"[Source: Regional Reference Baseline — {source_name} (NOT an individual plot lab test)]"
    )
    source_tag_od = (
        f"[ଉତ୍ସ: ପରୀକ୍ଷାଗାର ମାପ — {source_name}]"
        if is_measured
        else f"[ଉତ୍ସ: ଆଞ୍ଚଳିକ ହାରାହାରି ତଥ୍ୟ — {source_name} (ଏହା ବ୍ୟକ୍ତିଗତ ଜମିର ଲ୍ୟାବ୍ ରିପୋର୍ଟ ନୁହେଁ)]"
    )
    source_tag_hi = (
        f"[स्रोत: प्रयोगशाला द्वारा मापा गया — {source_name}]"
        if is_measured
        else f"[स्रोत: क्षेत्रीय संदर्भ अनुमान — {source_name} (यह व्यक्तिगत खेत की लैब रिपोर्ट नहीं है)]"
    )

    # Build targeted response based on question keywords while maintaining strict anti-hallucination rules
    if any(w in q for w in ["urea", "dap", "mop", "fertilizer", "dosage", "खाद", "उर्वरक", "ସାର", "ୟୁରିଆ"]):
        if not is_measured or any(v is None for v in [n, p, k]):
            ans = {
                "en": f"{source_tag_en} Exact N-P-K laboratory measurements for your plot are missing or only regional estimates are loaded. To protect your soil and budget, the AI Soil Assistant does NOT fabricate chemical fertilizer (Urea/DAP/MOP) dosages without a verified Soil Health Card. Meanwhile, applying 2–3 tonnes/acre of well-decomposed FYM/compost before sowing is safe and recommended by OUAT.",
                "od": f"{source_tag_od} ଆପଣଙ୍କ ଜମିର ସଠିକ୍ N-P-K ଲ୍ୟାବ୍ ମାପ ଉପଲବ୍ଧ ନାହିଁ। ବିନା ମାটি ପରୀକ୍ଷା ରିପୋର୍ଟରେ AI କୌଣସି ରାସାୟନିକ ସାର (ୟୁରିଆ/ଡିଏপি/ପଟାସ୍) ମାତ୍ରା অনুমান କରେ ନାହିଁ। ବର୍ତ୍ତମାନ ପାଇଁ ଏକର ପ୍ରତି ୨-୩ ଟନ୍ ସଢ଼ା ଗୋବର ଖତ ପ୍ରୟୋଗ କରିବା ସୁରକ୍ଷିତ ଅଟେ।",
                "hi": f"{source_tag_hi} आपके खेत का सटीक N-P-K प्रयोगशाला माप उपलब्ध नहीं है। बिना सत्यापित मृदा स्वास्थ्य कार्ड के AI रासायनिक उर्वरक (यूरिया/डीएपी/एमओपी) की मात्रा का अनुमान नहीं लगाता है। बुवाई से पहले 2–3 टन/एकड़ सड़ी हुई गोबर की खाद (FYM) डालना सुरक्षित है।",
            }
        else:
            n_msg_en = "low (apply 25% above basal N in 3 splits)" if n < 240 else "adequate (apply standard basal N in 3 splits)"
            p_msg_en = "low (apply full basal P at root zone)" if p < 20 else "adequate (apply maintenance basal P)"
            k_msg_en = "low (split potash at basal and panicle/flowering)" if k < 150 else "adequate (standard basal potash)"
            ans = {
                "en": f"{source_tag_en} Based on your measured lab values (N={n} kg/ha [{n_msg_en}], P={p} kg/ha [{p_msg_en}], K={k} kg/ha [{k_msg_en}], pH={ph if ph is not None else 'Untested'}), follow ICAR/OUAT split-application rules and avoid top-dressing Urea during heavy rain forecasts.",
                "od": f"{source_tag_od} ଆପଣଙ୍କ ଲ୍ୟାବ୍ ମାପ ଅନୁଯାୟୀ (N={n} kg/ha, P={p} kg/ha, K={k} kg/ha, pH={ph if ph is not None else 'ଅଜଣା'}), OUAT ନିୟମ ଅନୁସାରେ ସାରକୁ ୩ଟି କିସ୍ତିରେ ପ୍ରୟୋଗ କରନ୍ତୁ ଏବଂ ପ୍ରବଳ ବର୍ଷା ପୂର୍ବାନୁମାନ ଥିଲେ ୟୁରିଆ ପକାନ୍ତୁ ନାହିଁ।",
                "hi": f"{source_tag_hi} आपके लैब माप के अनुसार (N={n} kg/ha, P={p} kg/ha, K={k} kg/ha, pH={ph if ph is not None else 'अज्ञात'}), ICAR/OUAT नियमों के अनुसार उर्वरक को 3 किस्तों में दें और भारी बारिश के पूर्वानुमान के दौरान यूरिया का छिड़काव न करें।",
            }
    elif any(w in q for w in ["crop", "grow", "suitable", "फसल", "ଫସଲ", "ଧାନ"]):
        ans = {
            "en": f"{source_tag_en} With pH={ph if ph is not None else 'Unknown'} and Soil Type={ctx.get('soil_type', 'Alluvial Loam')}, check the Crop Suitability Engine table below for season-matched crops, water requirements, and limiting factors.",
            "od": f"{source_tag_od} ମାଟିର pH={ph if ph is not None else 'ଅଜଣା'} ଏବଂ ମାଟି ପ୍ରକାର={ctx.get('soil_type', 'Alluvial Loam')} ଅନୁଯାୟୀ, ଉପଯୁକ୍ତ ଫସଲ ଓ ସୀମାବଦ୍ଧତା ପାଇଁ ତଳେ ଥିବା 'Crop Suitability Engine' ତାଲিকা ଦେଖନ୍ତୁ।",
            "hi": f"{source_tag_hi} मिट्टी के pH={ph if ph is not None else 'अज्ञात'} और प्रकार={ctx.get('soil_type', 'Alluvial Loam')} के आधार पर उपयुक्त फसलों और सीमाओं के लिए नीचे दी गई 'Crop Suitability Engine' तालिका देखें।",
        }
    else:
        ans = {
            "en": f"{source_tag_en} Measured/Loaded values: pH={ph if ph is not None else 'Missing'}, N={n if n is not None else 'Missing'} kg/ha, P={p if p is not None else 'Missing'} kg/ha, K={k if k is not None else 'Missing'} kg/ha, OC={oc if oc is not None else 'Missing'}%. Values marked 'Missing' were not found in a lab report and are never fabricated.",
            "od": f"{source_tag_od} ବର୍ତ୍ତମାନର ମାଟି ତଥ୍ୟ: pH={ph if ph is not None else 'অনुपस्थित'}, N={n if n is not None else 'অনुपस्थित'} kg/ha, P={p if p is not None else 'অনुपस्थित'} kg/ha, K={k if k is not None else 'অনुपस्थित'} kg/ha, OC={oc if oc is not None else 'অনुपस्थित'}%। ଯେଉଁ ତଥ୍ୟ ଲ୍ୟାବ୍ ରିପୋର୍ଟରେ ନାହିଁ ତାହା ଅନୁମାନ କରାଯାଇ ନାହିଁ।",
            "hi": f"{source_tag_hi} वर्तमान मृदा डेटा: pH={ph if ph is not None else 'अनुपस्थित'}, N={n if n is not None else 'अनुपस्थित'} kg/ha, P={p if p is not None else 'अनुपस्थित'} kg/ha, K={k if k is not None else 'अनुपस्थित'} kg/ha, OC={oc if oc is not None else 'अनुपस्थित'}%। जो मान लैब रिपोर्ट में नहीं हैं उन्हें कभी भी काल्पनिक रूप से नहीं भरा जाता है।",
        }

    return {
        "lang": lang,
        "answer": ans[lang],
        "answers_all_languages": ans,
        "data_source_type": source_type,
        "data_source_name": source_name,
    }


@router.post("/test")
async def create_soil_test(
    farm_id: int = Form(...),
    ph: float = Form(6.5),
    nitrogen_kg_ha: float = Form(240.0),
    phosphorus_kg_ha: float = Form(22.0),
    potassium_kg_ha: float = Form(180.0),
    organic_carbon_pct: float = Form(0.55),
    moisture_pct: float = Form(45.0),
    soil_type: str = Form("Alluvial Loam"),
    notes: Optional[str] = Form(None),
    report_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    report_url = None
    if report_file:
        await report_file.read()
        filename = f"soil_{farm_id}_{report_file.filename}"
        save_path = f"/uploads/soil_reports/{filename}"
        report_url = save_path

    analysis = soil_service.analyze_soil(
        ph=ph,
        n=nitrogen_kg_ha,
        p=phosphorus_kg_ha,
        k=potassium_kg_ha,
        oc=organic_carbon_pct,
        moisture=moisture_pct,
        soil_type=soil_type,
    )

    test = SoilTest(
        farm_id=farm_id,
        ph=ph,
        nitrogen_kg_ha=nitrogen_kg_ha,
        phosphorus_kg_ha=phosphorus_kg_ha,
        potassium_kg_ha=potassium_kg_ha,
        organic_carbon_pct=organic_carbon_pct,
        moisture_pct=moisture_pct,
        soil_type=soil_type,
        report_file_url=report_url,
        analysis_summary=analysis["management_guidance"],
        crop_suitability=analysis["crop_suitability"],
        nutrient_recommendations=analysis["recommendations"],
    )
    db.add(test)
    db.commit()
    db.refresh(test)

    return {
        "test_id": test.id,
        "farm_id": test.farm_id,
        "ph": test.ph,
        "analysis": analysis,
        "created_at": test.created_at.isoformat(),
    }


@router.get("/history")
def get_soil_history(
    farm_id: int = Query(1),
    db: Session = Depends(get_db),
):
    ledger_records = _load_ledger()
    trends = soil_service.compute_soil_trends(ledger_records)
    return {
        "records": ledger_records,
        "trend_analysis": trends,
    }
