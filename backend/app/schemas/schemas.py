from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

# Auth & User schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    role: str
    full_name: str
    preferred_language: str
    specialization: Optional[str] = None
    farm_name: Optional[str] = None

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    phone: Optional[str] = None
    phone_number: Optional[str] = None
    role: str = "FARMER"  # FARMER, AGRICULTURAL_EXPERT, SELLER, BUYER, ADMIN
    preferred_language: str = "en"
    
    # Leaf Disease Expert specialization / Farm / Establishment name
    leaf_disease_expert: Optional[str] = None
    farm_name: Optional[str] = None
    location: Optional[str] = "Khordha, Odisha"
    state: Optional[str] = "Odisha"
    district: Optional[str] = "Khordha"
    block: Optional[str] = "Bhubaneswar"
    village: Optional[str] = "Patia"
    total_land_area: Optional[float] = 5.0
    irrigation_type: Optional[str] = "Canal & Borewell"
    soil_type: Optional[str] = "Alluvial Loam"
    farming_experience_years: Optional[int] = 10
    farming_method: Optional[str] = "Integrated Farming"
    biometric_enrolled: Optional[bool] = False
    biometric_token: Optional[str] = None
    face_enrolled: Optional[bool] = False
    face_token: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: Optional[str] = None
    role: Optional[str] = "FARMER"
    full_name: Optional[str] = None
    leaf_disease_expert: Optional[str] = None
    farm_name: Optional[str] = None
    biometric_token: Optional[str] = None
    face_token: Optional[str] = None

class OtpSendRequest(BaseModel):
    phone: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[str] = "FARMER"
    full_name: Optional[str] = None

class OtpSendResponse(BaseModel):
    success: bool
    message: str
    phone: str
    phone_number: Optional[str] = None
    expires_in_seconds: int = 300
    simulated_otp: Optional[str] = None
    demo_otp: Optional[str] = None

class OtpVerifyRequest(BaseModel):
    phone: Optional[str] = None
    phone_number: Optional[str] = None
    otp_code: str
    full_name: Optional[str] = None
    role: Optional[str] = None
    preferred_language: Optional[str] = "en"
    farm_name: Optional[str] = None
    location: Optional[str] = None
    land_area: Optional[float] = None

class LiveLocationUpdateRequest(BaseModel):
    farm_id: Optional[int] = None
    latitude: float
    longitude: float
    location_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    phone: Optional[str] = None
    full_name: str
    role: str
    preferred_language: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Farm & Field schemas
class FarmCreate(BaseModel):
    farm_name: str
    location: Optional[str] = "Bhubaneswar Rural"
    latitude: Optional[float] = 20.2961
    longitude: Optional[float] = 85.8245
    area: float = 5.0
    soil_type: Optional[str] = "Alluvial Loam"
    irrigation_type: Optional[str] = "Drip & Borewell"
    ownership_type: Optional[str] = "Owned"
    farming_method: Optional[str] = "Integrated Pest Management"

class FarmResponse(BaseModel):
    id: int
    farmer_id: int
    farm_name: str
    location: str
    latitude: float
    longitude: float
    area: float
    soil_type: str
    irrigation_type: str
    ownership_type: str
    farming_method: str
    created_date: datetime

    class Config:
        from_attributes = True

class FieldCreate(BaseModel):
    farm_id: int
    field_name: str
    area: float = 2.0
    crop: str
    variety: Optional[str] = "High-Yield Hybrid"
    planting_date: Optional[str] = None
    expected_harvest_date: Optional[str] = None
    growth_stage: Optional[str] = "Vegetative"
    soil_type: Optional[str] = "Alluvial Loam"
    irrigation: Optional[str] = "Drip"
    current_health: Optional[str] = "healthy"
    notes: Optional[str] = None

class FieldResponse(BaseModel):
    id: int
    farm_id: int
    field_name: str
    area: float
    crop: str
    variety: Optional[str]
    planting_date: Optional[str]
    expected_harvest_date: Optional[str]
    growth_stage: Optional[str]
    soil_type: Optional[str]
    irrigation: Optional[str]
    current_health: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Soil intelligence schemas
class SoilTestCreate(BaseModel):
    farm_id: int
    ph: float = 6.5
    nitrogen_kg_ha: float = 240.0
    phosphorus_kg_ha: float = 22.0
    potassium_kg_ha: float = 180.0
    organic_carbon_pct: float = 0.55
    moisture_pct: float = 45.0
    soil_type: str = "Alluvial Loam"
    notes: Optional[str] = None

class SoilAnalysisResponse(BaseModel):
    ph_status: str
    nitrogen_status: str
    phosphorus_status: str
    potassium_status: str
    organic_carbon_status: str
    overall_fertility_score: float
    crop_suitability: List[Dict[str, Any]]
    recommendations: List[str]
    management_guidance: str

