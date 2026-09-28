import unittest
import uuid
from fastapi.testclient import TestClient
from backend.app.main import app

class TestBiometricAuthentication(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_farmer_fingerprint_single_user_isolation(self):
        unique_email = f"farmer_fp_{uuid.uuid4().hex[:8]}@gmail.com"
        # 1. Register farmer with strictly 1 fingerprint
        reg_payload = {
            "email": unique_email,
            "password": "FarmerPassword123",
            "full_name": "Ramesh Pradhan",
            "phone_number": "+919861019999",
            "role": "FARMER",
            "biometric_enrolled": True,
            "biometric_token": "bio_farmer_fp_unique_key_ramesh_12345"
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 200, f"Registration failed: {res.text}")
        data = res.json()
        self.assertIn("access_token", data)

        # 2. Login with the EXACT matching 1 registered fingerprint -> SUCCEEDS
        login_success = {
            "email": unique_email,
            "password": "FarmerPassword123",
            "biometric_token": "bio_farmer_fp_unique_key_ramesh_12345"
        }
        res_ok = self.client.post("/api/auth/login", json=login_success)
        self.assertEqual(res_ok.status_code, 200)
        self.assertIn("access_token", res_ok.json())

        # 3. Login with a DIFFERENT/unauthorized fingerprint -> BLOCKED (401)
        login_fail = {
            "email": unique_email,
            "password": "FarmerPassword123",
            "biometric_token": "bio_farmer_fp_attacker_different_fingerprint"
        }
        res_fail = self.client.post("/api/auth/login", json=login_fail)
        self.assertEqual(res_fail.status_code, 401)
        self.assertIn("mismatch", res_fail.json()["detail"].lower())

        # 4. Login with NO biometric token -> BLOCKED (401)
        login_no_bio = {
            "email": unique_email,
            "password": "FarmerPassword123"
        }
        res_no_bio = self.client.post("/api/auth/login", json=login_no_bio)
        self.assertEqual(res_no_bio.status_code, 401)
        self.assertIn("biometric verification required", res_no_bio.json()["detail"].lower())

    def test_farmer_face_recognition_single_user_isolation(self):
        unique_email = f"farmer_face_{uuid.uuid4().hex[:8]}@gmail.com"
        # 1. Register farmer with Face Scan only
        reg_payload = {
            "email": unique_email,
            "password": "FarmerPassword123",
            "full_name": "Sita Devi",
            "phone_number": "+919861018888",
            "role": "FARMER",
            "face_enrolled": True,
            "face_token": "face_farmer_ai_unique_mesh_sita_67890"
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 200, f"Face registration failed: {res.text}")
        data = res.json()
        self.assertIn("access_token", data)

        # 2. Login with EXACT matching registered face -> SUCCEEDS
        login_face_ok = {
            "email": unique_email,
            "password": "FarmerPassword123",
            "face_token": "face_farmer_ai_unique_mesh_sita_67890"
        }
        res_ok = self.client.post("/api/auth/login", json=login_face_ok)
        self.assertEqual(res_ok.status_code, 200)
        self.assertIn("access_token", res_ok.json())

        # 3. Login with DIFFERENT/unauthorized face -> BLOCKED (401)
        login_face_fail = {
            "email": unique_email,
            "password": "FarmerPassword123",
            "face_token": "face_unauthorized_stranger_face_rejected"
        }
        res_fail = self.client.post("/api/auth/login", json=login_face_fail)
        self.assertEqual(res_fail.status_code, 401)
        self.assertIn("mismatch", res_fail.json()["detail"].lower())

    def test_farmer_face_vector_mae_isolation(self):
        unique_email = f"farmer_vec_{uuid.uuid4().hex[:8]}@gmail.com"
        vec_registered = "FACE_VEC_" + ",".join([str(0.5) for _ in range(64)])
        reg_payload = {
            "email": unique_email,
            "password": "FarmerPassword123",
            "full_name": "Kishan Kumar",
            "phone_number": "+919861017777",
            "role": "FARMER",
            "face_enrolled": True,
            "face_token": vec_registered
        }
        res = self.client.post("/api/auth/register", json=reg_payload)
        self.assertEqual(res.status_code, 200)

        # Same face (small variation, MAE = 0.02 < 0.16) -> OK
        vec_similar = "FACE_VEC_" + ",".join([str(0.52) for _ in range(64)])
        res_ok = self.client.post("/api/auth/login", json={
            "email": unique_email,
            "password": "FarmerPassword123",
            "face_token": vec_similar
        })
        self.assertEqual(res_ok.status_code, 200)

        # Different person's face (large variation, MAE = 0.40 > 0.16) -> 401 Mismatch
        vec_different_person = "FACE_VEC_" + ",".join([str(0.9) for _ in range(64)])
        res_fail = self.client.post("/api/auth/login", json={
            "email": unique_email,
            "password": "FarmerPassword123",
            "face_token": vec_different_person
        })
        self.assertEqual(res_fail.status_code, 401)
        self.assertIn("mismatch", res_fail.json()["detail"].lower())

if __name__ == "__main__":
    unittest.main()

