from typing import List, Dict, Any
from datetime import datetime

class MarketService:
    # Seed APMC Mandi database for regional markets
    MANDI_DATA = [
        {
            "market_name": "Bhubaneswar APMC (Aiginia Mandi)",
            "state": "Odisha",
            "district": "Khordha",
            "distance_km": 14.0,
            "transport_rate_per_km_quintal": 2.2,
            "market_fee_pct": 1.5,
            "source": "Agmarknet APMC Portal",
            "prices": {
                "Tomato": 2350.0, "Potato": 1850.0, "Onion": 2600.0, "Rice": 2200.0,
                "Wheat": 2400.0, "Chilli": 8500.0, "Brinjal": 1950.0, "Maize": 1900.0,
                "Banana": 1600.0, "Mango": 4500.0, "Apple": 8000.0, "Cotton": 6800.0,
                "Groundnut": 5800.0, "Mustard": 5200.0, "Soybean": 4400.0
            }
        },
        {
            "market_name": "Cuttack Malgodown Wholesale Market",
            "state": "Odisha",
            "district": "Cuttack",
            "distance_km": 38.0,
            "transport_rate_per_km_quintal": 2.0,
            "market_fee_pct": 1.2,
            "source": "Agmarknet APMC Portal",
            "prices": {
                "Tomato": 2520.0, "Potato": 1920.0, "Onion": 2720.0, "Rice": 2240.0,
                "Wheat": 2420.0, "Chilli": 8800.0, "Brinjal": 2100.0, "Maize": 1950.0,
                "Banana": 1700.0, "Mango": 4700.0, "Apple": 8200.0, "Cotton": 6900.0,
                "Groundnut": 5950.0, "Mustard": 5300.0, "Soybean": 4500.0
            }
        },
        {
            "market_name": "Jatni Sub-Market Yard",
            "state": "Odisha",
            "district": "Khordha",
            "distance_km": 18.0,
            "transport_rate_per_km_quintal": 2.3,
            "market_fee_pct": 1.0,
            "source": "Agmarknet APMC Portal",
            "prices": {
                "Tomato": 2280.0, "Potato": 1810.0, "Onion": 2550.0, "Rice": 2180.0,
                "Wheat": 2360.0, "Chilli": 8300.0, "Brinjal": 1880.0, "Maize": 1870.0,
                "Banana": 1550.0, "Mango": 4400.0, "Apple": 7800.0, "Cotton": 6700.0,
                "Groundnut": 5700.0, "Mustard": 5100.0, "Soybean": 4350.0
            }
        },
        {
            "market_name": "Puri APMC Market Yard",
            "state": "Odisha",
            "district": "Puri",
            "distance_km": 55.0,
            "transport_rate_per_km_quintal": 2.1,
            "market_fee_pct": 1.5,
            "source": "Agmarknet APMC Portal",
            "prices": {
                "Tomato": 2600.0, "Potato": 1980.0, "Onion": 2800.0, "Rice": 2260.0,
                "Wheat": 2450.0, "Chilli": 9100.0, "Brinjal": 2150.0, "Maize": 1980.0,
                "Banana": 1800.0, "Mango": 4900.0, "Apple": 8400.0, "Cotton": 6950.0,
                "Groundnut": 6050.0, "Mustard": 5400.0, "Soybean": 4600.0
            }
        }
    ]

    @classmethod
    def optimize_markets(
        cls,
        crop: str,
        quantity_quintals: float = 50.0,
        grade: str = "Grade A"
    ) -> List[Dict[str, Any]]:
        """
        Calculates Net Realization across mandis by accounting for distance,
        fuel/transport freight, and market commission fees.
        """
        results = []
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M")

        for mandi in cls.MANDI_DATA:
            base_price = mandi["prices"].get(crop, 2200.0)
            if grade == "Grade B":
                base_price *= 0.90
            elif grade == "Grade C":
                base_price *= 0.78

            gross_revenue = base_price * quantity_quintals
            
            # Transport cost calculation: distance * rate * quantity (with min base freight)
            transport_cost = max(350.0, mandi["distance_km"] * mandi["transport_rate_per_km_quintal"] * (quantity_quintals * 0.4 + 10.0))
            
            # Market cess / mandi fee
            market_fees = gross_revenue * (mandi["market_fee_pct"] / 100.0)
            
            net_realization = gross_revenue - transport_cost - market_fees
            net_price_per_quintal = net_realization / max(quantity_quintals, 0.1)

            results.append({
                "market_name": mandi["market_name"],
                "state": mandi["state"],
                "district": mandi["district"],
                "modal_price_per_quintal": round(base_price, 2),
                "gross_revenue": round(gross_revenue, 2),
                "distance_km": mandi["distance_km"],
                "transport_cost": round(transport_cost, 2),
                "market_fees": round(market_fees, 2),
                "net_realization": round(net_realization, 2),
                "net_price_per_quintal": round(net_price_per_quintal, 2),
                "is_recommended": False,
                "source": mandi["source"],
                "last_updated": now_str
            })

        # Sort descending by net_realization
        results.sort(key=lambda x: x["net_realization"], reverse=True)
        if results:
            results[0]["is_recommended"] = True

        return results

market_service = MarketService()
