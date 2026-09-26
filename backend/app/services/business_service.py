import re
from datetime import datetime
from typing import Dict, Any, Optional

class BusinessService:
    @staticmethod
    def calculate_business_plan(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates realistic farm budget scenarios.
        Estimates total cost, gross revenue, net margin, and cost per acre.
        """
        land_area = float(data.get("land_area_acres", 1.0))
        seed_cost = float(data.get("seed_cost", 0.0))
        fertilizer_cost = float(data.get("fertilizer_cost", 0.0))
        labour_cost = float(data.get("labour_cost", 0.0))
        irrigation_cost = float(data.get("irrigation_cost", 0.0))
        protection_cost = float(data.get("crop_protection_cost", 0.0))
        equipment_cost = float(data.get("equipment_cost", 0.0))
        transport_cost = float(data.get("transport_cost", 0.0))
        other_cost = float(data.get("other_cost", 0.0))

        total_cost = (
            seed_cost + fertilizer_cost + labour_cost + irrigation_cost +
            protection_cost + equipment_cost + transport_cost + other_cost
        )

        yield_quintals = float(data.get("expected_yield_quintals", 0.0))
        price_per_quintal = float(data.get("expected_selling_price_per_quintal", 0.0))
        total_revenue = yield_quintals * price_per_quintal
        net_return = total_revenue - total_cost

        cost_per_acre = total_cost / max(land_area, 0.1)
        roi_percentage = (net_return / max(total_cost, 1.0)) * 100.0

        return {
            "crop": data.get("crop", "Unknown"),
            "land_area_acres": land_area,
            "estimated_total_cost": round(total_cost, 2),
            "estimated_revenue": round(total_revenue, 2),
            "estimated_net_return": round(net_return, 2),
            "cost_per_acre": round(cost_per_acre, 2),
            "roi_percentage": round(roi_percentage, 1),
            "cost_breakdown": {
                "Seed": seed_cost,
                "Fertilizer": fertilizer_cost,
                "Labour": labour_cost,
                "Irrigation": irrigation_cost,
                "Protection": protection_cost,
                "Equipment": equipment_cost,
                "Transport": transport_cost,
                "Other": other_cost
            },
            "disclaimer": "These figures are simulated scenario estimates based on provided inputs and regional averages. Actual farm yields and market realizations may vary."
        }

    @staticmethod
    def parse_voice_expense(transcript: str) -> Dict[str, Any]:
        """
        Extracts amount and category from voice or text transcripts
        in English, Odia, or Hindi.
        Example: 'I spent 1500 on fertilizer' -> {amount: 1500, category: 'Fertilizer'}
        'ଖତ ପାଇଁ ୧୫୦୦ ଟଙ୍କା ଖର୍ଚ୍ଚ କଲି' -> {amount: 1500, category: 'Fertilizer'}
        'खाद पर 1500 रुपये खर्च किए' -> {amount: 1500, category: 'Fertilizer'}
        """
        text = transcript.lower().strip()
        
        # 1. Odia numeral converter
        odia_numerals = {'୦': '0', '୧': '1', '୨': '2', '୩': '3', '୪': '4', '୫': '5', '୬': '6', '୭': '7', '୮': '8', '୯': '9'}
        for od, en in odia_numerals.items():
            text = text.replace(od, en)

        # 2. Extract numeric amount
        numbers = re.findall(r'\d+(?:\.\d+)?', text)
        amount = float(numbers[0]) if numbers else None

        # 3. Detect category based on multilingual keywords
        category = "Other"
        confidence = 0.65

        keywords_map = {
            "Fertilizer": ["fertilizer", "urea", "dap", "potash", "manure", "khata", "khad", "ଖତ", "ସାର", "खाद", "यूरिया"],
            "Seed": ["seed", "seeds", "bihana", "beeja", "bija", "ବିହନ", "ମଞ୍ଜି", "बीज", "दाना"],
            "Labour": ["labour", "labor", "worker", "coolie", "mulia", "majdoor", "ମୂଲିଆ", "ଶ୍ରମିକ", "मजदूर", "मजदूरी"],
            "Irrigation": ["irrigation", "water", "pani", "diesel", "motor", "pump", "ପାଣି", "ଜଳସେଚନ", "सिंचाई", "पानी"],
            "Pesticide": ["pesticide", "fungicide", "spray", "medicine", "oushadha", "dawa", "କୀଟନାଶକ", "ଔଷଧ", "कीटनाशक", "दवा"],
            "Equipment": ["tractor", "harvester", "tiller", "machinery", "rent", "ଟ୍ରାକ୍ଟର", "ଯନ୍ତ୍ରପାତି", "ट्रैक्टर", "किराया"],
            "Transport": ["transport", "auto", "tempo", "truck", "bhada", "ଭଡ଼ା", "ଗାଡ଼ି", "किराया", "ट्रांसपोर्ट", "गाड़ी"],
            "Land Preparation": ["ploughing", "plowing", "land prep", "chasa", "जुताई", "ତଳି", "ଜମି ପ୍ରସ୍ତୁତି"]
        }

        for cat, keywords in keywords_map.items():
            for kw in keywords:
                if kw in text:
                    category = cat
                    confidence = 0.92
                    break
            if category != "Other":
                break

        return {
            "amount": amount,
            "category": category,
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
            "confidence": confidence if amount is not None else 0.4,
            "raw_text": transcript
        }

business_service = BusinessService()
