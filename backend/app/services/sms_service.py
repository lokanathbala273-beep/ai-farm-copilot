import logging
from typing import Dict, Any
import httpx
from backend.app.config import settings

logger = logging.getLogger(__name__)

class SMSService:
    """
    Agricultural Production SMS Gateway Service.
    Supports real-time cellular SMS dispatch via:
    1. Fast2SMS (Instant Indian National SMS Gateway for OTPs)
    2. Twilio (Worldwide SMS Gateway)
    3. MSG91 (Indian Enterprise Gateway)
    4. Resilient Local / On-Screen Dispatch Simulator (Fallback when keys are not configured)
    """

    @staticmethod
    def send_otp(phone: str, otp_code: str, role_label: str = "Farmer") -> Dict[str, Any]:
        """
        Dispatches a 6-digit OTP verification SMS to the specified phone number.
        """
        clean_phone = phone.replace("+91", "").replace("-", "").strip()[-10:]
        sms_body = f"Your Kishan Smart Farm verification code is: {otp_code}. Valid for 5 minutes. Do not share this code."
        
        # 1. Check Fast2SMS (Direct Indian OTP Route)
        if settings.FAST2SMS_API_KEY:
            try:
                headers = {
                    "authorization": settings.FAST2SMS_API_KEY,
                    "Content-Type": "application/json"
                }
                payload = {
                    "variables_values": otp_code,
                    "route": "otp",
                    "numbers": clean_phone
                }
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post("https://www.fast2sms.com/dev/bulkV2", json=payload, headers=headers)
                    data = resp.json()
                    if resp.status_code == 200 and data.get("return") is True:
                        logger.info(f"✅ [Fast2SMS] Successfully dispatched real SMS OTP to +91-{clean_phone}")
                        return {
                            "success": True,
                            "real_sms_sent": True,
                            "gateway": "Fast2SMS India",
                            "phone": f"+91-{clean_phone}",
                            "otp_code": otp_code,
                            "message": f"Real SMS sent to +91-{clean_phone} via Fast2SMS gateway."
                        }
                    else:
                        logger.warning(f"⚠️ [Fast2SMS] Gateway response: {data}")
            except Exception as e:
                logger.error(f"❌ [Fast2SMS Error] Failed to connect to Fast2SMS: {e}")

        # 2. Check Twilio (International / Global SMS)
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN and settings.TWILIO_PHONE_NUMBER:
            try:
                url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
                data = {
                    "To": f"+91{clean_phone}",
                    "From": settings.TWILIO_PHONE_NUMBER,
                    "Body": sms_body
                }
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(url, data=data, auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN))
                    if resp.status_code in [200, 201]:
                        logger.info(f"✅ [Twilio] Successfully dispatched real SMS OTP to +91-{clean_phone}")
                        return {
                            "success": True,
                            "real_sms_sent": True,
                            "gateway": "Twilio Telecom",
                            "phone": f"+91-{clean_phone}",
                            "otp_code": otp_code,
                            "message": f"Real SMS sent to +91-{clean_phone} via Twilio."
                        }
            except Exception as e:
                logger.error(f"❌ [Twilio Error] Failed to send SMS via Twilio: {e}")

        # 3. Check MSG91
        if settings.MSG91_AUTH_KEY:
            try:
                url = "https://control.msg91.com/api/v5/otp"
                params = {
                    "template_id": "default",
                    "mobile": f"91{clean_phone}",
                    "authkey": settings.MSG91_AUTH_KEY,
                    "otp": otp_code
                }
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(url, params=params)
                    if resp.status_code == 200:
                        logger.info(f"✅ [MSG91] Successfully dispatched real SMS OTP to +91-{clean_phone}")
                        return {
                            "success": True,
                            "real_sms_sent": True,
                            "gateway": "MSG91 Gateway",
                            "phone": f"+91-{clean_phone}",
                            "otp_code": otp_code,
                            "message": f"Real SMS sent to +91-{clean_phone} via MSG91."
                        }
            except Exception as e:
                logger.error(f"❌ [MSG91 Error] Failed to send SMS via MSG91: {e}")

        # 4. Resilient Fallback: Immediate On-Screen & Console Delivery
        print(f"📱 [SMS GATEWAY DISPATCH] +91-{clean_phone} <- Code: {otp_code} | Message: \"{sms_body}\"")
        return {
            "success": True,
            "real_sms_sent": False,
            "gateway": "Local Cellular Simulator & Screen Notification",
            "phone": f"+91-{clean_phone}",
            "otp_code": otp_code,
            "message": f"SMS Notification dispatched to +91-{clean_phone}. Code: {otp_code}"
        }

sms_service = SMSService()
