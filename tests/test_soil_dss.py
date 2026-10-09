import unittest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.soil_service import soil_service


class TestAISoilDecisionSupportSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_module_1_location_based_soil_intelligence(self):
        """Module 1: Verify All-India State/District/Block/Village lookup, source metadata, missing-data status, and non-fabrication of plot N-P-K."""
        hierarchy = soil_service.get_location_hierarchy()
        self.assertGreaterEqual(len(hierarchy), 36, "Expected all 36 Indian States & UTs")
        total_districts = sum(len(dists) for dists in hierarchy.values())
        self.assertGreaterEqual(total_districts, 750, "Expected 750+ Indian Districts")
        self.assertIn("Odisha", hierarchy)
        self.assertEqual(len(hierarchy["Odisha"]), 30, "Expected all 30 Districts of Odisha")
        self.assertIn("Khordha", hierarchy["Odisha"])
        self.assertIn("Balianta", hierarchy["Odisha"]["Khordha"]["blocks"])

        rec = soil_service.lookup_regional_soil(
            state="Odisha", district="Khordha", block="Balianta", village="Balipatna"
        )
        self.assertEqual(rec["status"], "success")
        self.assertEqual(rec["data_source_type"], "REGIONAL_REFERENCE")
        self.assertIn("ICAR", rec["data_source"])
        self.assertTrue(rec["reference_date"])
        self.assertTrue(rec["geographic_resolution"])
        self.assertIn("NOT AN INDIVIDUAL FARM MEASUREMENT", rec["disclaimer"])
        self.assertTrue(len(rec["missing_parameters"]) >= 3)

        # Verify another state (e.g., Punjab -> Ludhiana)
        rec_pb = soil_service.lookup_regional_soil(state="Punjab", district="Ludhiana")
        self.assertEqual(rec_pb["location"]["state"], "Punjab")
        self.assertEqual(rec_pb["location"]["district"], "Ludhiana")
        self.assertEqual(rec_pb["data_source_type"], "REGIONAL_REFERENCE")

    def test_module_2_soil_report_ocr_and_unit_validation(self):
        """Module 2: Verify OCR extraction, kg/acre -> kg/ha conversion, physiological bounds check, and source/date preservation."""
        sample_report = (
            "ICAR - Krishi Vigyan Kendra Soil Testing Lab\n"
            "Test Date: 2026-08-14\n"
            "pH : 5.3\n"
            "EC : 0.24 dS/m\n"
            "Organic Carbon (OC) : 0.41 %\n"
            "Available Nitrogen (N) : 80 kg/acre\n"
            "Available Phosphorus (P) : 8 kg/acre\n"
            "Available Potassium (K) : 60 kg/acre\n"
        )
        res = soil_service.extract_soil_report_ocr(
            file_bytes=b"", filename="kvk_report.txt", raw_text_override=sample_report
        )
        self.assertEqual(res["status"], "success")
        self.assertTrue(res["requires_farmer_confirmation"])
        self.assertEqual(res["test_date"], "2026-08-14")
        ext = res["extracted_values"]
        self.assertAlmostEqual(ext["ph"], 5.3, places=1)
        # 80 kg/acre * 2.471 = 197.68 kg/ha
        self.assertAlmostEqual(ext["nitrogen_kg_ha"], 197.7, places=1)
        self.assertTrue(any("Converted nitrogen_kg_ha" in w for w in res["validation_warnings"]))

        # Out-of-bounds pH (e.g. 18.5) must be rejected, never accepted
        bad_report = "Soil pH: 18.5\nAvailable Nitrogen (N): 240 kg/ha"
        bad_res = soil_service.extract_soil_report_ocr(
            file_bytes=b"", filename="bad.txt", raw_text_override=bad_report
        )
        self.assertIsNone(bad_res["extracted_values"]["ph"])
        self.assertTrue(any("outside valid physiological range" in w for w in bad_res["validation_warnings"]))

    def test_module_3_and_4_crop_suitability_and_no_fabricated_dosages(self):
        """Modules 3 & 4: Verify crop suitability explanations and refusal to fabricate chemical dosages when N-P-K are missing."""
        # Case A: Missing N-P-K / Regional Reference only
        dss_missing = soil_service.analyze_soil_dss(
            ph=5.9,
            n=None,
            p=None,
            k=None,
            oc=0.48,
            soil_type="Alluvial Loam",
            season="Kharif",
            water_availability="Medium",
            data_source_type="REGIONAL_REFERENCE",
            data_source_name="OUAT Regional Survey",
        )
        self.assertIn("Available Nitrogen (N)", dss_missing["missing_inputs"])
        self.assertIn("Available Phosphorus (P)", dss_missing["missing_inputs"])
        self.assertIn("Available Potassium (K)", dss_missing["missing_inputs"])

        # Advisor must refuse to fabricate chemical N/P/K dosages
        advisor_statuses = [a["status"] for a in dss_missing["structured_advisor"]]
        self.assertTrue(any("Refused" in s or "Missing" in s for s in advisor_statuses))
        advisor_texts = " ".join(a["guidance"] for a in dss_missing["structured_advisor"])
        self.assertIn("cannot be fabricated", advisor_texts)

        # Crop suitability must include reasons, limiting_factors, uncertainty, and missing_inputs
        top_crop = dss_missing["crop_suitability"][0]
        self.assertIn("reasons", top_crop)
        self.assertIn("limiting_factors", top_crop)
        self.assertIn("uncertainty", top_crop)
        self.assertIn("High", top_crop["uncertainty"])

    def test_module_5_soil_health_trend_tracker_minimum_2_records(self):
        """Module 5: Verify trend tracker refuses to compute trends when <2 records exist and computes accurately when >=2 exist."""
        single_res = soil_service.compute_soil_trends(
            [{"test_date": "2026-05-10", "ph": 6.2, "nitrogen_kg_ha": 240}]
        )
        self.assertFalse(single_res["has_sufficient_data"])
        self.assertEqual(single_res["trends"], {})

        multi_res = soil_service.compute_soil_trends(
            [
                {"test_date": "2025-11-10", "ph": 5.7, "nitrogen_kg_ha": 205.0, "organic_carbon_pct": 0.42},
                {"test_date": "2026-06-15", "ph": 6.3, "nitrogen_kg_ha": 245.0, "organic_carbon_pct": 0.55},
            ]
        )
        self.assertTrue(multi_res["has_sufficient_data"])
        self.assertEqual(multi_res["trends"]["ph"]["direction"], "INCREASING")
        self.assertAlmostEqual(multi_res["trends"]["ph"]["delta"], 0.6, places=2)
        self.assertEqual(multi_res["trends"]["nitrogen_kg_ha"]["direction"], "INCREASING")

    def test_module_6_and_7_multilingual_and_weather_risk(self):
        """Modules 6 & 7: Verify Odia/Hindi/English summaries and weather-soil risk alerts with hardware sensor disclaimer."""
        dss = soil_service.analyze_soil_dss(
            ph=6.2,
            n=245.0,
            p=24.0,
            k=185.0,
            oc=0.58,
            soil_type="Sandy Loam",
            season="Kharif",
            water_availability="Medium",
            data_source_type="MEASURED_LAB_VALUE",
            data_source_name="OUAT Lab",
            weather_context={"rain_prob_72h_pct": 85, "temp_c": 31, "humidity_pct": 82},
        )
        ml = dss["multilingual_summary"]
        self.assertIn("en", ml)
        self.assertIn("od", ml)
        self.assertIn("hi", ml)
        self.assertIn("OUAT Lab", ml["en"])
        self.assertIn("No live hardware", dss["sensor_disclaimer"])
        self.assertTrue(any("Leaching" in r["risk_type"] for r in dss["soil_weather_risks"]))

    def test_module_8_fastapi_soil_endpoints(self):
        """Module 8: End-to-end API verification for /api/soil/* endpoints."""
        r_loc = self.client.get("/api/soil/locations")
        self.assertEqual(r_loc.status_code, 200)
        self.assertIn("Odisha", r_loc.json()["hierarchy"])

        r_reg = self.client.get("/api/soil/regional-lookup?state=Odisha&district=Khordha&block=Balianta")
        self.assertEqual(r_reg.status_code, 200)
        self.assertEqual(r_reg.json()["data_source_type"], "REGIONAL_REFERENCE")

        r_ocr = self.client.post("/api/soil/ocr-extract", data={"sample_id": "acidic_laterite_shc"})
        self.assertEqual(r_ocr.status_code, 200)
        self.assertAlmostEqual(r_ocr.json()["extracted_values"]["ph"], 5.2, places=1)

        r_an = self.client.post(
            "/api/soil/analyze",
            json={
                "ph": 6.2,
                "nitrogen_kg_ha": 245,
                "phosphorus_kg_ha": 24.5,
                "potassium_kg_ha": 188,
                "organic_carbon_pct": 0.58,
                "soil_type": "Alluvial Loam",
                "season": "Kharif",
                "water_availability": "Medium",
                "data_source_type": "MEASURED_LAB_VALUE",
                "data_source_name": "OUAT Lab",
            },
        )
        self.assertEqual(r_an.status_code, 200)
        body = r_an.json()
        self.assertIn("parameter_cards", body)
        self.assertIn("structured_advisor", body)
        self.assertIn("soil_weather_risks", body)
        self.assertIn("multilingual_summary", body)

        r_tr_single = self.client.get("/api/soil/trends?mode=single")
        self.assertEqual(r_tr_single.status_code, 200)
        self.assertFalse(r_tr_single.json()["has_sufficient_data"])

        r_tr_all = self.client.get("/api/soil/trends?mode=all")
        self.assertEqual(r_tr_all.status_code, 200)
        self.assertTrue(r_tr_all.json()["has_sufficient_data"])


if __name__ == "__main__":
    unittest.main()
