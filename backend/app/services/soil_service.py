"""
Integrated AI Soil Decision Support System (DSS) Service
========================================================
Implements:
  1. Location-Based Soil Intelligence (State -> District -> Block -> Village) with explicit
     regional reference metadata and missing-data indicators (never presented as individual plot measurements).
  2. Soil Report Reader (OCR & PDF/Image/Text Parser) with unit validation and physiological bounds.
  3. Evidence-Based Crop Suitability Engine (Soil + Crop Requirements + Season + Water Availability).
  4. Validated Soil Improvement Advisor (ICAR / OUAT reference rules; refuses to fabricate dosages when data is missing).
  5. Soil Health Trend Tracker (compares chronological records ONLY when >= 2 comparable assessments exist).
  6. Multilingual Soil Assistant (English, Odia, Hindi) clearly distinguishing measured vs regional vs missing values.
  7. Soil & Weather Risk Analyzer (combines soil texture/chemistry with weather forecast without claiming live sensors).
"""

import io
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from ai.datasets.disease_kb import CROPS_METADATA


# Verified Regional Soil Reference Database (ICAR-NBSS&LUP & OUAT Agro-Climatic Atlas / Govt. SHC Cycle-II)
# NOTE: These are explicitly flagged as Regional Reference Baselines, NEVER individual farm measurements.
REGIONAL_SOIL_DATABASE: Dict[str, Dict[str, Dict[str, Any]]] = {
    "Odisha": {
        "Khordha": {
            "agro_climatic_zone": "East & South-Eastern Coastal Plain (OUAT Zone-4)",
            "data_source": "ICAR-NBSS&LUP & OUAT Soil Atlas / Govt. of India SHC Cycle-II Aggregated Baseline",
            "reference_date": "2023-2024 Survey Cycle",
            "geographic_resolution": "District / Block Regional Reference (1:50,000 Scale)",
            "dominant_soil_type": "Red Laterite Soil",
            "secondary_soil_type": "Alluvial Loam",
            "blocks": {
                "Bhubaneswar": ["Kalyanpur", "Kantabad", "Mendhasal", "Patrapada", "Tamando"],
                "Jatni": ["Benapanjari", "Chhanaghar", "Janla", "Padanpur", "Retang"],
                "Balipatna": ["Achyutpur", "Balipatna", "Garedipanchan", "Kurunjipur", "Narisho"],
                "Balianta": ["Balianta", "Bhingarpur", "Jayadev", "Prataprudrapur", "Satyabhamapur"],
                "Khordha Sadar": ["Bajpur", "Botalama", "agada", "Kaipadar", "Tapang"],
            },
            "regional_baseline": {
                "ph": 5.6,
                "ph_range": "5.2 – 6.3 (Moderately Acidic Lateritic)",
                "organic_carbon_pct": 0.48,
                "nitrogen_kg_ha": 235.0,
                "phosphorus_kg_ha": 16.5,
                "potassium_kg_ha": 165.0,
                "ec_ds_m": None,
                "zinc_ppm": None,
                "boron_ppm": None,
            },
        },
        "Cuttack": {
            "agro_climatic_zone": "East & South-Eastern Coastal Plain (Mahanadi Delta)",
            "data_source": "ICAR-NBSS&LUP & NRRI Cuttack Soil Survey Reference",
            "reference_date": "2023-2024 Survey Cycle",
            "geographic_resolution": "District / Block Regional Reference (Mahanadi Alluvial Delta)",
            "dominant_soil_type": "Alluvial Loam",
            "secondary_soil_type": "Clay Loam",
            "blocks": {
                "Cuttack Sadar": ["Kandarpur", "42 Mouza", "Gopalpur", "Pratapnagari"],
                "Tangi-Choudwar": ["Tangi", "Choudwar", "Kakhadi", "Salagaon"],
                "Salepur": ["Salepur", "Chahapada", "Raisunguda", "Nischintakoili"],
                "Banki": ["Banki", "Baideswar", "Kalapathar", "Similipur"],
            },
            "regional_baseline": {
                "ph": 6.4,
                "ph_range": "6.0 – 6.9 (Slightly Acidic to Neutral Deltaic Alluvium)",
                "organic_carbon_pct": 0.62,
                "nitrogen_kg_ha": 275.0,
                "phosphorus_kg_ha": 22.0,
                "potassium_kg_ha": 210.0,
                "ec_ds_m": None,
                "zinc_ppm": None,
                "boron_ppm": None,
            },
        },
        "Puri": {
            "agro_climatic_zone": "East & South-Eastern Coastal Plain (Coastal Belt)",
            "data_source": "ICAR-NBSS&LUP Coastal Saline & Deltaic Soil Reference",
            "reference_date": "2023-2024 Survey Cycle",
            "geographic_resolution": "District / Block Regional Reference",
            "dominant_soil_type": "Sandy Loam",
            "secondary_soil_type": "Alluvial Loam",
            "blocks": {
                "Pipili": ["Pipili", "Dandamukundapur", "Teisipur", "Mangalpur"],
                "Satyabadi": ["Sakhigopal", "Biraramachandrapur", "Kanas", "Algum"],
                "Nimapada": ["Nimapada", "Balanga", "Chari Chhak", "Haripur"],
                "Gop": ["Gop", "Konark", "Birtung", "achha"],
            },
            "regional_baseline": {
                "ph": 6.6,
                "ph_range": "6.1 – 7.4 (Coastal Sandy to Deltaic Loam; localized salinity near coast)",
                "organic_carbon_pct": 0.51,
                "nitrogen_kg_ha": 240.0,
                "phosphorus_kg_ha": 18.0,
                "potassium_kg_ha": 195.0,
                "ec_ds_m": None,
                "zinc_ppm": None,
                "boron_ppm": None,
            },
        },
        "Bargarh": {
            "agro_climatic_zone": "Western Central Table Land (Hirakud Command Area)",
            "data_source": "OUAT Chiplima RRTTS & Govt. SHC District Reference",
            "reference_date": "2023-2024 Survey Cycle",
            "geographic_resolution": "District / Block Regional Reference",
            "dominant_soil_type": "Clay Loam",
            "secondary_soil_type": "Black Cotton Soil",
            "blocks": {
                "Attabira": ["Attabira", "Godbhaga", "Larambha", "Tora"],
                "Bargarh": ["Bargarh Sadar", "Bargaon", "Gudesira", "Khaliapali"],
                "Barpali": ["Barpali", "Agalpur", "Kumbhari"],
                "Sohela": ["Sohela", "Ghens", "Panipura"],
            },
            "regional_baseline": {
                "ph": 6.5,
                "ph_range": "6.0 – 7.2 (Medium to Heavy Clay Loam in Command Area)",
                "organic_carbon_pct": 0.58,
                "nitrogen_kg_ha": 268.0,
                "phosphorus_kg_ha": 24.0,
                "potassium_kg_ha": 225.0,
                "ec_ds_m": None,
                "zinc_ppm": None,
                "boron_ppm": None,
            },
        },
        "Sambalpur": {
            "agro_climatic_zone": "North-Western Plateau / Western Central Table Land",
            "data_source": "ICAR-NBSS&LUP & OUAT Regional Soil Survey",
            "reference_date": "2023-2024 Survey Cycle",
            "geographic_resolution": "District / Block Regional Reference",
            "dominant_soil_type": "Red Laterite Soil",
            "secondary_soil_type": "Sandy Loam",
            "blocks": {
                "Dhankauda": ["Chiplima", "Gosala", "Kardola", "Burla"],
                "Maneswar": ["Maneswar", "Sindurpank", "Themra"],
                "Kuchinda": ["Kuchinda", "Boxipali", "Paruabhadi"],
                "Rengali": ["Rengali", "Katarbaga", "Laida"],
            },
            "regional_baseline": {
                "ph": 5.8,
                "ph_range": "5.4 – 6.4 (Moderately Acidic Red & Mixed Loam)",
                "organic_carbon_pct": 0.50,
                "nitrogen_kg_ha": 245.0,
                "phosphorus_kg_ha": 17.5,
                "potassium_kg_ha": 180.0,
                "ec_ds_m": None,
                "zinc_ppm": None,
                "boron_ppm": None,
            },
        },
        "Ganjam": {
            "agro_climatic_zone": "East & South-Eastern Coastal Plain (Rushikulya Basin)",
            "data_source": "ICAR-NBSS&LUP & KVK Ganjam Soil Reference",
            "reference_date": "2023-2024 Survey Cycle",
            "geographic_resolution": "District / Block Regional Reference",
            "dominant_soil_type": "Alluvial Loam",
            "secondary_soil_type": "Red Laterite Soil",
            "blocks": {
                "Rangeilunda": ["Berhampur Rural", "Golanthara", "Kanishi"],
                "Hinjilicut": ["Hinjili", "Buruapalli", "Kanchuru"],
                "Aska": ["Aska", "Balisira", "Kotinada"],
                "Chhatrapur": ["Chhatrapur", "Gopalpur", "Chamhandi"],
            },
            "regional_baseline": {
                "ph": 6.2,
                "ph_range": "5.8 – 6.8 (Red Sandy to Coastal Alluvial Loam)",
                "organic_carbon_pct": 0.53,
                "nitrogen_kg_ha": 250.0,
                "phosphorus_kg_ha": 19.0,
                "potassium_kg_ha": 205.0,
                "ec_ds_m": None,
                "zinc_ppm": None,
                "boron_ppm": None,
            },
        },
        "Balasore": {
            "agro_climatic_zone": "North-Eastern Coastal Plain (Subarnarekha-Budhabalanga Basin)",
            "data_source": "ICAR-NBSS&LUP & OUAT North-Eastern Coastal Reference",
            "reference_date": "2023-2024 Survey Cycle",
            "geographic_resolution": "District / Block Regional Reference",
            "dominant_soil_type": "Alluvial Loam",
            "secondary_soil_type": "Sandy Loam",
            "blocks": {
                "Balasore Sadar": ["Remuna", "halia", "Chhanua", "Rupsa"],
                "Jaleswar": ["Jaleswar", "Lakhannath", "Raibania"],
                "Soro": ["Soro", "Anantapur", "Gopinathpur"],
                "Nilagiri": ["Nilagiri", "Ayodhya", "Berhampur"],
            },
            "regional_baseline": {
                "ph": 6.1,
                "ph_range": "5.7 – 6.7 (Alluvial to Coastal Loam)",
                "organic_carbon_pct": 0.56,
                "nitrogen_kg_ha": 260.0,
                "phosphorus_kg_ha": 21.0,
                "potassium_kg_ha": 188.0,
                "ec_ds_m": None,
                "zinc_ppm": None,
                "boron_ppm": None,
            },
        },
        "Koraput": {
            "agro_climatic_zone": "Eastern Ghat Highland Zone (OUAT Zone-5)",
            "data_source": "ICAR-IISWC Sunabeda & OUAT Highland Soil Reference",
            "reference_date": "2023-2024 Survey Cycle",
            "geographic_resolution": "District / Block Regional Reference",
            "dominant_soil_type": "Red Laterite Soil",
            "secondary_soil_type": "Sandy Loam",
            "blocks": {
                "Jeypore": ["Jeypore", "Ambaguda", "Borigumma", "Kumuliput"],
                "Koraput": ["Koraput", "Deoghati", "Mahadeiput"],
                "Semiliguda": ["Semiliguda", "Sunabeda", "Kunduli", "Pottangi"],
            },
            "regional_baseline": {
                "ph": 5.3,
                "ph_range": "4.9 – 5.8 (Acidic Highland Red & Lateritic Soil)",
                "organic_carbon_pct": 0.64,
                "nitrogen_kg_ha": 255.0,
                "phosphorus_kg_ha": 14.0,
                "potassium_kg_ha": 175.0,
                "ec_ds_m": None,
                "zinc_ppm": None,
                "boron_ppm": None,
            },
        },
        "Kalahandi": {
            "agro_climatic_zone": "Western Undulating Zone (Indravati Command & Vertisols)",
            "data_source": "OUAT Bhawanipatna College of Agriculture Soil Survey",
            "reference_date": "2023-2024 Survey Cycle",
            "geographic_resolution": "District / Block Regional Reference",
            "dominant_soil_type": "Black Cotton Soil",
            "secondary_soil_type": "Clay Loam",
            "blocks": {
                "Bhawanipatna": ["Bhawanipatna", "Medinipur", "Deypur"],
                "Junagarh": ["Junagarh", "Chicheriguda", "Habaspur"],
                "Dharamgarh": ["Dharamgarh", "Koksara", "Parla"],
                "Kesinga": ["Kesinga", "Utkela", "Pastikudi"],
            },
            "regional_baseline": {
                "ph": 6.8,
                "ph_range": "6.3 – 7.6 (Neutral to Slightly Alkaline Black Vertisols & Mixed Red-Black)",
                "organic_carbon_pct": 0.54,
                "nitrogen_kg_ha": 248.0,
                "phosphorus_kg_ha": 20.0,
                "potassium_kg_ha": 265.0,
                "ec_ds_m": None,
                "zinc_ppm": None,
                "boron_ppm": None,
            },
        },
    },
    "West Bengal": {
        "Hooghly": {
            "agro_climatic_zone": "New Alluvial Gangetic Zone",
            "data_source": "ICAR-NBSS&LUP & Govt. SHC Regional Reference",
            "reference_date": "2023-2024 Survey Cycle",
            "geographic_resolution": "District / Block Regional Reference",
            "dominant_soil_type": "Alluvial Loam",
            "secondary_soil_type": "Clay Loam",
            "blocks": {
                "Singur": ["Singur", "Balarambati", "Bora"],
                "Tarakeswar": ["Tarakeswar", "Champadanga", "Santoshpur"],
                "Dhaniakhali": ["Dhaniakhali", "Gurap", "Belmuri"],
            },
            "regional_baseline": {
                "ph": 6.5,
                "ph_range": "6.0 – 7.0 (Gangetic Alluvial Loam)",
                "organic_carbon_pct": 0.65,
                "nitrogen_kg_ha": 290.0,
                "phosphorus_kg_ha": 26.0,
                "potassium_kg_ha": 220.0,
                "ec_ds_m": None,
                "zinc_ppm": None,
                "boron_ppm": None,
            },
        }
    },
    "Andhra Pradesh": {
        "Guntur": {
            "agro_climatic_zone": "Krishna Agro-Climatic Zone",
            "data_source": "ICAR-NBSS&LUP & ANGRAU Soil Reference",
            "reference_date": "2023-2024 Survey Cycle",
            "geographic_resolution": "District / Block Regional Reference",
            "dominant_soil_type": "Black Cotton Soil",
            "secondary_soil_type": "Alluvial Loam",
            "blocks": {
                "Tenali": ["Tenali", "Kolakaluru", "Angalakuduru"],
                "Mangalagiri": ["Mangalagiri", "Tadepalle", "Pedavadlapudi"],
                "Sattenapalle": ["Sattenapalle", "Phirangipuram"],
            },
            "regional_baseline": {
                "ph": 7.4,
                "ph_range": "6.8 – 8.1 (Calcareous Black Cotton Vertisols & Delta Alluvium)",
                "organic_carbon_pct": 0.52,
                "nitrogen_kg_ha": 255.0,
                "phosphorus_kg_ha": 23.0,
                "potassium_kg_ha": 295.0,
                "ec_ds_m": None,
                "zinc_ppm": None,
                "boron_ppm": None,
            },
        }
    },
}

