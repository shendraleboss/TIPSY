import os
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from twilio.rest import Client

from config.db import db
from models.server import SendOTPRequest, VerifyOTPRequest
from config.security import create_access_token

from fastapi import Request
from config.security import limiter

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)

# Twilio setup
twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
twilio_auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
twilio_verify_service = os.environ.get('TWILIO_VERIFY_SERVICE')
twilio_client = Client(twilio_account_sid, twilio_auth_token) if twilio_account_sid and twilio_auth_token else None

# Development mode
dev_mode = os.environ.get('DEV_MODE', 'false').lower() == 'true'
dev_otp_code = os.environ.get('DEV_OTP_CODE', '123456')

@router.post("/send-otp")
@limiter.limit("3/minute")
async def send_otp(request: Request, payload: SendOTPRequest):
    if dev_mode:
        logger.info(f"[DEV MODE] OTP for {payload.phone}: {dev_otp_code}")
        return {
            "success": True,
            "message": f"Code envoyé avec succès.",
            "status": "dev_mode"
        }
    
    try:
        verification = twilio_client.verify.services(twilio_verify_service).verifications.create(
            to=payload.phone,
            channel="sms"
        )
        logger.info(f"OTP sent to {payload.phone}, status: {verification.status}")
        return {
            "success": True,
            "message": f"OTP sent to {payload.phone}",
            "status": verification.status
        }
    except Exception as e:
        logger.error(f"Error sending OTP: {e}")
        raise HTTPException(status_code=500, detail="Une erreur interne est survenue lors de l'envoi du SMS.")

@router.post("/verify-otp")
@limiter.limit("3/minute")
async def verify_otp(request: Request, payload: VerifyOTPRequest):
    if dev_mode:
        if payload.otp != dev_otp_code:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        logger.info(f"[DEV MODE] OTP verified for {payload.phone}")
    else:
        try:
            check = twilio_client.verify.services(twilio_verify_service).verification_checks.create(
                to=payload.phone,
                code=payload.otp
            )
            is_valid = check.status == "approved"
            if not is_valid:
                raise HTTPException(status_code=400, detail="Invalid OTP")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error verifying OTP: {e}")
            raise HTTPException(status_code=500, detail="Le service de vérification est temporairement indisponible.")
    
    server_doc = await db.servers.find_one({"phone": payload.phone}, {"_id": 0})
    
    access_token = create_access_token(data={"sub": payload.phone}) #Création en cachant le numéro de téléphone
    
    if server_doc:
        await db.phone_verifications.update_one(
            {"phone_number": payload.phone, "verified": False},
            {"$set": {"verified": True, "verified_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        return {
            "success": True, 
            "is_new_user": False, 
            "server": server_doc,
            "access_token": access_token # <- On le renvoie au client
        }
          
    return {"success": True, 
        "is_new_user": True, 
        "phone": payload.phone,
        "access_token": access_token}