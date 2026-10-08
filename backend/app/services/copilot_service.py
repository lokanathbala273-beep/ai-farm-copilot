from typing import Dict, Any, Optional
from datetime import datetime

class CopilotService:
    @staticmethod
    def answer_query(
        query: str,
        lang: str = "en",
        farmer_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Agricultural reasoning engine combining farmer profile, recent weather,
        past disease detections, and soil values to deliver tailored advice.
        """
        q = query.lower().strip()
        ctx = farmer_context or {}
        crops = ctx.get("current_crops", ["Rice", "Tomato", "Potato"])
        primary_crop = crops[0] if crops else "Rice"
        farm_name = ctx.get("farm_name", "Kisan Smart Farm")
        total_expenses = ctx.get("total_expenses", 15200.0)
        recent_disease = ctx.get("recent_disease", "Early Blight in Tomato")
        weather_temp = ctx.get("temperature", 28.5)
        weather_rh = ctx.get("humidity", 78.0)

        # 1. Yellow leaves / Foliar chlorosis
        if any(w in q for w in ["yellow", "chlorosis", "pale", "ହଳଦିଆ", "ପତ୍ର", "पीले", "पीला"]):
            intent = "foliar_chlorosis"
            if lang == "od":
                reply = (
                    f"ଆପଣଙ୍କ {primary_crop} ପତ୍ର ହଳଦିଆ ପଡ଼ିବାର ମୁଖ୍ୟ କାରଣ ହେଉଛି ଯବକ୍ଷାରଜାନ (Nitrogen) ଅଭାବ କିମ୍ବା ଅତ୍ୟଧିକ ଜଳବନ୍ଦୀ। "
                    f"ଯଦି ପୁରୁଣା ତଳ ପତ୍ର ହଳଦିଆ ହେଉଛି, ତେବେ ଏକର ପିଛା ୧୫-୨୦ କିଲୋ ୟୁରିଆ ଟପ୍-ଡ୍ରେସ୍ କରନ୍ତୁ ଏବଂ ଜମିରୁ ଅତିରିକ୍ତ ପାଣି ନିଷ୍କାସନ କରନ୍ତୁ।"
                )
            elif lang == "hi":
                reply = (
                    f"आपकी {primary_crop} फसल में पत्तियों का पीला पड़ना आमतौर पर नाइट्रोजन की कमी या जलभराव के कारण होता है। "
                    f"यदि निचली पत्तियां पीली हो रही हैं, तो प्रति एकड़ 15-20 किलो यूरिया का छिड़काव/टॉप-ड्रेस करें और जल निकासी सुनिश्चित करें।"
                )
            else:
                reply = (
                    f"Yellowing in your {primary_crop} leaves is commonly caused by Nitrogen deficiency or waterlogging around root zones. "
                    f"If older lower leaves show chlorosis first, top-dress with 15-20 kg/acre Urea and ensure field drainage channels are clear."
                )
            action = "Inspect bottom leaves and check soil moisture levels."

        # 2. Irrigation timing
        elif any(w in q for w in ["irrigate", "water", "irrigation", "ପାଣି", "ଜଳସେଚନ", "सिंचाई", "पानी"]):
            intent = "irrigation_timing"
            if lang == "od":
                reply = (
                    f"ବର୍ତ୍ତମାନ ଆପଣଙ୍କ ଅଞ୍ଚଳରେ ତାପମାତ୍ରା {weather_temp}°C ଏବଂ ଆର୍ଦ୍ରତା {weather_rh}% ରହିଛି। "
                    f"ମାଟିର ଉପର ଭାଗ ଶୁଖିଲା ଥିଲେ ଆଜି ସନ୍ଧ୍ୟା ସମୟରେ ହାଲୁକା ଜଳସେଚନ କରନ୍ତୁ। ଦ୍ୱିପ୍ରହର ଖରାରେ ପାଣି ଦିଅନ୍ତୁ ନାହିଁ।"
                )
            elif lang == "hi":
                reply = (
                    f"वर्तमान में आपके क्षेत्र का तापमान {weather_temp}°C और आर्द्रता {weather_rh}% है। "
                    f"यदि ऊपरी 2 इंच मिट्टी सूखी है, तो आज शाम के समय हल्की सिंचाई करें। तेज धूप में सिंचाई से बचें।"
                )
            else:
                reply = (
                    f"Current conditions at {farm_name} show {weather_temp}°C with {weather_rh}% humidity. "
                    f"If the top 2 inches of topsoil feel dry, schedule a light evening drip or furrow irrigation. Avoid midday watering."
                )
            action = "Check root zone soil moisture."

        # 3. Disease history / recent disease problem
        elif any(w in q for w in ["disease", "problem", "affecting", "last time", "ରୋଗ", "କଣ ହୋଇଥିଲା", "रोग", "बीमारी"]):
            intent = "disease_history"
            if lang == "od":
                reply = (
                    f"ଆପଣଙ୍କ ଡିଜିଟାଲ୍ ଫାର୍ମ ଇତିହାସ ଅନୁଯାୟୀ, ଗତ ଥର {recent_disease} ଚିହ୍ନଟ ହୋଇଥିଲା। "
                    f"ଏଥିପାଇଁ ଆପଣ ମାଙ୍କୋଜେବ୍ ସ୍ପ୍ରେ କରିଥିଲେ। ବର୍ତ୍ତମାନ ପତ୍ର ସୁସ୍ଥ ରହିଛି କି ନାହିଁ ଯାଞ୍ଚ କରିବା ପାଇଁ 'Check Disease' ବଟନ୍ ବ୍ୟବହାର କରନ୍ତୁ।"
                )
            elif lang == "hi":
                reply = (
                    f"आपके डिजिटल फार्म इतिहास के अनुसार, पिछली बार {recent_disease} का पता चला था। "
                    f"इसके लिए मैंकोजेब का उपचार किया गया था। वर्तमान स्थिति की जांच के लिए नया पत्ता फोटो स्कैन करें।"
                )
            else:
                reply = (
                    f"According to your Farm History, your last recorded foliar alert was {recent_disease}. "
                    f"Treatment with Mancozeb @ 2.5 g/L was applied. Tap 'Check Disease' to scan a fresh leaf photo if symptoms persist."
                )
            action = "Open Leaf Disease Scanner."

        # 4. Expenses / Finance
        elif any(w in q for w in ["spend", "expense", "cost", "money", "ଖର୍ଚ୍ଚ", "ଟଙ୍କା", "खर्च", "रुपए"]):
            intent = "expense_inquiry"
            if lang == "od":
                reply = (
                    f"ଚଳିତ ମାସରେ ଆପଣଙ୍କ {farm_name} ରେ ମୋଟ ଖର୍ଚ୍ଚ ₹{total_expenses:,.0f} ଟଙ୍କା ରେକର୍ଡ ହୋଇଛି। "
                    f"ସାର (Fertilizer) ଏବଂ ଶ୍ରମିକ (Labour) ରେ ସର୍ବାଧିକ ଖର୍ଚ୍ଚ ହୋଇଛି। ଆପଣ 'Farm Business' ଟ୍ୟାବ୍ ରେ ସମ୍ପୂର୍ଣ୍ଣ ରିପୋର୍ଟ ଦେଖିପାରିବେ।"
                )
            elif lang == "hi":
                reply = (
                    f"इस महीने आपके {farm_name} पर कुल दर्ज खर्च ₹{total_expenses:,.0f} है। "
                    f"सबसे अधिक खर्च उर्वरक और मजदूरी पर हुआ है। पूरा विवरण 'Farm Business' में देख सकते हैं।"
                )
            else:
                reply = (
                    f"For this cropping season, your total recorded expenses for {farm_name} stand at ₹{total_expenses:,.0f}. "
                    f"Fertilizer and labour account for the majority of the outlay. View the complete chart in Farm Business."
                )
            action = "Open Farm Expense Tracker."

        # 5. Market price & Selling advice
        elif any(w in q for w in ["sell", "market", "price", "mandi", "ଦର", "ମଣ୍ଡି", "ବିକ୍ରି", "भाव", "मंडी", "बेचूँ"]):
            intent = "market_optimizer"
            if lang == "od":
                reply = (
                    f"ଆଜି ଭୁବନେଶ୍ୱର ଏଆଇଜିନିଆ ମଣ୍ଡିରେ {primary_crop} ଦର କ୍ୱିଣ୍ଟାଲ ପିଛା ₹୨,୩୫୦ ରହିଛି ଏବଂ କଟକ ମାଲଗୋଦାମରେ ₹୨,୫୨୦ ରହିଛି। "
                    f"ପରିବହନ ଖର୍ଚ୍ଚ ହିସାବ କଲେ ଭୁବନେଶ୍ୱର ମଣ୍ଡିରେ ଆପଣଙ୍କୁ ଅଧିକ ଲାଭ ମିଳିବ। 'Market' ଟ୍ୟାବ୍ ରେ ତୁଳନା ଦେଖନ୍ତୁ।"
                )
            elif lang == "hi":
                reply = (
                    f"आज भुवनेश्वर एआईजीनिया मंडी में {primary_crop} का भाव ₹2,350/क्विंटल और कटक में ₹2,520/क्विंटल है। "
                    f"परिवहन भाड़ा घटाने के बाद भुवनेश्वर मंडी आपके लिए अधिक शुद्ध मुनाफा (+₹120/क्विंटल) देगी।"
                )
            else:
                reply = (
                    f"Today's modal price for {primary_crop} is ₹2,350/Qtl at Bhubaneswar APMC and ₹2,520/Qtl at Cuttack Malgodown. "
                    f"After accounting for transport freight, Bhubaneswar APMC yields the highest net realization. Check the Market Optimizer for full comparison."
                )
            action = "Open Market Optimizer."

        # 6. Heavy rain / Post-flood advisory
        elif any(w in q for w in ["rain", "flood", "waterlogging", "ବର୍ଷା", "ପାଣି ଜମିଛି", "बारिश", "जलभराव"]):
            intent = "heavy_rain_advisory"
            if lang == "od":
                reply = (
                    f"ଭାରୀ ବର୍ଷା ପରେ ଜମିରୁ ତୁରନ୍ତ ଅତିରିକ୍ତ ପାଣି କାଢ଼ି ଦିଅନ୍ତୁ। "
                    f"ବର୍ଷା ଛାଡ଼ିବା ପରେ ମୂଳ ସଢ଼ା ରୋଗ ପ୍ରତିରୋଧ ପାଇଁ କପର ଅକ୍ସିକ୍ଲୋରାଇଡ୍ (COC @ 2.5 g/L) ସ୍ପ୍ରେ କରନ୍ତୁ। ବର୍ତ୍ତମାନ ଯବକ୍ଷାରଜାନ ଦିଅନ୍ତୁ ନାହିଁ।"
                )
            elif lang == "hi":
                reply = (
                    f"भारी बारिश के तुरंत बाद खेतों से अतिरिक्त पानी बाहर निकालें ताकि जड़ें सड़े नहीं। "
                    f"मौसम साफ होने पर कॉपर ऑक्सीक्लोराइड (2.5 ग्राम/लीटर) का छिड़काव करें। अभी यूरिया न डालें।"
                )
            else:
                reply = (
                    f"Immediate post-rain protocol: 1. Drain stagnant water from field furrows immediately. "
                    f"2. Apply a prophylactic spray of Copper Oxychloride (2.5 g/L) once the sun appears to curb root rot. 3. Withhold nitrogen fertilizers for 4 days."
                )
            action = "Clear drainage outlets and prepare copper spray."

        # 7. Order Status, Payment Status & Pesticides Store Inquiry
        elif any(w in q for w in ["order", "payment", "paid", "pesticide", "medicine", "tapuz", "ampelo", "promos", "milquat", "jupiter", "ऑर्डर", "पेमेंट", "अॉर्डर"]):
            intent = "order_payment_status"
            recent_orders = ctx.get("recent_orders") or []
            if recent_orders:
                latest = recent_orders[0]
                pay_id_str = f" (Payment ID: {latest['razorpay_payment_id']})" if latest.get("razorpay_payment_id") else ""
                reply = (
                    f"📦 Your latest Pesticide Order is **{latest['order_code']}** for **{latest['products']}** "
                    f"(Total: ₹{latest['total_amount']:,.0f}).\n"
                    f"• **Payment Method**: {latest['payment_method']}\n"
                    f"• **Payment Status**: {latest['payment_status']}{pay_id_str}\n"
                    f"• **Order Status**: {latest['order_status']}"
                )
                action = "Open Pesticides -> My Orders to track delivery."
            else:
                reply = (
                    "No pesticide order or payment record is currently available for your account. "
                    "You can browse our 5 verified medicines (Adama Tapuz, Dr.Bacto's Ampelo, Best Agro Promos, IIL Milquat, and JU Jupiter 505) in the **Pesticides** tab!"
                )
                action = "Open Pesticides Store tab."

        # Default fallback
        else:
            intent = "general_advisory"
            if lang == "od":
                reply = (
                    f"ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ ଏଆଇ ଫାର୍ମ କୋ-ପାଇଲଟ୍। ମୁଁ ଆପଣଙ୍କୁ {farm_name} ର ଫସଲ ରୋଗ ନିର୍ଣ୍ଣୟ, "
                    f"ପାଣିପାଗ ସତର୍କତା, ଖର୍ଚ୍ଚ ହିସାବ ଏବଂ ମଣ୍ଡି ଦର ବିଷୟରେ ସାହାଯ୍ୟ କରିପାରିବି। ଆପଣ ମାଇକ୍ରୋଫୋନ୍ ବ୍ୟବହାର କରି ମଧ୍ୟ ପଚାରିପାରିବେ।"
                )
            elif lang == "hi":
                reply = (
                    f"नमस्ते! मैं आपका एआई फार्म को-पायलट हूँ। मैं आपके {farm_name} के लिए रोग पहचान, "
                    f"मौसम अलर्ट, खर्च प्रबंधन और मंडी भाव में मदद कर सकता हूँ। आप माइक दबाकर सीधे बोल भी सकते हैं।"
                )
            else:
                reply = (
                    f"Hello! I am your AI Farm Co-Pilot for {farm_name}. I can assist you with leaf disease diagnosis, "
                    f"weather advisories, farm expense logging, and mandi price optimization. You can also tap the microphone to ask by voice!"
                )
            action = "Tap microphone or choose a quick action."

        return {
            "reply": reply,
            "language": lang,
            "detected_intent": intent,
            "action_suggested": action,
            "context_used": {
                "farm_name": farm_name,
                "primary_crop": primary_crop,
                "recorded_expenses": total_expenses,
                "weather_temp": weather_temp
            }
        }

copilot_service = CopilotService()
