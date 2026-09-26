import unittest
import numpy as np
from PIL import Image
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ai.inference.engine import BotanicalEnsembleClassifier
from ai.preprocessing.transforms import check_foliar_tissue, extract_botanical_features
from ai.models.registry import model_registry

class TestAiEngine(unittest.TestCase):
    def setUp(self):
        self.classifier = BotanicalEnsembleClassifier("AgroVision-Ensemble-v1.0")

    def test_foliar_tissue_detection(self):
        # 1. Pure white image (non-plant) should be rejected
        white_img = Image.fromarray(np.ones((200, 200, 3), dtype=np.uint8) * 255)
        is_leaf, ratio, metrics = check_foliar_tissue(white_img)
        self.assertFalse(is_leaf, "Pure white canvas should not be detected as foliar plant tissue")

        # 2. Green leaf-like image should pass
        green_arr = np.zeros((200, 200, 3), dtype=np.uint8)
        green_arr[:, :, 1] = 180  # strong green channel
        green_arr[:, :, 0] = 50
        green_arr[:, :, 2] = 40
        green_img = Image.fromarray(green_arr)
        is_leaf, ratio, metrics = check_foliar_tissue(green_img)
        self.assertTrue(is_leaf, "Green plant image should be accepted as foliar tissue")

    def test_feature_extraction(self):
        img = Image.fromarray(np.ones((224, 224, 3), dtype=np.uint8) * 100)
        feats = extract_botanical_features(img)
        self.assertEqual(len(feats), 9, "Feature vector should contain 9 botanical descriptors")

    def test_inference_pipeline_healthy(self):
        # Clean green image
        green_arr = np.zeros((224, 224, 3), dtype=np.uint8)
        green_arr[:, :, 1] = 190
        green_arr[:, :, 0] = 60
        green_arr[:, :, 2] = 50
        green_img = Image.fromarray(green_arr)

        pred = self.classifier.predict(green_img, selected_crop="Tomato")
        self.assertEqual(pred.crop, "Tomato")
        self.assertIn(pred.disease, ["Healthy", "Early Blight", "Tomato Yellow Leaf Curl"])
        self.assertGreaterEqual(pred.confidence, 0.65)
        self.assertIsNotNone(pred.severity)

    def test_model_registry_switching(self):
        initial_model = model_registry.get_active_model()
        self.assertIsNotNone(initial_model)

        success = model_registry.set_active_model("DeepFoliar-ResNet50-v2.0-Candidate")
        self.assertTrue(success)
        self.assertEqual(model_registry.get_active_model().version, "DeepFoliar-ResNet50-v2.0-Candidate")

        # Switch back to production ensemble
        model_registry.set_active_model("AgroVision-Ensemble-v1.0")
        self.assertEqual(model_registry.get_active_model().version, "AgroVision-Ensemble-v1.0")

if __name__ == "__main__":
    unittest.main()