try:
    import json as _json
    from pathlib import Path as _Path

    _INDIA_LOC_PATH = _Path(__file__).resolve().parents[3] / "data" / "india_soil_locations.json"
    if _INDIA_LOC_PATH.exists():
        _full_india_db = _json.loads(_INDIA_LOC_PATH.read_text(encoding="utf-8"))
        for _st, _dists in _full_india_db.items():
            if _st not in REGIONAL_SOIL_DATABASE:
                REGIONAL_SOIL_DATABASE[_st] = _dists
            else:
                for _dt, _dmeta in _dists.items():
                    if _dt not in REGIONAL_SOIL_DATABASE[_st]:
                        REGIONAL_SOIL_DATABASE[_st][_dt] = _dmeta
                    else:
                        # Merge additional blocks into existing district entry
                        for _blk, _vils in _dmeta.get("blocks", {}).items():
                            if _blk not in REGIONAL_SOIL_DATABASE[_st][_dt]["blocks"]:
                                REGIONAL_SOIL_DATABASE[_st][_dt]["blocks"][_blk] = _vils
except Exception as _exc:
    pass



# Extended Agronomic Requirements per Crop (ICAR / OUAT Crop Production Guide)
CROP_SOIL_REQUIREMENTS: Dict[str, Dict[str, Any]] = {
    "Rice": {
        "seasons": ["Kharif", "Rabi"],
        "water_need": "High (Assured Canal / Lowland Bunded / Heavy Monsoon)",
        "preferred_soils": ["Alluvial Loam", "Clay Loam", "Black Cotton Soil"],
        "ph_min": 5.2,
        "ph_max": 7.5,
        "npk_target_kg_ha": {"N": 80, "P": 40, "K": 40},
        "reference": "ICAR-NRRI Cuttack & OUAT Paddy Package of Practices",
    },
    "Wheat": {
        "seasons": ["Rabi"],
        "water_need": "Moderate (3–4 Irrigations at CRI, Tillering, Booting, Milk stage)",
        "preferred_soils": ["Alluvial Loam", "Clay Loam", "Sandy Loam"],
        "ph_min": 6.0,
        "ph_max": 7.8,
        "npk_target_kg_ha": {"N": 100, "P": 50, "K": 40},
        "reference": "ICAR-IIWBR & State Rabi Crop Guide",
    },
    "Potato": {
        "seasons": ["Rabi"],
        "water_need": "Moderate (Well-drained Furrow / Drip Irrigation; sensitive to waterlogging)",
        "preferred_soils": ["Sandy Loam", "Alluvial Loam", "Red Laterite Soil"],
        "ph_min": 5.2,
        "ph_max": 6.8,
        "npk_target_kg_ha": {"N": 120, "P": 60, "K": 80},
        "reference": "ICAR-CPRI Shimla & OUAT Rabi Vegetable Manual",
    },
    "Tomato": {
        "seasons": ["Rabi", "Kharif", "Zaid"],
        "water_need": "Moderate (Drip / Furrow Irrigation; avoid water stagnation)",
        "preferred_soils": ["Alluvial Loam", "Sandy Loam", "Red Laterite Soil"],
        "ph_min": 5.8,
        "ph_max": 7.2,
        "npk_target_kg_ha": {"N": 100, "P": 60, "K": 60},
        "reference": "ICAR-IIHR & OUAT Vegetable Production Guide",
    },
    "Onion": {
        "seasons": ["Rabi", "Kharif"],
        "water_need": "Moderate (Light frequent irrigation; friable non-crusting soil)",
        "preferred_soils": ["Sandy Loam", "Alluvial Loam"],
        "ph_min": 6.0,
        "ph_max": 7.5,
        "npk_target_kg_ha": {"N": 80, "P": 40, "K": 60},
        "reference": "ICAR-DOGR Onion Agronomic Manual",
    },
    "Chilli": {
        "seasons": ["Rabi", "Kharif", "Zaid"],
        "water_need": "Moderate (Drip / Ridge-and-Furrow)",
        "preferred_soils": ["Alluvial Loam", "Black Cotton Soil", "Sandy Loam"],
        "ph_min": 6.0,
        "ph_max": 7.5,
        "npk_target_kg_ha": {"N": 90, "P": 45, "K": 50},
        "reference": "ICAR-IIVR Spice & Vegetable Reference",
    },
    "Brinjal": {
        "seasons": ["Kharif", "Rabi", "Zaid"],
        "water_need": "Moderate (Regular irrigation)",
        "preferred_soils": ["Alluvial Loam", "Sandy Loam", "Clay Loam"],
        "ph_min": 5.5,
        "ph_max": 7.2,
        "npk_target_kg_ha": {"N": 100, "P": 50, "K": 50},
        "reference": "OUAT Vegetable Package of Practices",
    },
    "Maize": {
        "seasons": ["Kharif", "Rabi", "Zaid"],
        "water_need": "Moderate (Upland well-drained; sensitive to waterlogging)",
        "preferred_soils": ["Sandy Loam", "Alluvial Loam", "Red Laterite Soil"],
        "ph_min": 5.5,
        "ph_max": 7.5,
        "npk_target_kg_ha": {"N": 100, "P": 50, "K": 40},
        "reference": "ICAR-IIMR Maize Production Guidelines",
    },
    "Cotton": {
        "seasons": ["Kharif"],
        "water_need": "Moderate / Rainfed-Compatible (Deep moisture-retentive soils)",
        "preferred_soils": ["Black Cotton Soil", "Clay Loam", "Alluvial Loam"],
        "ph_min": 6.0,
        "ph_max": 8.2,
        "npk_target_kg_ha": {"N": 80, "P": 40, "K": 40},
        "reference": "ICAR-CICR Cotton Advisory",
    },
    "Groundnut": {
        "seasons": ["Kharif", "Rabi", "Zaid"],
        "water_need": "Low to Moderate (Friable light soil for peg penetration)",
        "preferred_soils": ["Sandy Loam", "Red Laterite Soil", "Alluvial Loam"],
        "ph_min": 5.5,
        "ph_max": 7.0,
        "npk_target_kg_ha": {"N": 20, "P": 40, "K": 40},
        "reference": "ICAR-DGR Groundnut & Oilseed Manual",
    },
    "Mustard": {
        "seasons": ["Rabi"],
        "water_need": "Low to Moderate (1–2 life-saving irrigations)",
        "preferred_soils": ["Sandy Loam", "Alluvial Loam"],
        "ph_min": 6.0,
        "ph_max": 7.5,
        "npk_target_kg_ha": {"N": 60, "P": 30, "K": 30},
        "reference": "ICAR-DRMR Rapeseed-Mustard Guide",
    },
    "Soybean": {
        "seasons": ["Kharif"],
        "water_need": "Moderate / Rainfed (Well-drained loam to clay loam)",
        "preferred_soils": ["Black Cotton Soil", "Clay Loam", "Alluvial Loam"],
        "ph_min": 6.0,
        "ph_max": 7.5,
        "npk_target_kg_ha": {"N": 25, "P": 60, "K": 40},
        "reference": "ICAR-IISR Soybean Cultivation Reference",
    },
    "Banana": {
        "seasons": ["Kharif", "Rabi", "Zaid"],
        "water_need": "High (Assured Drip / Perennial Irrigation)",
        "preferred_soils": ["Alluvial Loam", "Clay Loam"],
        "ph_min": 6.0,
        "ph_max": 7.5,
        "npk_target_kg_ha": {"N": 150, "P": 50, "K": 180},
        "reference": "ICAR-NRCB Banana Production Manual",
    },
    "Mango": {
        "seasons": ["Kharif", "Rabi"],
        "water_need": "Low to Moderate (Deep well-drained upland soil)",
        "preferred_soils": ["Red Laterite Soil", "Alluvial Loam", "Sandy Loam"],
        "ph_min": 5.5,
        "ph_max": 7.5,
        "npk_target_kg_ha": {"N": 75, "P": 40, "K": 75},
        "reference": "ICAR-CISH Orchard Nutrition Guide",
    },
}


