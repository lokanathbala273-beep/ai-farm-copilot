from typing import Dict, Any, List
from ai.datasets.disease_kb import CROPS_METADATA

class SoilService:
    @staticmethod
    def analyze_soil(
        ph: float,
        n: float,
        p: float,
        k: float,
        oc: float,
        moisture: float,
        soil_type: str
    ) -> Dict[str, Any]:
        """
        Evaluates soil test values against standard ICAR agronomic thresholds.
        """
        # pH Evaluation
        if ph < 5.5:
            ph_status = "Strongly Acidic (Lime application recommended)"
        elif 5.5 <= ph < 6.5:
            ph_status = "Moderately Acidic (Favorable for potato & tea)"
        elif 6.5 <= ph <= 7.5:
            ph_status = "Optimal Neutral (Ideal for most crops)"
        elif 7.5 < ph <= 8.5:
            ph_status = "Moderately Alkaline (Slight salinity watch)"
        else:
            ph_status = "Strongly Alkaline / Sodic (Gypsum amendment required)"

        # Nitrogen (N kg/ha): Low < 280, Medium 280-560, High > 560
        if n < 280:
            n_status = "Low (< 280 kg/ha)"
        elif n <= 560:
            n_status = "Medium (280 - 560 kg/ha)"
        else:
            n_status = "High (> 560 kg/ha)"

        # Phosphorus (P kg/ha): Low < 10, Medium 10-25, High > 25
        if p < 10:
            p_status = "Low (< 10 kg/ha)"
        elif p <= 25:
            p_status = "Medium (10 - 25 kg/ha)"
        else:
            p_status = "High (> 25 kg/ha)"

        # Potassium (K kg/ha): Low < 110, Medium 110-280, High > 280
        if k < 110:
            k_status = "Low (< 110 kg/ha)"
        elif k <= 280:
            k_status = "Medium (110 - 280 kg/ha)"
        else:
            k_status = "High (> 280 kg/ha)"

        # Organic Carbon (%): Low < 0.5%, Medium 0.5-0.75%, High > 0.75%
        if oc < 0.5:
            oc_status = "Low (< 0.50%)"
        elif oc <= 0.75:
            oc_status = "Medium (0.50 - 0.75%)"
        else:
            oc_status = "High (> 0.75%)"

        # Calculate Overall Fertility Index (0-100)
        fertility_score = 0.0
        fertility_score += (25.0 if 6.0 <= ph <= 7.5 else 15.0)
        fertility_score += (25.0 if n >= 280 else 12.0)
        fertility_score += (25.0 if p >= 15 else 12.0)
        fertility_score += (25.0 if k >= 140 else 12.0)

        # Crop Suitability Matrix for the 15 major crops
        suitability_list = []
        for crop_name, meta in CROPS_METADATA.items():
            score = 85
            notes = "Highly suitable for current soil parameters."
            if crop_name in ["Rice"] and "Clay" in soil_type or "Alluvial" in soil_type:
                score += 10
            elif crop_name in ["Potato"] and ph > 7.5:
                score -= 20
                notes = "Higher pH increases common scab risk."
            elif crop_name in ["Cotton"] and "Black" in soil_type:
                score += 12
            elif crop_name in ["Groundnut"] and ("Sandy" in soil_type or "Loam" in soil_type):
                score += 10
            
            suitability_list.append({
                "crop": crop_name,
                "scientific_name": meta["scientific_name"],
                "suitability_score": min(98, score),
                "notes": notes
            })

        suitability_list.sort(key=lambda x: x["suitability_score"], reverse=True)

        recommendations = []
        if n < 280:
            recommendations.append("Apply Neem-Coated Urea in split doses (50% basal, 25% tillering, 25% panicle/flowering).")
        if p < 15:
            recommendations.append("Apply Single Super Phosphate (SSP) or DAP @ 50 kg/acre as basal dose.")
        if k < 140:
            recommendations.append("Apply Muriate of Potash (MOP) @ 25 kg/acre to boost disease resistance and tuber/fruit quality.")
        if oc < 0.5:
            recommendations.append("Incorporate 4-5 tonnes/acre of well-decomposed Farm Yard Manure (FYM) or Vermicompost before sowing.")
        if ph < 5.8:
            recommendations.append("Broadcast agricultural lime @ 250 kg/acre to neutralize excessive soil acidity.")

        guidance = (
            f"Soil is {ph_status}. Fertility index is rated at {fertility_score}/100. "
            f"Nitrogen is {n_status}, Phosphorus is {p_status}, and Potassium is {k_status}. "
            f"Top recommended crops: {', '.join([c['crop'] for c in suitability_list[:3]])}."
        )

        return {
            "ph_status": ph_status,
            "nitrogen_status": n_status,
            "phosphorus_status": p_status,
            "potassium_status": k_status,
            "organic_carbon_status": oc_status,
            "overall_fertility_score": fertility_score,
            "crop_suitability": suitability_list,
            "recommendations": recommendations,
            "management_guidance": guidance
        }

soil_service = SoilService()
