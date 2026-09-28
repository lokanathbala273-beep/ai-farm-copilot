import unittest
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app

class TestAuthentication(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_farmer_registration_and_login_without_biometrics(self):
        unique_email = f"farmer_std_{uuid.uuid4().hex[:8]}@gmail.com"
        # 1. Register farmer without any biometric tokens
        reg_payload = {
            "email": unique_email,
            "password": "FarmerPassword123",
            "full_name": "Ramesh Pradhan",
            "phone_number": "+919861019999",
            "role": "FARMER"
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 200, f"Registration failed: {res.text}")
        data = res.json()
        self.assertIn("access_token", data)

        # 2. Login with email and password (no biometric required) -> SUCCEEDS
        login_success = {
            "email": unique_email,
            "password": "FarmerPassword123"
        }
        res_ok = self.client.post("/api/auth/login", json=login_success)
        self.assertEqual(res_ok.status_code, 200)
        self.assertIn("access_token", res_ok.json())

        # 3. Login with wrong password -> BLOCKED (401)
        login_fail = {
            "email": unique_email,
            "password": "WrongPassword123"
        }
        res_fail = self.client.post("/api/auth/login", json=login_fail)
        self.assertEqual(res_fail.status_code, 401)

if __name__ == "__main__":
    unittest.main()


