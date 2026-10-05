import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum, JSON
)
from sqlalchemy.orm import relationship
from backend.app.models.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    FARMER = "FARMER"
    AGRICULTURAL_EXPERT = "AGRICULTURAL_EXPERT"
    SELLER = "SELLER"
    BUYER = "BUYER"

class FieldHealthStatus(str, enum.Enum):
    HEALTHY = "healthy"
    ATTENTION = "attention"
    DISEASE_RISK = "disease_risk"
    WATER_STRESS = "water_stress"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(32), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.FARMER, nullable=False)
    is_active = Column(Boolean, default=True)
    preferred_language = Column(String(10), default="en")  # en, od, hi
    biometric_token = Column(String(255), nullable=True)
    face_token = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False)
    expert_profile = relationship("ExpertProfile", back_populates="user", uselist=False)
    seller_profile = relationship("SellerProfile", back_populates="user", uselist=False)
    buyer_profile = relationship("BuyerProfile", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class FarmerProfile(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    state = Column(String(100), default="Odisha")
    district = Column(String(100), default="Khordha")
    block = Column(String(100), default="Bhubaneswar")
    village = Column(String(100), default="Patia")
    address = Column(String(255), nullable=True)
    total_land_area = Column(Float, default=5.0)  # in acres
    irrigation_type = Column(String(100), default="Canal & Borewell")
    soil_type = Column(String(100), default="Alluvial Loam")
    farming_experience_years = Column(Integer, default=12)
    farming_method = Column(String(100), default="Integrated Farming")
    current_crops = Column(JSON, default=list)  # ["Rice", "Tomato", "Potato"]

    user = relationship("User", back_populates="farmer_profile")
    farms = relationship("Farm", back_populates="farmer", cascade="all, delete-orphan")

class ExpertProfile(Base):
    __tablename__ = "experts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    qualification = Column(String(255), default="Ph.D. in Plant Pathology (OUAT)")
    specialization = Column(String(255), default="Crop Disease & Fungal Diagnostics")
    experience_years = Column(Integer, default=15)
    location = Column(String(255), default="Bhubaneswar, Odisha")
    verification_status = Column(String(50), default="VERIFIED")  # PENDING, VERIFIED, REJECTED
    documents_url = Column(String(255), nullable=True)

    user = relationship("User", back_populates="expert_profile")
    consultations = relationship("ExpertConsultation", back_populates="expert")

class SellerProfile(Base):
    __tablename__ = "sellers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    business_name = Column(String(255), default="Kisan Agro Inputs & Seed Hub")
    owner_name = Column(String(255), default="Sunil Sahoo")
    license_number = Column(String(100), default="OD-AGRI-RET-2024-8841")
    address = Column(String(255), default="Mandi Road, Jatni, Khordha")
    region = Column(String(100), default="Eastern Odisha")
    verification_status = Column(String(50), default="VERIFIED")

    user = relationship("User", back_populates="seller_profile")
    products = relationship("Product", back_populates="seller", cascade="all, delete-orphan")

class BuyerProfile(Base):
    __tablename__ = "buyers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    organization_name = Column(String(255), default="Utkal Agro Trading & Wholesalers")
    buyer_type = Column(String(100), default="Wholesaler & Food Processor")
    address = Column(String(255), default="Aiginia Market Yard, Bhubaneswar")
    preferred_crops = Column(JSON, default=list)  # ["Rice", "Potato", "Tomato", "Onion"]

    user = relationship("User", back_populates="buyer_profile")
    orders = relationship("BuyerOrder", back_populates="buyer")

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    farm_name = Column(String(255), nullable=False)
    location = Column(String(255), default="Bhubaneswar Rural")
    latitude = Column(Float, default=20.2961)
    longitude = Column(Float, default=85.8245)
    area = Column(Float, default=5.0)  # acres
    soil_type = Column(String(100), default="Alluvial Loam")
    irrigation_type = Column(String(100), default="Drip & Borewell")
    ownership_type = Column(String(100), default="Owned")
    farming_method = Column(String(100), default="Integrated Pest Management")
    created_date = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("FarmerProfile", back_populates="farms")
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")
    soil_tests = relationship("SoilTest", back_populates="farm", cascade="all, delete-orphan")
    expenses = relationship("FarmExpense", back_populates="farm")
    incomes = relationship("FarmIncome", back_populates="farm")
    business_plans = relationship("BusinessPlan", back_populates="farm")

class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(255), nullable=False)
    area = Column(Float, default=2.5)  # acres
    crop = Column(String(100), nullable=False)  # Tomato, Rice, Potato, etc.
    variety = Column(String(100), default="High-Yield Hybrid")
    planting_date = Column(String(50), nullable=True)
    expected_harvest_date = Column(String(50), nullable=True)
    growth_stage = Column(String(100), default="Vegetative / Flowering")
    soil_type = Column(String(100), default="Alluvial Loam")
    irrigation = Column(String(100), default="Drip")
    current_health = Column(String(50), default="healthy")  # healthy, attention, disease_risk, water_stress
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="fields")
    predictions = relationship("DiseasePrediction", back_populates="field")