# Disease Prediction Schemas
class DiseasePredictionResponse(BaseModel):
    prediction_id: int
    crop: str
    disease: str
    confidence: float
    severity: str
    image_url: str
    symptoms: Optional[str]
    possible_causes: Optional[str]
    prevention: Optional[str]
    management: Optional[str]
    treatment_guidance: List[Dict[str, Any]]
    needs_expert_review: bool
    model_version: str
    is_reviewed_by_expert: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Expert Consultation Schemas
class ExpertConsultationCreate(BaseModel):
    prediction_id: int
    farmer_query: Optional[str] = None

class ExpertCorrectionCreate(BaseModel):
    prediction_id: int
    corrected_disease: str
    confidence_rating: float = 1.0
    botanical_notes: str
    prescription: Optional[str] = None

# Business & Finance Schemas
class FarmExpenseCreate(BaseModel):
    farm_id: int
    field_id: Optional[int] = None
    amount: float
    category: str
    date: str
    notes: Optional[str] = None
    raw_voice_transcript: Optional[str] = None

class ExpenseVoiceParseRequest(BaseModel):
    transcript: str

class ExpenseVoiceParseResponse(BaseModel):
    amount: Optional[float]
    category: Optional[str]
    date: str
    confidence: float
    raw_text: str

class FarmIncomeCreate(BaseModel):
    farm_id: int
    field_id: Optional[int] = None
    crop: str
    quantity_quintals: float
    selling_price_per_quintal: float
    buyer_name: Optional[str] = None
    market_name: Optional[str] = None
    date: str
    transport_cost: float = 0.0
    other_costs: float = 0.0

class BusinessPlanCreate(BaseModel):
    farm_id: int
    crop: str
    land_area_acres: float
    seed_cost: float
    fertilizer_cost: float
    labour_cost: float
    irrigation_cost: float
    crop_protection_cost: float
    equipment_cost: float
    transport_cost: float
    other_cost: float
    expected_yield_quintals: float
    expected_selling_price_per_quintal: float

# Market Optimizer Schemas
class MarketComparisonRequest(BaseModel):
    crop: str
    quantity_quintals: float = 50.0
    farmer_location: Optional[str] = "Khordha / Bhubaneswar"
    grade: Optional[str] = "Grade A"

class MarketOption(BaseModel):
    market_name: str
    state: str
    district: str
    modal_price_per_quintal: float
    gross_revenue: float
    distance_km: float
    transport_cost: float
    total_transport_cost: Optional[float] = None
    transport_cost_per_qtl: Optional[float] = None
    transport_rate_per_km_quintal: Optional[float] = None
    market_fees: float
    mandi_fee_pct: Optional[float] = 1.5
    mandi_fee_per_qtl: Optional[float] = None
    total_mandi_fee: Optional[float] = None
    net_realization: float
    net_price_per_quintal: float
    is_recommended: bool
    rank: Optional[int] = 0
    source: str
    daily_date: Optional[str] = None
    daily_analysis_day: Optional[str] = None
    crop: Optional[str] = None
    quantity_quintals: Optional[float] = None
    grade: Optional[str] = None
    last_updated: str

# Buyer Marketplace Schemas
class BuyerListingCreate(BaseModel):
    crop: str
    variety: Optional[str] = "Hybrid"
    quantity_quintals: float
    grade: str = "Grade A"
    harvest_date: Optional[str] = None
    expected_price_per_quintal: float
    farm_location: Optional[str] = "Khordha, Odisha"
    description: Optional[str] = None
    farmer_name: Optional[str] = None
    farmer_phone: Optional[str] = None

class BuyerOrderCreate(BaseModel):
    listing_id: int
    quantity_requested: float
    offered_price_per_quintal: float
    notes: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_location: Optional[str] = None
    buyer_hub: Optional[str] = None
    buyer_phone: Optional[str] = None

# Copilot Schemas
class CopilotMessageRequest(BaseModel):
    message: str
    language: str = "en"  # en, od, hi
    farm_id: Optional[int] = None
    crop_context: Optional[str] = None

class CopilotMessageResponse(BaseModel):
    reply: str
    language: str
    detected_intent: str
    action_suggested: Optional[str] = None
    context_used: Dict[str, Any]

# Product & Seller Schemas
class ProductCreate(BaseModel):
    product_name: str
    product_type: str = "Fungicide"
    active_ingredient: str
    target_crop: str
    target_disease: str
    application_method: str = "Foliar Spray"
    dosage_rate: str = "2.5 g / Litre"
    manufacturer: str
    pack_size: str = "500 g"
    price: float
    stock: int = 100
    approval_number: Optional[str] = "CIB&RC-2024-REG"
    safety_warning: Optional[str] = "Wear safety gloves and masks."
    region: Optional[str] = "Eastern Odisha"
