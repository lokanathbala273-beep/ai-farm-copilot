import sys
import os
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.models.database import engine, SessionLocal, Base
from backend.app.models.tables import (
    User, UserRole, FarmerProfile, ExpertProfile, SellerProfile, BuyerProfile,
    Farm, Field, SoilTest, Crop, Disease, DiseaseTreatment, Product,
    FarmExpense, FarmIncome, BusinessPlan, BuyerListing, BuyerOrder,
    Notification, AiModelVersion, DiseasePrediction, ExpertConsultation
)
from backend.app.auth.security import get_password_hash
from ai.datasets.disease_kb import CROPS_METADATA, DISEASE_DATABASE

def seed_all():
    print("🌾 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "farmer.ramesh@aifarm.org").first():
            print("Database already contains seed accounts. Skipping recreation.")
            return

        print("Creating role accounts...")
        # 1. Admin
        admin_user = User(
            email="admin@aifarm.org",
            phone="9876543210",
            hashed_password=get_password_hash("Admin@1234"),
            full_name="Agritech Directorate Admin",
            role=UserRole.ADMIN,
            preferred_language="en",
            is_active=True
        )
        db.add(admin_user)

        # 2. Farmer (Ramesh Patel)
        farmer_user = User(
            email="farmer.ramesh@aifarm.org",
            phone="9861012345",
            hashed_password=get_password_hash("Farmer@1234"),
            full_name="Ramesh Chandra Patel",
            role=UserRole.FARMER,
            preferred_language="en",
            is_active=True
        )
        db.add(farmer_user)

        # 3. Agricultural Expert (Dr. PK Mohapatra)
        expert_user = User(
            email="dr.mohapatra@aifarm.org",
            phone="9437012345",
            hashed_password=get_password_hash("Expert@1234"),
            full_name="Dr. P. K. Mohapatra (Plant Pathologist)",
            role=UserRole.AGRICULTURAL_EXPERT,
            preferred_language="od",
            is_active=True
        )
        db.add(expert_user)

        # 4. Medicine / Agrochemical Seller
        seller_user = User(
            email="seller.kisan@aifarm.org",
            phone="9124012345",
            hashed_password=get_password_hash("Seller@1234"),
            full_name="Sunil Sahoo (Kisan Agro Inputs)",
            role=UserRole.SELLER,
            preferred_language="hi",
            is_active=True
        )
        db.add(seller_user)

        # 5. Produce Buyer / Wholesaler
        buyer_user = User(
            email="buyer.trading@aifarm.org",
            phone="9937012345",
            hashed_password=get_password_hash("Buyer@1234"),
            full_name="Utkal Fresh Produce Traders",
            role=UserRole.BUYER,
            preferred_language="en",
            is_active=True
        )
        db.add(buyer_user)
        db.commit()

        # Seed role profiles
        farmer_profile = FarmerProfile(
            user_id=farmer_user.id,
            state="Odisha",
            district="Khordha",
            block="Bhubaneswar Rural",
            village="Patia",
            address="Plot 104, Patia Agro Belt, Bhubaneswar",
            total_land_area=6.5,
            irrigation_type="Drip & Tube-well",
            soil_type="Alluvial Loam",
            farming_experience_years=14,
            farming_method="Integrated Pest Management",
            current_crops=["Rice", "Tomato", "Potato"]
        )
        db.add(farmer_profile)

        expert_profile = ExpertProfile(
            user_id=expert_user.id,
            qualification="Ph.D. in Plant Pathology (OUAT Bhubaneswar)",
            specialization="Foliar Mycology & Horticultural Epidemiology",
            experience_years=18,
            location="Bhubaneswar, Odisha",
            verification_status="VERIFIED"
        )
        db.add(expert_profile)

        seller_profile = SellerProfile(
            user_id=seller_user.id,
            business_name="Kisan Agro Inputs & Certified Seed Store",
            owner_name="Sunil Sahoo",
            license_number="OD-AGRI-RET-2024-8841",
            address="Near APMC Yard, Jatni, Khordha",
            region="Eastern Odisha",
            verification_status="VERIFIED"
        )
        db.add(seller_profile)

        buyer_profile = BuyerProfile(
            user_id=buyer_user.id,
            organization_name="Utkal Fresh Agro Mandi Trading Ltd.",
            buyer_type="Wholesaler & Institutional Buyer",
            address="Aiginia Wholesale Terminal, Bhubaneswar",
            preferred_crops=["Tomato", "Rice", "Potato", "Chilli"]
        )
        db.add(buyer_profile)
        db.commit()

        # Seed Farmer's Farm & Fields
        farm = Farm(
            farmer_id=farmer_profile.id,
            farm_name="Kishan Smart Farm",
            location="Patia Rural, Bhubaneswar",
            latitude=20.2961,
            longitude=85.8245,
            area=6.5,
            soil_type="Alluvial Loam",
            irrigation_type="Drip & Tube-well",
            ownership_type="Owned",
            farming_method="Integrated Pest Management"
        )
        db.add(farm)
        db.commit()

        field1 = Field(
            farm_id=farm.id,
            field_name="North Plot A - Tomato",
            area=2.0,
            crop="Tomato",
            variety="Rashmi Hybrid",
            planting_date="2026-08-15",
            expected_harvest_date="2026-11-20",
            growth_stage="Flowering & Early Fruiting",
            soil_type="Alluvial Loam",
            irrigation="Drip Irrigation",
            current_health="healthy",
            notes="Vigorous blossom cluster development. Preventative neem spray applied."
        )
        field2 = Field(
            farm_id=farm.id,
            field_name="East Canal Field - Rice",
            area=3.0,
            crop="Rice",
            variety="Swarna-Sub1",
            planting_date="2026-07-10",
            expected_harvest_date="2026-11-15",
            growth_stage="Active Tillering",
            soil_type="Clay Loam",
            irrigation="Canal Inflow",
            current_health="healthy",
            notes="Standing water maintained at 4 cm depth."
        )
        field3 = Field(
            farm_id=farm.id,
            field_name="South Ridge - Potato",
            area=1.5,
            crop="Potato",
            variety="Kufri Jyoti",
            planting_date="2026-09-01",
            expected_harvest_date="2026-12-10",
            growth_stage="Vegetative & Tuber Initiation",
            soil_type="Sandy Loam",
            irrigation="Furrow",
            current_health="attention",
            notes="Light yellowing on bottom leaves. Watch for Alternaria spots."
        )
        db.add_all([field1, field2, field3])
        db.commit()

        # Seed Soil Test
        soil_test = SoilTest(
            farm_id=farm.id,
            ph=6.4,
            nitrogen_kg_ha=265.0,
            phosphorus_kg_ha=22.5,
            potassium_kg_ha=195.0,
            organic_carbon_pct=0.62,
            moisture_pct=48.0,
            soil_type="Alluvial Loam",
            analysis_summary="Soil is slightly acidic to neutral (pH 6.4) with moderate nitrogen, optimal phosphorus, and good potassium.",
            crop_suitability=[
                {"crop": "Tomato", "suitability_score": 95, "notes": "Highly favorable soil aeration"},
                {"crop": "Rice", "suitability_score": 92, "notes": "Good silt-clay fraction"},
                {"crop": "Potato", "suitability_score": 90, "notes": "Safe pH prevents scab"}
            ],
            nutrient_recommendations=[
                "Split-apply urea (20 kg/acre) at active tillering.",
                "Maintain organic carbon using vermicompost."
            ]
        )
        db.add(soil_test)

        # Seed Expenses
        exp1 = FarmExpense(farmer_id=farmer_user.id, farm_id=farm.id, field_id=field1.id, amount=1500.0, category="Fertilizer", date="2026-09-10", notes="Purchased 2 bags of Neem-Coated Urea", raw_voice_transcript="I spent 1500 on fertilizer")
        exp2 = FarmExpense(farmer_id=farmer_user.id, farm_id=farm.id, field_id=field2.id, amount=2400.0, category="Labour", date="2026-09-14", notes="Weeding and canal bund maintenance (6 workers)", raw_voice_transcript="2400 for labour weeding")
        exp3 = FarmExpense(farmer_id=farmer_user.id, farm_id=farm.id, field_id=field1.id, amount=850.0, category="Pesticide", date="2026-09-18", notes="Azoxystrobin foliar fungicide", raw_voice_transcript="pesticide spray 850 rupees")
        exp4 = FarmExpense(farmer_id=farmer_user.id, farm_id=farm.id, field_id=field3.id, amount=1200.0, category="Irrigation", date="2026-09-22", notes="Diesel pump operation for potato furrow watering")
        db.add_all([exp1, exp2, exp3, exp4])

        # Seed Income
        inc1 = FarmIncome(
            farmer_id=farmer_user.id,
            farm_id=farm.id,
            field_id=field1.id,
            crop="Tomato",
            quantity_quintals=40.0,
            selling_price_per_quintal=2350.0,
            buyer_name="Utkal Fresh Produce Traders",
            market_name="Bhubaneswar APMC (Aiginia)",
            date="2026-09-15",
            transport_cost=1200.0,
            other_costs=400.0,
            net_realization=92400.0
        )
        db.add(inc1)

        # Seed Business Plan
        plan = BusinessPlan(
            farmer_id=farmer_user.id,
            farm_id=farm.id,
            crop="Tomato",
            land_area_acres=2.0,
            seed_cost=3500.0,
            fertilizer_cost=7000.0,
            labour_cost=14000.0,
            irrigation_cost=3000.0,
            crop_protection_cost=4500.0,
            equipment_cost=4000.0,
            transport_cost=2500.0,
            other_cost=1500.0,
            expected_yield_quintals=90.0,
            expected_selling_price_per_quintal=2350.0,
            estimated_total_cost=40000.0,
            estimated_revenue=211500.0,
            estimated_net_return=171500.0
        )
        db.add(plan)

        # Seed Marketplace Products for the Seller
        products = [
            Product(
                seller_id=seller_profile.id,
                product_name="Mancozeb 75% WP (Indofil M-45)",
                product_type="Fungicide",
                active_ingredient="Mancozeb 75% WP",
                target_crop="Tomato, Potato, Rice",
                target_disease="Early Blight, Late Blight, Blast",
                application_method="Foliar Spray",
                dosage_rate="2.5 g / Litre of water",
                manufacturer="Indofil Industries Ltd.",
                pack_size="500 g",
                price=320.0,
                stock=150,
                is_approved=True,
                approval_number="CIB&RC-2023-FUNG-9912",
                safety_warning="Wear protective gloves and face mask. PHI: 14 days."
            ),
            Product(
                seller_id=seller_profile.id,
                product_name="Azoxystrobin 18.2% + Difenoconazole 11.4% SC (Amistar Top)",
                product_type="Fungicide",
                active_ingredient="Azoxystrobin + Difenoconazole",
                target_crop="Tomato, Chilli, Onion",
                target_disease="Early Blight, Anthracnose, Purple Blotch",
                application_method="Foliar Spray",
                dosage_rate="1.0 ml / Litre of water",
                manufacturer="Syngenta India Ltd.",
                pack_size="200 ml",
                price=680.0,
                stock=80,
                is_approved=True,
                approval_number="CIB&RC-2024-FUNG-1422",
                safety_warning="Toxic to fish and aquatic life. PHI: 5 days."
            ),
            Product(
                seller_id=seller_profile.id,
                product_name="Streptocycline (Streptomycin 90% + Tetracycline 10%)",
                product_type="Bactericide",
                active_ingredient="Streptomycin Sulphate + Tetracycline Hydrochloride",
                target_crop="Rice, Cotton, Tomato",
                target_disease="Bacterial Leaf Blight, Black Arm, Bacterial Canker",
                application_method="Foliar Spray with Copper Oxychloride",
                dosage_rate="6 g in 50 Litres of water",
                manufacturer="Hindustan Antibiotics Ltd.",
                pack_size="6 g Pouch",
                price=65.0,
                stock=400,
                is_approved=True,
                approval_number="CIB&RC-2022-BACT-3381",
                safety_warning="Do not spray within 15 days of harvest."
            ),
            Product(
                seller_id=seller_profile.id,
                product_name="Trichoderma viride 1.5% WP (Bio-Fungicide)",
                product_type="Bio-agent",
                active_ingredient="Trichoderma viride (CFU 2 x 10^8 / g)",
                target_crop="Banana, Groundnut, Brinjal, Potato",
                target_disease="Panama Wilt, Collar Rot, Damping Off",
                application_method="Soil Drenching / FYM Enrichment",
                dosage_rate="2.5 kg / acre mixed in 100 kg compost",
                manufacturer="Utkal Bio-Agri Solutions",
                pack_size="1 kg",
                price=210.0,
                stock=200,
                is_approved=True,
                approval_number="CIB&RC-BIO-2023-559",
                safety_warning="Organic bio-control agent. Completely safe for beneficial organisms."
            )
        ]
        db.add_all(products)

        # Seed Buyer Produce Listing
        listing = BuyerListing(
            farmer_id=farmer_user.id,
            crop="Tomato",
            variety="Rashmi Hybrid",
            quantity_quintals=50.0,
            grade="Grade A",
            harvest_date="2026-10-05",
            expected_price_per_quintal=2350.0,
            farm_location="Patia Rural, Bhubaneswar, Khordha",
            description="Grade A fresh vine-ripened tomatoes. Hand-picked, uniform red color, firm calyx, zero chemical residue in last 15 days.",
            status="ACTIVE"
        )
        db.add(listing)
        db.commit()

        # Seed AI Model Versions
        models = [
            AiModelVersion(
                model_name="AgroVision Botanical Calibrated Ensemble",
                version="AgroVision-Ensemble-v1.0",
                framework="Scikit-Learn & Botanical Foliar Descriptors",
                description="Production model combining color-moment foliar segmentation, lesion density descriptors, and calibrated IPM rules.",
                accuracy=98.15,
                status="ACTIVE"
            ),
            AiModelVersion(
                model_name="DeepFoliar Vision Head",
                version="DeepFoliar-ResNet50-v2.0-Candidate",
                framework="PyTorch MobileNetV3 / ResNet50 Transfer Head",
                description="High-resolution convolutional neural feature extractor for foliar disease classification.",
                accuracy=98.60,
                status="CANDIDATE"
            )
        ]
        db.add_all(models)

        # Seed Notifications
        notifs = [
            Notification(
                user_id=farmer_user.id,
                title="Weather Alert: Heavy Dew & Humidity",
                message="Relative humidity expected to exceed 85% tonight. Favorable for Late Blight on Potato.",
                alert_type="weather"
            ),
            Notification(
                user_id=farmer_user.id,
                title="Market Alert: Tomato Prices +8%",
                message="Modal prices at Bhubaneswar APMC rose to ₹2,350/Qtl due to lower regional arrivals.",
                alert_type="market"
            )
        ]
        db.add_all(notifs)
        db.commit()

        print("Seed data successfully populated!")
        print("Demo Accounts:")
        print("1. Farmer:  farmer.ramesh@aifarm.org  /  Farmer@1234")
        print("2. Expert:  dr.mohapatra@aifarm.org   /  Expert@1234")
        print("3. Seller:  seller.kisan@aifarm.org   /  Seller@1234")
        print("4. Buyer:   buyer.trading@aifarm.org  /  Buyer@1234")
        print("5. Admin:   admin@aifarm.org          /  Admin@1234")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_all()