class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    scientific_name = Column(String(150), nullable=True)
    category = Column(String(100), default="Cereal / Vegetable / Fruit")
    optimal_temp_min = Column(Float, default=18.0)
    optimal_temp_max = Column(Float, default=32.0)
    optimal_humidity_min = Column(Float, default=50.0)
    optimal_humidity_max = Column(Float, default=85.0)
    water_requirement_mm = Column(Float, default=500.0)
    growth_duration_days = Column(Integer, default=110)
    created_at = Column(DateTime, default=datetime.utcnow)

    diseases = relationship("Disease", back_populates="crop_obj")

class Disease(Base):
    __tablename__ = "diseases"

    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String(100), index=True, nullable=False)
    disease_name = Column(String(150), index=True, nullable=False)
    scientific_name = Column(String(150), nullable=True)
    disease_type = Column(String(100), default="Fungal")  # Fungal, Bacterial, Viral, Pest, Deficiency
    symptoms = Column(Text, nullable=False)
    visual_symptoms = Column(Text, nullable=True)
    possible_causes = Column(Text, nullable=False)
    risk_factors = Column(Text, nullable=True)
    prevention = Column(Text, nullable=False)
    management = Column(Text, nullable=False)
    treatment_information = Column(Text, nullable=True)
    severity_levels = Column(JSON, default=dict)
    image_reference = Column(String(255), nullable=True)
    source_reference = Column(String(255), default="ICAR / OUAT Agricultural Pathology Handbooks")
    last_updated = Column(DateTime, default=datetime.utcnow)

    crop_obj = relationship("Crop", back_populates="diseases")
    treatments = relationship("DiseaseTreatment", back_populates="disease", cascade="all, delete-orphan")

