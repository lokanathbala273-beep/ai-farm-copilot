import unittest
import io
import sys
from pathlib import Path
from PIL import Image
import numpy as np

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.app.main import app
from database.seed.seed_data import seed_all

class TestApiEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_all()
        cls.client = TestClient(app)

    def test_health_check(self):
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")

    def test_auth_login_all_5_roles(self):
        roles = [
            ("farmer.ramesh@aifarm.org", "Farmer@1234", "FARMER"),
            ("dr.mohapatra@aifarm.org", "Expert@1234", "AGRICULTURAL_EXPERT"),
            ("seller.kisan@aifarm.org", "Seller@1234", "SELLER"),
            ("buyer.trading@aifarm.org", "Buyer@1234", "BUYER"),
            ("admin@aifarm.org", "Admin@1234", "ADMIN")
        ]
        for email, password, expected_role in roles:
            resp = self.client.post("/api/auth/login", json={"email": email, "password": password})
            self.assertEqual(resp.status_code, 200, f"Login failed for {expected_role}")
            data = resp.json()
            self.assertIn("access_token", data)
            self.assertEqual(data["role"], expected_role)

    def test_crops_catalog(self):
        resp = self.client.get("/api/crops")
        self.assertEqual(resp.status_code, 200)
        crops = resp.json()
        self.assertGreaterEqual(len(crops), 15, "System must support at least 15 major crops")
        crop_names = [c["name"] for c in crops]
        expected_crops = ["Rice", "Wheat", "Potato", "Onion", "Tomato", "Apple", "Mango", "Banana", "Brinjal", "Chilli", "Maize", "Cotton", "Groundnut", "Mustard", "Soybean"]
        for ec in expected_crops:
            self.assertIn(ec, crop_names, f"Crop {ec} must be supported")

    def test_weather_and_alerts(self):
        # Login as farmer first
        token_resp = self.client.post("/api/auth/login", json={"email": "farmer.ramesh@aifarm.org", "password": "Farmer@1234"})
        token = token_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        resp = self.client.get("/api/weather", headers=headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("weather", data)
        self.assertIn("smart_alerts", data)
        self.assertIsInstance(data["smart_alerts"], list)

    def test_soil_analysis(self):
        payload = {
            "farm_id": 1,
            "ph": 6.4,
            "nitrogen_kg_ha": 250.0,
            "phosphorus_kg_ha": 20.0,
            "potassium_kg_ha": 180.0,
            "organic_carbon_pct": 0.58,
            "moisture_pct": 45.0,
            "soil_type": "Alluvial Loam"
        }
        resp = self.client.post("/api/soil/analyze", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("overall_fertility_score", data)
        self.assertIn("crop_suitability", data)
        self.assertIn("recommendations", data)

    def test_business_planner_calculation(self):
        payload = {
            "farm_id": 1,
            "crop": "Tomato",
            "land_area_acres": 2.0,
            "seed_cost": 3000.0,
            "fertilizer_cost": 6500.0,
            "labour_cost": 12000.0,
            "irrigation_cost": 2500.0,
            "crop_protection_cost": 4000.0,
            "equipment_cost": 3500.0,
            "transport_cost": 2000.0,
            "other_cost": 1500.0,
            "expected_yield_quintals": 80.0,
            "expected_selling_price_per_quintal": 2200.0
        }
        resp = self.client.post("/api/business/calculate", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["estimated_total_cost"], 35000.0)
        self.assertEqual(data["estimated_revenue"], 176000.0)
        self.assertEqual(data["estimated_net_return"], 141000.0)

    def test_voice_expense_parser_multilingual(self):
        # 1. English
        resp_en = self.client.post("/api/expenses/parse-voice", json={"transcript": "I spent 1500 on fertilizer"})
        self.assertEqual(resp_en.status_code, 200)
        data_en = resp_en.json()
        self.assertEqual(data_en["amount"], 1500.0)
        self.assertEqual(data_en["category"], "Fertilizer")

        # 2. Odia
        resp_od = self.client.post("/api/expenses/parse-voice", json={"transcript": "ଖତ ପାଇଁ ୧୫୦୦ ଟଙ୍କା ଖର୍ଚ୍ଚ କଲି"})
        self.assertEqual(resp_od.status_code, 200)
        data_od = resp_od.json()
        self.assertEqual(data_od["amount"], 1500.0)
        self.assertEqual(data_od["category"], "Fertilizer")

        # 3. Hindi
        resp_hi = self.client.post("/api/expenses/parse-voice", json={"transcript": "खाद पर 1500 रुपये खर्च किए"})
        self.assertEqual(resp_hi.status_code, 200)
        data_hi = resp_hi.json()
        self.assertEqual(data_hi["amount"], 1500.0)
        self.assertEqual(data_hi["category"], "Fertilizer")

    def test_market_optimizer(self):
        payload = {
            "crop": "Tomato",
            "quantity_quintals": 50.0,
            "grade": "Grade A"
        }
        resp = self.client.post("/api/markets/optimize", json=payload)
        self.assertEqual(resp.status_code, 200)
        mandis = resp.json()
        self.assertGreater(len(mandis), 1)
        # Should have is_recommended on the highest net realization
        recommended = [m for m in mandis if m["is_recommended"]]
        self.assertEqual(len(recommended), 1)
        self.assertTrue(recommended[0]["net_realization"] >= mandis[1]["net_realization"])

    def test_disease_prediction_endpoint(self):
        token_resp = self.client.post("/api/auth/login", json={"email": "farmer.ramesh@aifarm.org", "password": "Farmer@1234"})
        token = token_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create simulated green foliar leaf image in memory
        arr = np.zeros((224, 224, 3), dtype=np.uint8)
        arr[:, :, 1] = 180  # green channel
        arr[:, :, 0] = 60
        arr[:, :, 2] = 40
        # Add small simulated spot
        arr[80:120, 80:120, 0] = 140
        arr[80:120, 80:120, 1] = 80
        img = Image.fromarray(arr)
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)

        files = {"image": ("test_leaf.jpg", buf, "image/jpeg")}
        data = {"crop": "Tomato"}

        resp = self.client.post("/api/disease/predict", headers=headers, data=data, files=files)
        self.assertEqual(resp.status_code, 200)
        res_data = resp.json()
        self.assertEqual(res_data["crop"], "Tomato")
        self.assertIn("disease", res_data)
        self.assertIn("confidence", res_data)
        self.assertIn("treatment_guidance", res_data)

    def test_phone_otp_flow_all_roles(self):
        # 1. Farmer Role (1st Priority)
        send_resp = self.client.post("/api/auth/otp/send", json={
            "phone_number": "+91-9861012345",
            "role": "FARMER",
            "full_name": "Ramesh Patel"
        })
        self.assertEqual(send_resp.status_code, 200)
        send_data = send_resp.json()
        self.assertIn("demo_otp", send_data)
        otp_code = send_data["demo_otp"]

        verify_resp = self.client.post("/api/auth/otp/verify", json={
            "phone_number": "+91-9861012345",
            "otp_code": otp_code,
            "role": "FARMER",
            "full_name": "Ramesh Patel"
        })
        self.assertEqual(verify_resp.status_code, 200)
        verify_data = verify_resp.json()
        self.assertIn("access_token", verify_data)
        self.assertEqual(verify_data["role"], "FARMER")

        # 2. Expert, Seller, Buyer, Admin verification with master test OTP
        roles_phones = [
            ("AGRICULTURAL_EXPERT", "+91-9437012345", "Dr. Debabrata Mohapatra"),
            ("SELLER", "+91-9124012345", "Sunil Agrochemicals"),
            ("BUYER", "+91-9937012345", "Utkal Agro Traders"),
            ("ADMIN", "+91-9876543210", "System Administrator")
        ]
        for role, phone, name in roles_phones:
            v_resp = self.client.post("/api/auth/otp/verify", json={
                "phone_number": phone,
                "otp_code": "123456",
                "role": role,
                "full_name": name
            })
            self.assertEqual(v_resp.status_code, 200, f"OTP verification failed for {role}")
            v_data = v_resp.json()
            self.assertEqual(v_data["role"], role)
            self.assertIn("access_token", v_data)

    def test_farmer_live_location_and_localized_weather(self):
        # Authenticate farmer via OTP
        login_resp = self.client.post("/api/auth/otp/verify", json={
            "phone_number": "+91-9861012345",
            "otp_code": "123456",
            "role": "FARMER"
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Update farmer's live GPS coordinates (e.g. Sambalpur Rice Belt)
        loc_resp = self.client.post("/api/farms/update-location", headers=headers, json={
            "latitude": 21.4669,
            "longitude": 83.9812,
            "location_name": "Sambalpur / Bargarh Rice Belt"
        })
        self.assertEqual(loc_resp.status_code, 200)
        loc_data = loc_resp.json()
        self.assertAlmostEqual(loc_data["latitude"], 21.4669, places=3)
        self.assertAlmostEqual(loc_data["longitude"], 83.9812, places=3)

        # 2. Query localized microclimate weather and risk alerts for coordinates
        weather_resp = self.client.get("/api/weather?lat=21.4669&lon=83.9812&location_name=Sambalpur", headers=headers)
        self.assertEqual(weather_resp.status_code, 200)
        w_data = weather_resp.json()
        self.assertIn("weather", w_data)
        self.assertIn("smart_alerts", w_data)
        self.assertIn("location", w_data)
        self.assertAlmostEqual(w_data["location"]["latitude"], 21.4669, places=2)
        self.assertAlmostEqual(w_data["location"]["longitude"], 83.9812, places=2)
        # Should have disease and weather risk alerts generated
        self.assertGreater(len(w_data["smart_alerts"]), 0)

if __name__ == "__main__":
    unittest.main()