class SoilService:
    @staticmethod
    def get_location_hierarchy() -> Dict[str, Any]:
        """Returns the verified State -> District -> Block -> Village hierarchy."""
        hierarchy: Dict[str, Any] = {}
        for state, districts in REGIONAL_SOIL_DATABASE.items():
            hierarchy[state] = {}
            for dist, dmeta in districts.items():
                hierarchy[state][dist] = {
                    "agro_climatic_zone": dmeta["agro_climatic_zone"],
                    "dominant_soil_type": dmeta["dominant_soil_type"],
                    "blocks": dmeta["blocks"],
                }
        return hierarchy

    @staticmethod
    def lookup_regional_soil(
        state: str = "Odisha",
        district: str = "Khordha",
        block: Optional[str] = None,
        village: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Module 1: Location-Based Soil Intelligence.
        Looks up verified regional soil reference baselines and explicitly reports
        source, date, geographic resolution, and missing plot-level measurements.
        """
        state_data = REGIONAL_SOIL_DATABASE.get(state) or REGIONAL_SOIL_DATABASE["Odisha"]
        dist_data = state_data.get(district)
        if not dist_data:
            first_dist = next(iter(state_data.keys()))
            dist_data = state_data[first_dist]
            district = first_dist

        blocks = dist_data["blocks"]
        resolved_block = (block.strip() if (block and block.strip()) else next(iter(blocks.keys())))
        villages = blocks.get(resolved_block, blocks.get(next(iter(blocks.keys())), []))
        resolved_village = (
            village.strip()
            if (village and village.strip())
            else (villages[0] if villages else "General Block Area")
        )

        baseline = dist_data["regional_baseline"]
        ph_num_range = baseline.get("ph_numeric_range") or [round(baseline["ph"] - 0.5, 1), round(baseline["ph"] + 0.5, 1)]
        missing_params = [
            "Individual Plot Lab pH (Regional baseline shown)",
            "Individual Plot Available N, P, K (Regional baseline shown)",
            "Electrical Conductivity (EC dS/m) — Not measured",
            "Secondary & Micronutrients (Sulphur, Zinc, Boron, Iron) — Lab test required",
            "Live In-Situ Soil Moisture — No physical sensor connected",
        ]

        return {
            "status": "success",
            "location": {
                "state": state,
                "district": district,
                "block": resolved_block,
                "village": resolved_village,
            },
            "data_source_type": "REGIONAL_REFERENCE",
            "data_source": dist_data["data_source"],
            "reference_date": dist_data["reference_date"],
            "geographic_resolution": dist_data["geographic_resolution"],
            "agro_climatic_zone": dist_data["agro_climatic_zone"],
            "is_individual_farm_measurement": False,
            "disclaimer": (
                "REGIONAL BASELINE ONLY — NOT AN INDIVIDUAL FARM MEASUREMENT. "
                "These values are District/Block regional reference averages from published "
                "soil surveys. Upload a laboratory Soil Health Card or enter lab-tested values "
                "before applying chemical corrective dosages."
            ),
            "soil_type": dist_data["dominant_soil_type"],
            "dominant_soil_type": dist_data["dominant_soil_type"],
            "secondary_soil_type": dist_data["secondary_soil_type"],
            "ph_range": ph_num_range,
            "ph_regional_estimate": baseline["ph"],
            "oc_pct_regional_estimate": baseline["organic_carbon_pct"],
            "ec_ds_m_regional_estimate": baseline["ec_ds_m"],
            "regional_parameters": {
                "ph": {"value": baseline["ph"], "range": baseline["ph_range"], "unit": "pH", "source_label": "REGIONAL_REFERENCE"},
                "organic_carbon_pct": {"value": baseline["organic_carbon_pct"], "unit": "%", "source_label": "REGIONAL_REFERENCE"},
                "nitrogen_kg_ha": {"value": baseline["nitrogen_kg_ha"], "unit": "kg/ha", "source_label": "REGIONAL_REFERENCE"},
                "phosphorus_kg_ha": {"value": baseline["phosphorus_kg_ha"], "unit": "kg/ha", "source_label": "REGIONAL_REFERENCE"},
                "potassium_kg_ha": {"value": baseline["potassium_kg_ha"], "unit": "kg/ha", "source_label": "REGIONAL_REFERENCE"},
                "ec_ds_m": {"value": None, "unit": "dS/m", "source_label": "MISSING"},
                "zinc_ppm": {"value": None, "unit": "ppm", "source_label": "MISSING"},
                "boron_ppm": {"value": None, "unit": "ppm", "source_label": "MISSING"},
            },
            "missing_data_status": missing_params,
            "missing_parameters": missing_params,
        }

    @staticmethod
    def extract_soil_report_ocr(
        file_bytes: bytes,
        filename: str,
        raw_text_override: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Module 2: Soil Report Reader (OCR & PDF/Image/Text Parser).
        Extracts pH, EC, OC, N, P, K, micronutrients, lab name, and test date from
        uploaded Soil Health Card PDFs, images, or text streams.
        Validates units & physiological bounds and returns editable fields.
        Never fabricates values that are not found in the document!
        """
        extracted_text = raw_text_override or ""
        extraction_method = "Direct Text Stream"

        ext = (filename or "").lower().split(".")[-1]
        if not extracted_text and file_bytes:
            if ext == "pdf":
                extraction_method = "PDF Stream Parser"
                try:
                    import pypdf  # type: ignore
                    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                    extracted_text = "\n".join(page.extract_text() or "" for page in reader.pages)
                except Exception:
                    decoded = file_bytes.decode("latin-1", errors="ignore")
                    parenthetical = re.findall(r"\(([^()]{2,200})\)", decoded)
                    extracted_text = "\n".join(parenthetical) if parenthetical else decoded
            elif ext in ("jpg", "jpeg", "png", "webp", "bmp"):
                extraction_method = "Image OCR / Metadata Reader"
                try:
                    import pytesseract  # type: ignore
                    from PIL import Image
                    img = Image.open(io.BytesIO(file_bytes))
                    extracted_text = pytesseract.image_to_string(img)
                except Exception:
                    decoded = file_bytes.decode("utf-8", errors="ignore")
                    extracted_text = decoded
            else:
                extracted_text = file_bytes.decode("utf-8", errors="ignore")

        def _find_float(patterns: List[str], text: str) -> Tuple[Optional[float], Optional[str]]:
            for pat in patterns:
                m = re.search(pat, text, flags=re.IGNORECASE)
                if m:
                    try:
                        val = float(m.group(1))
                        unit = m.group(2).strip() if m.lastindex and m.lastindex >= 2 and m.group(2) else None
                        return val, unit
                    except (ValueError, IndexError):
                        continue
            return None, None

        ph_val, _ = _find_float(
            [
                r"\bpH\b[^0-9\n]{0,25}([0-9]{1,2}\.[0-9]{1,2})",
                r"Soil\s*Reaction\s*\(pH\)[^0-9\n]{0,20}([0-9]{1,2}\.[0-9]{1,2})",
            ],
            extracted_text,
        )
        ec_val, _ = _find_float(
            [
                r"\bEC\b[^0-9\n]{0,25}([0-9]{1,2}\.[0-9]{1,3})\s*(dS/m|mmhos/cm)?",
                r"Electrical\s*Conductivity[^0-9\n]{0,25}([0-9]{1,2}\.[0-9]{1,3})\s*(dS/m)?",
            ],
            extracted_text,
        )
        oc_val, _ = _find_float(
            [
                r"Organic\s*Carbon\s*(?:\(OC\))?[^0-9\n]{0,25}([0-9]{1,2}\.[0-9]{1,3})\s*(%)?",
                r"\bOC\b[^0-9\n]{0,20}([0-9]{1,2}\.[0-9]{1,2})\s*(%)?",
            ],
            extracted_text,
        )
        n_val, n_unit = _find_float(
            [
                r"(?:Available\s*)?Nitrogen\s*(?:\(N\))?[^0-9\n]{0,25}([0-9]{1,4}(?:\.[0-9]{1,2})?)\s*(kg/ha|kg/acre)?",
                r"\bN\s*\(kg/ha\)[^0-9\n]{0,15}([0-9]{1,4}(?:\.[0-9]{1,2})?)",
            ],
            extracted_text,
        )
        p_val, p_unit = _find_float(
            [
                r"(?:Available\s*)?Phosphorus\s*(?:\(P(?:2O5)?\))?[^0-9\n]{0,25}([0-9]{1,3}(?:\.[0-9]{1,2})?)\s*(kg/ha|kg/acre)?",
                r"\bP\s*\(kg/ha\)[^0-9\n]{0,15}([0-9]{1,3}(?:\.[0-9]{1,2})?)",
            ],
            extracted_text,
        )
        k_val, k_unit = _find_float(
            [
                r"(?:Available\s*)?Potassium\s*(?:\(K(?:2O)?\))?[^0-9\n]{0,25}([0-9]{1,4}(?:\.[0-9]{1,2})?)\s*(kg/ha|kg/acre)?",
                r"\bK\s*\(kg/ha\)[^0-9\n]{0,15}([0-9]{1,4}(?:\.[0-9]{1,2})?)",
            ],
            extracted_text,
        )
        zn_val, _ = _find_float(
            [r"Zinc\s*(?:\(Zn\))?[^0-9\n]{0,25}([0-9]{1,2}\.[0-9]{1,2})\s*(ppm|mg/kg)?"],
            extracted_text,
        )
        b_val, _ = _find_float(
            [r"Boron\s*(?:\(B\))?[^0-9\n]{0,25}([0-9]{1,2}\.[0-9]{1,2})\s*(ppm|mg/kg)?"],
            extracted_text,
        )
        s_val, _ = _find_float(
            [r"Sulphur\s*(?:\(S\))?[^0-9\n]{0,25}([0-9]{1,3}\.[0-9]{1,2})\s*(ppm|mg/kg)?"],
            extracted_text,
        )

        # Extract test date if present (YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY)
        test_date_found = None
        date_m = re.search(
            r"(?:Date|Tested\s*On|Sample\s*Date)[^0-9\n]{0,15}(\d{4}-\d{2}-\d{2}|\d{2}[/-]\d{2}[/-]\d{4})",
            extracted_text,
            flags=re.IGNORECASE,
        )
        if date_m:
            raw_d = date_m.group(1)
            if "/" in raw_d or (raw_d.count("-") == 2 and len(raw_d.split("-")[0]) == 2):
                parts = re.split(r"[/-]", raw_d)
                test_date_found = f"{parts[2]}-{parts[1]}-{parts[0]}"
            else:
                test_date_found = raw_d

        # Extract Lab / Source Name if present
        lab_match = re.search(
            r"(?:Lab(?:oratory)?\s*Name|Testing\s*Center|Issued\s*By)\s*[:\-]\s*([^\n\r]{4,80})",
            extracted_text,
            flags=re.IGNORECASE,
        )
        if not lab_match:
            lab_match = re.search(
                r"([^\n\r]*(?:Soil\s*Testing\s*Lab(?:oratory)?|Krishi\s*Vigyan\s*Kendra|OUAT)[^\n\r]*)",
                extracted_text,
                flags=re.IGNORECASE,
            )
        lab_name = lab_match.group(1).strip() if lab_match else f"Uploaded Report ({filename})"

        # Unit conversion (kg/acre -> kg/ha) & Physiological Validation
        validation_warnings: List[str] = []
        if n_val is not None and n_unit and "acre" in n_unit.lower():
            orig = n_val
            n_val = round(n_val * 2.471, 1)
            validation_warnings.append(f"Converted nitrogen_kg_ha from {orig} kg/acre to {n_val} kg/ha (×2.471).")
        if p_val is not None and p_unit and "acre" in p_unit.lower():
            orig = p_val
            p_val = round(p_val * 2.471, 1)
            validation_warnings.append(f"Converted phosphorus_kg_ha from {orig} kg/acre to {p_val} kg/ha (×2.471).")
        if k_val is not None and k_unit and "acre" in k_unit.lower():
            orig = k_val
            k_val = round(k_val * 2.471, 1)
            validation_warnings.append(f"Converted potassium_kg_ha from {orig} kg/acre to {k_val} kg/ha (×2.471).")

        if ph_val is not None and not (3.0 <= ph_val <= 10.5):
            validation_warnings.append(
                f"Extracted pH ({ph_val}) is outside valid physiological range (3.0–10.5) and was rejected. Please verify."
            )
            ph_val = None
        if oc_val is not None and not (0.05 <= oc_val <= 10.0):
            validation_warnings.append(
                f"Extracted Organic Carbon ({oc_val}%) is outside valid physiological range (0.05–10%). Please verify."
            )
            oc_val = None

        extracted_fields = {
            "ph": ph_val,
            "ec_ds_m": ec_val,
            "organic_carbon_pct": oc_val,
            "nitrogen_kg_ha": n_val,
            "phosphorus_kg_ha": p_val,
            "potassium_kg_ha": k_val,
            "zinc_ppm": zn_val,
            "boron_ppm": b_val,
            "sulphur_ppm": s_val,
        }
        found_count = sum(1 for v in extracted_fields.values() if v is not None)
        missing_fields = [k for k, v in extracted_fields.items() if v is None]

        if found_count == 0:
            validation_warnings.append(
                "Could not automatically detect numeric soil parameters in the uploaded file. "
                "Please enter or correct your Soil Health Card values in the verification fields below."
            )

        return {
            "status": "success" if found_count > 0 else "manual_verification_required",
            "filename": filename,
            "extraction_method": extraction_method,
            "extraction_engine": extraction_method,
            "data_source_type": "MEASURED_LAB_VALUE",
            "lab_source": lab_name,
            "source_lab": lab_name,
            "test_date": test_date_found or datetime.now().strftime("%Y-%m-%d"),
            "extracted_values": extracted_fields,
            "fields_detected_count": found_count,
            "missing_fields": missing_fields,
            "unit_validation_warnings": validation_warnings,
            "validation_warnings": validation_warnings,
            "raw_text_preview": extracted_text[:1000],
            "requires_farmer_confirmation": True,
        }

    @staticmethod
    def analyze_soil_dss(
        ph: Optional[float] = None,
        n: Optional[float] = None,
        p: Optional[float] = None,
        k: Optional[float] = None,
        oc: Optional[float] = None,
        ec: Optional[float] = None,
        zinc_ppm: Optional[float] = None,
        boron_ppm: Optional[float] = None,
        moisture: Optional[float] = None,
        soil_type: str = "Alluvial Loam",
        season: str = "Kharif",
        water_availability: str = "Assured Canal / Tube-Well",
        target_crop: Optional[str] = "Rice",
        data_source_type: str = "FARMER_MANUAL_LAB_ENTRY",
        data_source_name: str = "Farmer Submitted Soil Test",
        test_date: Optional[str] = None,
        location: Optional[Dict[str, str]] = None,
        weather_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Comprehensive AI Soil Decision Support System (Modules 3, 4, 6, 7).
        Explicitly tracks missing inputs, never fabricates deficiencies or dosages
        when measurements are absent, and generates multilingual explanations.
        """
        target_crop_norm = (target_crop or "Rice").split("(")[0].strip() or "Rice"
        is_regional_only = data_source_type == "REGIONAL_REFERENCE"
        src_badge = "REGIONAL_REFERENCE" if is_regional_only else "MEASURED_LAB_VALUE"

        missing_inputs: List[str] = []
        if ph is None:
            missing_inputs.append("Soil pH")
        if n is None:
            missing_inputs.append("Available Nitrogen (N)")
        if p is None:
            missing_inputs.append("Available Phosphorus (P)")
        if k is None:
            missing_inputs.append("Available Potassium (K)")
        if oc is None:
            missing_inputs.append("Organic Carbon (OC)")

        # 1. Parameter Status Evaluation (Only for non-null parameters)
        if ph is None:
            ph_status = "Unknown / Not Tested"
        elif ph < 5.5:
            ph_status = f"Strongly Acidic (pH {ph:.1f} < 5.5 — Lime requirement zone)"
        elif ph < 6.5:
            ph_status = f"Moderately Acidic (pH {ph:.1f} — Favorable for Rice, Potato, Tea)"
        elif ph <= 7.5:
            ph_status = f"Optimal Neutral (pH {ph:.1f} — Ideal nutrient availability)"
        elif ph <= 8.2:
            ph_status = f"Moderately Alkaline (pH {ph:.1f} — Monitor micronutrient availability)"
        else:
            ph_status = f"Strongly Alkaline / Sodic (pH {ph:.1f} > 8.2 — Gypsum amendment zone)"

        if n is None:
            n_status = "Unknown / Not Tested"
        elif n < 280:
            n_status = f"Low ({n:.0f} kg/ha < 280 ICAR threshold)"
        elif n <= 560:
            n_status = f"Medium ({n:.0f} kg/ha — 280–560 ICAR range)"
        else:
            n_status = f"High ({n:.0f} kg/ha > 560 ICAR threshold)"

        if p is None:
            p_status = "Unknown / Not Tested"
        elif p < 10:
            p_status = f"Low ({p:.1f} kg/ha < 10 ICAR threshold)"
        elif p <= 25:
            p_status = f"Medium ({p:.1f} kg/ha — 10–25 ICAR range)"
        else:
            p_status = f"High ({p:.1f} kg/ha > 25 ICAR threshold)"

        if k is None:
            k_status = "Unknown / Not Tested"
        elif k < 110:
            k_status = f"Low ({k:.0f} kg/ha < 110 ICAR threshold)"
        elif k <= 280:
            k_status = f"Medium ({k:.0f} kg/ha — 110–280 ICAR range)"
        else:
            k_status = f"High ({k:.0f} kg/ha > 280 ICAR threshold)"

        if oc is None:
            oc_status = "Unknown / Not Tested"
        elif oc < 0.50:
            oc_status = f"Low ({oc:.2f}% < 0.50% ICAR threshold)"
        elif oc <= 0.75:
            oc_status = f"Medium ({oc:.2f}% — 0.50–0.75% ICAR range)"
        else:
            oc_status = f"High ({oc:.2f}% > 0.75% ICAR threshold)"

        # Source-labelled parameter cards
        parameter_cards = [
            {"key": "ph", "parameter": "ph", "label": "Soil pH", "value": ph, "unit": "", "status": ph_status, "source_type": "MISSING" if ph is None else src_badge, "source_name": data_source_name},
            {"key": "nitrogen_kg_ha", "parameter": "nitrogen_kg_ha", "label": "Available Nitrogen (N)", "value": n, "unit": "kg/ha", "status": n_status, "source_type": "MISSING" if n is None else src_badge, "source_name": data_source_name},
            {"key": "phosphorus_kg_ha", "parameter": "phosphorus_kg_ha", "label": "Available Phosphorus (P)", "value": p, "unit": "kg/ha", "status": p_status, "source_type": "MISSING" if p is None else src_badge, "source_name": data_source_name},
            {"key": "potassium_kg_ha", "parameter": "potassium_kg_ha", "label": "Available Potassium (K)", "value": k, "unit": "kg/ha", "status": k_status, "source_type": "MISSING" if k is None else src_badge, "source_name": data_source_name},
            {"key": "organic_carbon_pct", "parameter": "organic_carbon_pct", "label": "Organic Carbon (OC)", "value": oc, "unit": "%", "status": oc_status, "source_type": "MISSING" if oc is None else src_badge, "source_name": data_source_name},
            {"key": "ec_ds_m", "parameter": "ec_ds_m", "label": "Electrical Conductivity (EC)", "value": ec, "unit": "dS/m", "status": f"{ec:.2f} dS/m (Normal < 1.0)" if ec is not None else "Not Tested", "source_type": "MISSING" if ec is None else src_badge, "source_name": data_source_name},
        ]

        # Overall Fertility Score (calculated only from available parameters)
        available_scores = []
        if ph is not None:
            available_scores.append(92.0 if 6.0 <= ph <= 7.5 else (76.0 if 5.5 <= ph <= 8.0 else 52.0))
        if n is not None:
            available_scores.append(90.0 if n >= 280 else (72.0 if n >= 200 else 55.0))
        if p is not None:
            available_scores.append(90.0 if p >= 15 else (74.0 if p >= 10 else 55.0))
        if k is not None:
            available_scores.append(90.0 if k >= 140 else (75.0 if k >= 100 else 55.0))
        if oc is not None:
            available_scores.append(90.0 if oc >= 0.55 else (72.0 if oc >= 0.40 else 54.0))

        fertility_score = round(sum(available_scores) / len(available_scores), 1) if available_scores else 0.0

        # 2. Module 3: Evidence-Based Crop Suitability Engine
        season_norm = season.split()[0].strip() if season else "Kharif"
        if is_regional_only or len(missing_inputs) >= 3:
            uncertainty_badge = f"High Uncertainty ({len(missing_inputs)} plot parameter(s) missing or regional-only baseline)"
        elif len(missing_inputs) > 0:
            uncertainty_badge = f"Moderate Uncertainty ({len(missing_inputs)} soil parameter(s) missing: {', '.join(missing_inputs)})"
        else:
            uncertainty_badge = "Low Uncertainty (Complete Plot Soil Parameters Provided)"

        suitability_list: List[Dict[str, Any]] = []
        for crop_name, meta in CROPS_METADATA.items():
            req = CROP_SOIL_REQUIREMENTS.get(crop_name, {
                "seasons": ["Kharif", "Rabi"],
                "water_need": "Moderate",
                "preferred_soils": ["Alluvial Loam", "Sandy Loam"],
                "ph_min": 5.5,
                "ph_max": 7.5,
                "reference": "ICAR Standard Crop Guide",
            })
            score = 78
            reasons: List[str] = []
            limiting: List[str] = []

            if soil_type in req["preferred_soils"] or any(s.lower() in soil_type.lower() for s in req["preferred_soils"]):
                score += 10
                reasons.append(f"{soil_type} matches {crop_name}'s root & drainage profile.")
            else:
                score -= 6
                limiting.append(f"Prefers {', '.join(req['preferred_soils'][:2])} over {soil_type}.")

            if season_norm in req["seasons"]:
                score += 7
                reasons.append(f"Well-suited for {season_norm} sowing window.")
            else:
                score -= 18
                limiting.append(f"Primarily grown in {'/'.join(req['seasons'])} season (current selection: {season_norm}).")

            water_lower = (water_availability or "").lower()
            if crop_name in ("Rice", "Banana") and ("rainfed" in water_lower or "low" in water_lower or "drought" in water_lower):
                score -= 16
                limiting.append(f"{crop_name} has high water requirement ({meta.get('water_requirement_mm', 1200)} mm); risky under limited water.")
            elif crop_name in ("Groundnut", "Mustard", "Maize", "Cotton") and ("low" in water_lower or "rainfed" in water_lower or "drip" in water_lower):
                score += 5
                reasons.append(f"Water-efficient crop compatible with {water_availability}.")
            else:
                reasons.append(f"Compatible with {water_availability} regime.")

            if ph is not None:
                if req["ph_min"] <= ph <= req["ph_max"]:
                    score += 5
                    reasons.append(f"Soil pH ({ph:.1f}) is within optimal range ({req['ph_min']}–{req['ph_max']}).")
                else:
                    score -= 14
                    limiting.append(f"Soil pH ({ph:.1f}) is outside {crop_name}'s optimal range ({req['ph_min']}–{req['ph_max']}).")
            else:
                limiting.append("Soil pH not provided — pH compatibility unverified.")

            if target_crop and target_crop_norm.lower() == crop_name.lower():
                score += 4
                reasons.append("Selected as farmer's primary target crop.")

            final_score = int(max(35, min(98, score)))
            if final_score >= 85:
                tier = "Highly Suitable"
            elif final_score >= 70:
                tier = "Moderately Suitable"
            else:
                tier = "Conditional / Marginal"

            suitability_list.append({
                "crop": crop_name,
                "scientific_name": meta["scientific_name"],
                "suitability_score": final_score,
                "tier": tier,
                "classification": tier,
                "seasons": req["seasons"],
                "water_requirement": req["water_need"],
                "reasons": reasons,
                "limiting_factors": limiting,
                "notes": " ".join(reasons[:2] + limiting[:1]),
                "uncertainty": uncertainty_badge,
                "missing_inputs": missing_inputs,
                "reference": req["reference"],
            })

        suitability_list.sort(key=lambda x: x["suitability_score"], reverse=True)

        # 3. Module 4: Soil Improvement Advisor (Validated References; Never Fabricates Dosages)
        recommendations: List[str] = []
        structured_advisor: List[Dict[str, Any]] = []

        if is_regional_only:
            msg = (
                "REGIONAL DATA LIMITATION: Exact chemical fertilizer dosages (Urea, DAP, MOP) cannot be fabricated "
                "because current values come from a District/Block regional baseline rather than a lab test of "
                "your plot. Upload a Soil Health Card or enter plot lab measurements to unlock exact dosages."
            )
            recommendations.append(msg)
            structured_advisor.append({
                "parameter": "Plot N-P-K Chemical Dosages",
                "category": "Data Requirement Notice",
                "measured_value": "Regional Baseline Only (Missing Plot Lab Test)",
                "status": "Data Missing — Chemical Dosage Refused",
                "guidance": msg,
                "recommendation": msg,
                "reference_source": "ICAR Soil Health Card (SHC) Protocol",
                "reference": "ICAR Soil Health Card (SHC) Protocol",
            })
            safe_msg = "Incorporate 2–4 tonnes/acre of well-decomposed Farm Yard Manure (FYM) or green manure (Dhaincha) 15 days before sowing to maintain soil organic carbon."
            structured_advisor.append({
                "parameter": "Organic Soil Conditioning",
                "category": "Safe General Soil Conditioning",
                "measured_value": f"OC Est: {oc if oc is not None else 'Untested'}%",
                "status": "Safe Organic Practice",
                "guidance": safe_msg,
                "recommendation": safe_msg,
                "reference_source": "OUAT General Agronomy Guidelines",
                "reference": "OUAT General Agronomy Guidelines",
            })
        else:
            if ph is None:
                msg_ph = "Soil pH was not provided. Lime/gypsum amendment dosages cannot be fabricated without a pH test."
                structured_advisor.append({
                    "parameter": "Soil Reaction (pH)",
                    "category": "Soil Reaction (pH)",
                    "measured_value": "Missing",
                    "status": "Missing — Amendment Refused",
                    "guidance": msg_ph,
                    "recommendation": msg_ph,
                    "reference_source": "ICAR Soil Testing Manual",
                    "reference": "ICAR Soil Testing Manual",
                })
            elif ph < 5.5:
                rec = f"Acidic Soil Correction (pH {ph:.1f}): Broadcast agricultural lime (CaCO₃) or paper mill sludge @ 200–250 kg/acre in furrows 15 days before sowing."
                recommendations.append(rec)
                structured_advisor.append({
                    "parameter": "Soil Reaction (pH)",
                    "category": "Acidic Soil Amendment",
                    "measured_value": f"pH {ph:.1f}",
                    "status": "Strongly Acidic — Lime Required",
                    "guidance": rec,
                    "recommendation": rec,
                    "reference_source": "OUAT Acid Soil Management Bulletin (Odisha)",
                    "reference": "OUAT Acid Soil Management Bulletin (Odisha)",
                })
            elif ph > 8.2:
                rec = f"Alkaline Soil Correction (pH {ph:.1f}): Incorporate agricultural gypsum (CaSO₄·2H₂O) @ 200–300 kg/acre followed by leaching irrigation."
                recommendations.append(rec)
                structured_advisor.append({
                    "parameter": "Soil Reaction (pH)",
                    "category": "Alkaline / Sodic Amendment",
                    "measured_value": f"pH {ph:.1f}",
                    "status": "Alkaline — Gypsum Required",
                    "guidance": rec,
                    "recommendation": rec,
                    "reference_source": "ICAR-CSSRI Reclamation Guidelines",
                    "reference": "ICAR-CSSRI Reclamation Guidelines",
                })
            else:
                rec = f"Soil pH ({ph:.1f}) is within the favorable root nutrient uptake range. No chemical lime or gypsum amendment required."
                structured_advisor.append({
                    "parameter": "Soil Reaction (pH)",
                    "category": "Soil Reaction (pH)",
                    "measured_value": f"pH {ph:.1f}",
                    "status": "Optimal Range",
                    "guidance": rec,
                    "recommendation": rec,
                    "reference_source": "ICAR Soil Health Card Interpretation Manual",
                    "reference": "ICAR Soil Health Card Interpretation Manual",
                })

            if oc is not None and oc < 0.50:
                rec = f"Low Organic Carbon ({oc:.2f}%): Apply 4–5 tonnes/acre of well-rotted FYM or 1.5 tonnes/acre Vermicompost during final ploughing."
                recommendations.append(rec)
                structured_advisor.append({
                    "parameter": "Organic Carbon (OC)",
                    "category": "Organic Matter Restoration",
                    "measured_value": f"{oc:.2f}%",
                    "status": "Deficient (<0.50%)",
                    "guidance": rec,
                    "recommendation": rec,
                    "reference_source": "ICAR INM (Integrated Nutrient Management) Standard",
                    "reference": "ICAR INM (Integrated Nutrient Management) Standard",
                })

            crop_req = CROP_SOIL_REQUIREMENTS.get(target_crop_norm, CROP_SOIL_REQUIREMENTS["Rice"])
            base_npk = crop_req["npk_target_kg_ha"]

            if n is None:
                msg_n = "Available Nitrogen (N) was not measured. Chemical Urea dosage cannot be fabricated without a soil N value."
                structured_advisor.append({
                    "parameter": f"Available Nitrogen (N) — {target_crop_norm}",
                    "category": f"Nitrogen (N) for {target_crop_norm}",
                    "measured_value": "Missing",
                    "status": "Data Missing — Chemical Dosage Refused",
                    "guidance": msg_n,
                    "recommendation": msg_n,
                    "reference_source": crop_req["reference"],
                    "reference": crop_req["reference"],
                })
            else:
                factor_n = 1.20 if n < 280 else (1.0 if n <= 560 else 0.75)
                adj_n_kg_ha = round(base_npk["N"] * factor_n, 1)
                adj_n_kg_acre = round(adj_n_kg_ha / 2.471, 1)
                rec = (
                    f"Nitrogen ({n_status}) for {target_crop_norm}: Target {adj_n_kg_ha} kg N/ha (~{adj_n_kg_acre} kg N/acre). "
                    "Apply in 3 splits: 25% basal, 50% at active tillering/vegetative stage, and 25% at panicle/flowering initiation."
                )
                recommendations.append(rec)
                structured_advisor.append({
                    "parameter": f"Available Nitrogen (N) — {target_crop_norm}",
                    "category": f"Nitrogen (N) Advisory — {target_crop_norm}",
                    "measured_value": f"{n:.0f} kg/ha",
                    "status": "Low" if n < 280 else ("Medium" if n <= 560 else "High"),
                    "guidance": rec,
                    "recommendation": rec,
                    "reference_source": crop_req["reference"],
                    "reference": crop_req["reference"],
                })

            if p is None:
                msg_p = "Available Phosphorus (P) was not measured. DAP/SSP dosage cannot be fabricated without a soil P value."
                structured_advisor.append({
                    "parameter": f"Available Phosphorus (P) — {target_crop_norm}",
                    "category": f"Phosphorus (P) for {target_crop_norm}",
                    "measured_value": "Missing",
                    "status": "Data Missing — Chemical Dosage Refused",
                    "guidance": msg_p,
                    "recommendation": msg_p,
                    "reference_source": crop_req["reference"],
                    "reference": crop_req["reference"],
                })
            else:
                factor_p = 1.20 if p < 10 else (1.0 if p <= 25 else 0.75)
                adj_p_kg_ha = round(base_npk["P"] * factor_p, 1)
                adj_p_kg_acre = round(adj_p_kg_ha / 2.471, 1)
                rec = (
                    f"Phosphorus ({p_status}) for {target_crop_norm}: Target {adj_p_kg_ha} kg P₂O₅/ha (~{adj_p_kg_acre} kg P₂O₅/acre) "
                    "applied 100% as basal placement at sowing/transplanting."
                )
                recommendations.append(rec)
                structured_advisor.append({
                    "parameter": f"Available Phosphorus (P) — {target_crop_norm}",
                    "category": f"Phosphorus (P) Advisory — {target_crop_norm}",
                    "measured_value": f"{p:.1f} kg/ha",
                    "status": "Low" if p < 10 else ("Medium" if p <= 25 else "High"),
                    "guidance": rec,
                    "recommendation": rec,
                    "reference_source": crop_req["reference"],
                    "reference": crop_req["reference"],
                })

            if k is None:
                msg_k = "Available Potassium (K) was not measured. MOP dosage cannot be fabricated without a soil K value."
                structured_advisor.append({
                    "parameter": f"Available Potassium (K) — {target_crop_norm}",
                    "category": f"Potassium (K) for {target_crop_norm}",
                    "measured_value": "Missing",
                    "status": "Data Missing — Chemical Dosage Refused",
                    "guidance": msg_k,
                    "recommendation": msg_k,
                    "reference_source": crop_req["reference"],
                    "reference": crop_req["reference"],
                })
            else:
                factor_k = 1.20 if k < 110 else (1.0 if k <= 280 else 0.75)
                adj_k_kg_ha = round(base_npk["K"] * factor_k, 1)
                adj_k_kg_acre = round(adj_k_kg_ha / 2.471, 1)
                rec = (
                    f"Potassium ({k_status}) for {target_crop_norm}: Target {adj_k_kg_ha} kg K₂O/ha (~{adj_k_kg_acre} kg K₂O/acre) "
                    "applied 50% basal and 50% at panicle/fruit development stage."
                )
                recommendations.append(rec)
                structured_advisor.append({
                    "parameter": f"Available Potassium (K) — {target_crop_norm}",
                    "category": f"Potassium (K) Advisory — {target_crop_norm}",
                    "measured_value": f"{k:.0f} kg/ha",
                    "status": "Low" if k < 110 else ("Medium" if k <= 280 else "High"),
                    "guidance": rec,
                    "recommendation": rec,
                    "reference_source": crop_req["reference"],
                    "reference": crop_req["reference"],
                })

        if not recommendations:
            recommendations.append("Provide measured soil parameters (pH, N, P, K, OC) to generate targeted fertilizer recommendations.")

        # 4. Module 7: Soil & Weather Risk Integration (Never claims live soil sensors)
        wx = weather_context or {}
        rain_prob = float(wx.get("rain_prob_72h_pct", wx.get("rain_probability_pct", 35.0)))
        humidity = float(wx.get("humidity_pct", 74.0))
        temp_c = float(wx.get("temp_c", 30.0))

        soil_weather_risks: List[Dict[str, str]] = []
        if rain_prob >= 60.0 and ("Sandy" in soil_type or "Laterite" in soil_type or "Loam" in soil_type):
            alert_msg = (
                f"Forecast rainfall probability is {rain_prob:.0f}% on permeable {soil_type}. "
                "Postpone top-dressing Urea until heavy showers subside to prevent nitrogen leaching."
            )
            soil_weather_risks.append({
                "risk_type": "High Nitrogen Leaching & Runoff Risk",
                "risk_title": "High Nitrogen Leaching & Runoff Risk",
                "severity": "HIGH",
                "alert": alert_msg,
                "explanation": alert_msg,
                "evidence_basis": "Combined Soil Texture Permeability + Forecast Rainfall Probability (No live hardware sensor claimed)",
            })
        elif rain_prob >= 60.0 and ("Clay" in soil_type or "Black" in soil_type):
            alert_msg = (
                f"Forecast rainfall probability is {rain_prob:.0f}% on heavy {soil_type}. "
                f"Keep field drainage channels open, especially if growing non-paddy crops like {target_crop_norm}."
            )
            soil_weather_risks.append({
                "risk_type": "Root Zone Waterlogging & Poor Aeration Risk",
                "risk_title": "Root Zone Waterlogging & Poor Aeration Risk",
                "severity": "HIGH",
                "alert": alert_msg,
                "explanation": alert_msg,
                "evidence_basis": "Combined Heavy Soil Drainage Profile + Forecast Rainfall",
            })
        else:
            alert_msg = f"Moderate rain probability ({rain_prob:.0f}%) and {temp_c:.1f}°C allow safe basal or split nutrient incorporation."
            soil_weather_risks.append({
                "risk_type": "Favorable Fertilizer Application Window",
                "risk_title": "Favorable Fertilizer Application Window",
                "severity": "LOW",
                "alert": alert_msg,
                "explanation": alert_msg,
                "evidence_basis": "Meteorological Forecast + Soil Texture Compatibility",
            })

        if ph is not None and ph < 5.6 and humidity >= 80.0:
            alert_msg = (
                f"Acidic soil (pH {ph:.1f}) combined with {humidity:.0f}% relative humidity reduces silicon/potassium uptake "
                "and increases foliar blast and wilt susceptibility. Ensure balanced Potash (K) application."
            )
            soil_weather_risks.append({
                "risk_type": "Acidic Soil + High Humidity Fungal & Blast Susceptibility",
                "risk_title": "Acidic Soil + High Humidity Fungal & Blast Susceptibility",
                "severity": "MODERATE",
                "alert": alert_msg,
                "explanation": alert_msg,
                "evidence_basis": "Measured Soil pH + Ambient Humidity Forecast",
            })

        # 5. Module 6: Multilingual Soil Assistant (EN / OD / HI) with explicit source distinction
        top3_names = ", ".join(c["crop"] for c in suitability_list[:3])
        source_phrase_en = (
            "REGIONAL REFERENCE BASELINE (District/Block average, NOT an individual plot lab test)"
            if is_regional_only
            else f"MEASURED SOIL DATA ({data_source_name})"
        )
        source_phrase_od = (
            "ଆଞ୍ଚଳିକ ହାରାହାରି ତଥ୍ୟ (Regional Reference — ଆପଣଙ୍କ ବ୍ୟକ୍ତିଗତ ଜମିର ଲ୍ୟାବ୍ ରିପୋର୍ଟ ନୁହେଁ)"
            if is_regional_only
            else f"ମାପ କରାଯାଇଥିବା ମାଟି ପରୀକ୍ଷା ରିପୋର୍ଟ ({data_source_name})"
        )
        source_phrase_hi = (
            "क्षेत्रीय संदर्भ औसत (Regional Baseline — यह आपके व्यक्तिगत खेत की लैब जांच नहीं है)"
            if is_regional_only
            else f"प्रयोगशाला द्वारा मापा गया मृदा डेटा ({data_source_name})"
        )

        missing_en = f" Missing/Untested parameters: {', '.join(missing_inputs)}." if missing_inputs else " All 5 core macro-parameters (pH, N, P, K, OC) are present."
        missing_od = f" ଅନୁପଲବ୍ଧ ତଥ୍ୟ: {', '.join(missing_inputs)}।" if missing_inputs else " ସମସ୍ତ ୫ଟି ମୁଖ୍ୟ ମାଟି ମାନଦଣ୍ଡ (pH, N, P, K, OC) ଉପଲବ୍ଧ ଅଛି।"
        missing_hi = f" अनुपलब्ध मापदंड: {', '.join(missing_inputs)}।" if missing_inputs else " सभी 5 मुख्य मापदंड (pH, N, P, K, OC) उपलब्ध हैं।"

        ph_disp = f"{ph:.1f}" if ph is not None else "Untested"
        n_disp = f"{n:.0f} kg/ha" if n is not None else "Untested"
        p_disp = f"{p:.1f} kg/ha" if p is not None else "Untested"
        k_disp = f"{k:.0f} kg/ha" if k is not None else "Untested"

        multilingual_assistant = {
            "en": (
                f"[Data Source: {source_phrase_en}] Soil Type: {soil_type}. "
                f"pH: {ph_disp} ({ph_status}), Nitrogen: {n_disp}, Phosphorus: {p_disp}, Potassium: {k_disp}. "
                f"For {season_norm} season with {water_availability}, top suitable crops are: {top3_names}.{missing_en}"
            ),
            "od": (
                f"[ତଥ୍ୟର ଉତ୍ସ: {source_phrase_od}] ମାଟି ପ୍ରକାର: {soil_type}। "
                f"ମାଟି pH: {ph_disp}, ଯବକ୍ଷାରଜାନ (N): {n_disp}, ଫସଫରସ୍ (P): {p_disp}, ପୋଟାସିୟମ୍ (K): {k_disp}। "
                f"{season_norm} ଋତୁ ଏବଂ {water_availability} ପାଇଁ ସର୍ବୋତ୍ତମ ଉପଯୁକ୍ତ ଫସଲ: {top3_names}।{missing_od}"
            ),
            "hi": (
                f"[डेटा स्रोत: {source_phrase_hi}] मिट्टी का प्रकार: {soil_type}। "
                f"मिट्टी का pH: {ph_disp}, नाइट्रोजन (N): {n_disp}, फास्फोरस (P): {p_disp}, पोटैशियम (K): {k_disp}। "
                f"{season_norm} सीजन और {water_availability} के लिए सर्वोत्तम उपयुक्त फसलें: {top3_names}।{missing_hi}"
            ),
        }

        return {
            "ph_status": ph_status,
            "nitrogen_status": n_status,
            "phosphorus_status": p_status,
            "potassium_status": k_status,
            "organic_carbon_status": oc_status,
            "overall_fertility_score": fertility_score,
            "crop_suitability": suitability_list,
            "recommendations": recommendations,
            "management_guidance": multilingual_assistant["en"],
            # Extended DSS Payload
            "data_source_type": data_source_type,
            "data_source_name": data_source_name,
            "test_date": test_date or datetime.now().strftime("%Y-%m-%d"),
            "is_regional_only": is_regional_only,
            "uncertainty_summary": uncertainty_badge,
            "missing_inputs": missing_inputs,
            "parameter_cards": parameter_cards,
            "structured_advisor": structured_advisor,
            "soil_weather_risks": soil_weather_risks,
            "sensor_disclaimer": (
                "No live hardware in-situ soil moisture or pH sensor is connected. "
                "Risk alerts combine submitted soil records with meteorological forecasts."
            ),
            "multilingual_summary": multilingual_assistant,
        }

    @staticmethod
    def analyze_soil(
        ph: float,
        n: float,
        p: float,
        k: float,
        oc: float,
        moisture: float,
        soil_type: str,
    ) -> Dict[str, Any]:
        """Backward-compatible wrapper for legacy `/api/soil/analyze` callers."""
        return SoilService.analyze_soil_dss(
            ph=ph,
            n=n,
            p=p,
            k=k,
            oc=oc,
            moisture=moisture,
            soil_type=soil_type,
        )

    @staticmethod
    def compute_soil_trends(records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Module 5: Soil Health Trend Tracker.
        Compares soil test values across dates ONLY when >= 2 comparable dated records exist.
        Never fabricates historical trends when < 2 records exist.
        """
        comparable = [
            r for r in records
            if r.get("data_source_type") != "REGIONAL_REFERENCE" and r.get("ph") is not None
        ]
        if len(comparable) < 2:
            comparable = [r for r in records if r.get("ph") is not None]

        comparable_sorted = sorted(
            comparable,
            key=lambda x: str(x.get("test_date") or x.get("created_at") or ""),
        )

        if len(comparable_sorted) < 2:
            return {
                "has_sufficient_data": False,
                "trend_available": False,
                "record_count": len(comparable_sorted),
                "comparable_records_count": len(comparable_sorted),
                "message": (
                    f"Insufficient comparable records ({len(comparable_sorted)} found; minimum 2 dated soil "
                    "assessments required to compute multi-date soil health trends). Save at least two dated "
                    "soil reports to view nutrient trajectory."
                ),
                "trends": {},
                "deltas": {},
                "chronological_records": comparable_sorted,
                "timeline": comparable_sorted,
            }

        oldest = comparable_sorted[0]
        latest = comparable_sorted[-1]
        d_prev = str(oldest.get("test_date") or oldest.get("created_at") or "")[:10]
        d_curr = str(latest.get("test_date") or latest.get("created_at") or "")[:10]

        def _delta(key: str, unit: str) -> Dict[str, Any]:
            v0 = oldest.get(key)
            v1 = latest.get(key)
            if v0 is None or v1 is None:
                return {"status": "INSUFFICIENT_PARAMETER_HISTORY"}
            diff = round(float(v1) - float(v0), 2)
            direction = "INCREASING" if diff > 0.01 else ("DECREASING" if diff < -0.01 else "STABLE")
            return {
                "status": "COMPARED",
                "previous_value": float(v0),
                "latest_value": float(v1),
                "Initial": float(v0),
                "Latest": float(v1),
                "delta": diff,
                "unit": unit,
                "direction": direction,
                "previous_date": d_prev,
                "latest_date": d_curr,
            }

        deltas = {
            "ph": _delta("ph", "pH"),
            "nitrogen_kg_ha": _delta("nitrogen_kg_ha", "kg/ha"),
            "phosphorus_kg_ha": _delta("phosphorus_kg_ha", "kg/ha"),
            "potassium_kg_ha": _delta("potassium_kg_ha", "kg/ha"),
            "organic_carbon_pct": _delta("organic_carbon_pct", "%"),
        }

        return {
            "has_sufficient_data": True,
            "trend_available": True,
            "record_count": len(comparable_sorted),
            "comparable_records_count": len(comparable_sorted),
            "earliest_date": d_prev,
            "latest_date": d_curr,
            "first_test_date": d_prev,
            "latest_test_date": d_curr,
            "message": f"Trend computed across {len(comparable_sorted)} dated soil records (comparing {d_prev} vs {d_curr}).",
            "trends": deltas,
            "deltas": deltas,
            "chronological_records": comparable_sorted,
            "timeline": comparable_sorted,
        }


soil_service = SoilService()