class DiseaseTreatment(Base):
    __tablename__ = "disease_treatments"

    id = Column(Integer, primary_key=True, index=True)
    disease_id = Column(Integer, ForeignKey("diseases.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    treatment_type = Column(String(50), default="Chemical")  # Cultural, Biological, Chemical
    product_name = Column(String(200), nullable=False)
    active_ingredient = Column(String(200), nullable=False)
    guidance = Column(Text, nullable=False)
    dosage = Column(String(150), nullable=False)
    safety_warning = Column(Text, nullable=True)
    pre_harvest_interval_days = Column(Integer, default=7)
    application_window = Column(String(100), default="Early morning or late afternoon")

    disease = relationship("Disease", back_populates="treatments")
    product = relationship("Product")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("sellers.id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String(200), nullable=False)
    product_type = Column(String(100), default="Fungicide")  # Fungicide, Insecticide, Bio-agent, Fertilizer
    active_ingredient = Column(String(200), nullable=False)
    target_crop = Column(String(100), nullable=False)
    target_disease = Column(String(150), nullable=False)
    application_method = Column(String(150), default="Foliar Spray")
    label_info = Column(Text, nullable=True)
    dosage_rate = Column(String(100), default="2.5 g / Litre of water")
    manufacturer = Column(String(200), default="National Agrochem Ltd.")
    pack_size = Column(String(50), default="500 g")
    price = Column(Float, default=450.0)
    stock = Column(Integer, default=100)
    is_approved = Column(Boolean, default=True)
    approval_number = Column(String(100), default="CIB&RC-2023-AGRI-1092")
    safety_warning = Column(Text, default="Wear protective mask & gloves. Do not apply within 7 days of harvest.")
    region = Column(String(100), default="Eastern India")
    last_updated = Column(DateTime, default=datetime.utcnow)

    seller = relationship("SellerProfile", back_populates="products")

class DiseasePrediction(Base):
    __tablename__ = "disease_predictions"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="SET NULL"), nullable=True)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="SET NULL"), nullable=True)
    crop = Column(String(100), nullable=False)
    disease = Column(String(150), nullable=False)
    confidence = Column(Float, nullable=False)  # 0.0 to 1.0
    severity = Column(String(50), default="Moderate")  # Mild, Moderate, Severe
    image_url = Column(String(500), nullable=False)
    symptoms = Column(Text, nullable=True)
    possible_causes = Column(Text, nullable=True)
    prevention = Column(Text, nullable=True)
    management = Column(Text, nullable=True)
    treatment_guidance = Column(JSON, default=list)
    needs_expert_review = Column(Boolean, default=False)
    model_version = Column(String(100), default="AgroVision-Ensemble-v1.0")
    is_reviewed_by_expert = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    field = relationship("Field", back_populates="predictions")
    consultations = relationship("ExpertConsultation", back_populates="prediction", cascade="all, delete-orphan")
    corrections = relationship("ExpertCorrection", back_populates="prediction", cascade="all, delete-orphan")

class ExpertConsultation(Base):
    __tablename__ = "expert_consultations"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("disease_predictions.id", ondelete="CASCADE"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=True)
    status = Column(String(50), default="PENDING")  # PENDING, ASSIGNED, COMPLETED
    farmer_query = Column(Text, nullable=True)
    expert_diagnosis = Column(String(200), nullable=True)
    expert_prescription = Column(Text, nullable=True)
    expert_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    prediction = relationship("DiseasePrediction", back_populates="consultations")
    expert = relationship("ExpertProfile", back_populates="consultations")

class ExpertCorrection(Base):
    __tablename__ = "expert_corrections"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("disease_predictions.id", ondelete="CASCADE"), nullable=False)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False)
    original_disease = Column(String(150), nullable=False)
    corrected_disease = Column(String(150), nullable=False)
    confidence_rating = Column(Float, default=1.0)
    botanical_notes = Column(Text, nullable=True)
    verified_for_training = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prediction = relationship("DiseasePrediction", back_populates="corrections")

class SoilTest(Base):
    __tablename__ = "soil_tests"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    test_date = Column(DateTime, default=datetime.utcnow)
    ph = Column(Float, default=6.5)
    nitrogen_kg_ha = Column(Float, default=240.0)
    phosphorus_kg_ha = Column(Float, default=22.0)
    potassium_kg_ha = Column(Float, default=180.0)
    organic_carbon_pct = Column(Float, default=0.55)
    moisture_pct = Column(Float, default=45.0)
    soil_type = Column(String(100), default="Alluvial Loam")
    report_file_url = Column(String(500), nullable=True)
    analysis_summary = Column(Text, nullable=True)
    crop_suitability = Column(JSON, default=dict)
    nutrient_recommendations = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="soil_tests")

class FarmExpense(Base):
    __tablename__ = "farm_expenses"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=False)  # Seed, Fertilizer, Labour, Irrigation, Pesticide, Equipment, Transport, Land Prep, Other
    date = Column(String(50), nullable=False)
    notes = Column(String(255), nullable=True)
    raw_voice_transcript = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="expenses")

class FarmIncome(Base):
    __tablename__ = "farm_income"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="SET NULL"), nullable=True)
    crop = Column(String(100), nullable=False)
    quantity_quintals = Column(Float, nullable=False)
    selling_price_per_quintal = Column(Float, nullable=False)
    buyer_name = Column(String(200), nullable=True)
    market_name = Column(String(200), nullable=True)
    date = Column(String(50), nullable=False)
    transport_cost = Column(Float, default=0.0)
    other_costs = Column(Float, default=0.0)
    net_realization = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="incomes")

class BusinessPlan(Base):
    __tablename__ = "business_plans"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False)
    crop = Column(String(100), nullable=False)
    land_area_acres = Column(Float, default=2.0)
    seed_cost = Column(Float, default=3000.0)
    fertilizer_cost = Column(Float, default=6500.0)
    labour_cost = Column(Float, default=12000.0)
    irrigation_cost = Column(Float, default=2500.0)
    crop_protection_cost = Column(Float, default=4000.0)
    equipment_cost = Column(Float, default=3500.0)
    transport_cost = Column(Float, default=2000.0)
    other_cost = Column(Float, default=1500.0)
    expected_yield_quintals = Column(Float, default=80.0)
    expected_selling_price_per_quintal = Column(Float, default=2200.0)
    estimated_total_cost = Column(Float, default=35000.0)
    estimated_revenue = Column(Float, default=176000.0)
    estimated_net_return = Column(Float, default=141000.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="business_plans")

class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    market_name = Column(String(150), nullable=False)
    state = Column(String(100), default="Odisha")
    district = Column(String(100), default="Khordha")
    crop_name = Column(String(100), nullable=False)
    variety = Column(String(100), default="Standard")
    grade = Column(String(50), default="Grade A")
    min_price = Column(Float, default=1800.0)
    max_price = Column(Float, default=2400.0)
    modal_price = Column(Float, default=2150.0)  # per quintal
    distance_km = Column(Float, default=15.0)
    transport_rate_per_km_quintal = Column(Float, default=2.5)
    market_fee_pct = Column(Float, default=1.5)
    source = Column(String(100), default="Agmarknet APMC Portal")
    last_updated = Column(DateTime, default=datetime.utcnow)

class BuyerListing(Base):
    __tablename__ = "buyer_listings"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    crop = Column(String(100), nullable=False)
    variety = Column(String(100), default="Hybrid")
    quantity_quintals = Column(Float, nullable=False)
    grade = Column(String(50), default="Grade A")
    harvest_date = Column(String(50), nullable=False)
    expected_price_per_quintal = Column(Float, nullable=False)
    farm_location = Column(String(255), default="Bhubaneswar Rural")
    farmer_phone = Column(String(50), nullable=True)
    bank_name = Column(String(150), nullable=True)
    account_number = Column(String(100), nullable=True)
    ifsc_code = Column(String(50), nullable=True)
    account_holder_name = Column(String(150), nullable=True)
    photos = Column(JSON, default=list)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, NEGOTIATING, SOLD
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("BuyerOrder", back_populates="listing")

class BuyerOrder(Base):
    __tablename__ = "buyer_orders"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("buyer_listings.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("buyers.id", ondelete="CASCADE"), nullable=False)
    quantity_requested = Column(Float, nullable=False)
    offered_price_per_quintal = Column(Float, nullable=False)
    status = Column(String(50), default="PENDING")  # PENDING, ACCEPTED, REJECTED, COMPLETED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    listing = relationship("BuyerListing", back_populates="orders")
    buyer = relationship("BuyerProfile", back_populates="orders")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    alert_type = Column(String(50), default="weather")  # weather, disease, market, expert, order, harvest
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class AiModelVersion(Base):
    __tablename__ = "ai_model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(150), nullable=False)
    version = Column(String(50), unique=True, nullable=False)
    framework = Column(String(100), default="PyTorch & Scikit-Learn Hybrid")
    description = Column(Text, nullable=True)
    accuracy = Column(Float, default=98.15)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, CANDIDATE, ARCHIVED
    validation_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    action = Column(String(150), nullable=False)
    resource = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PhoneOtp(Base):
    __tablename__ = "phone_otps"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(32), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    role = Column(String(50), default="FARMER")
    full_name = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

