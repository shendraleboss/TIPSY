from fastapi import FastAPI, APIRouter, HTTPException, Request, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from twilio.rest import Client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe setup
stripe_api_key = os.environ.get('STRIPE_API_KEY')

# Twilio setup
twilio_account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
twilio_auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
twilio_verify_service = os.environ.get('TWILIO_VERIFY_SERVICE')
twilio_client = Client(twilio_account_sid, twilio_auth_token) if twilio_account_sid and twilio_auth_token else None

# Development mode
dev_mode = os.environ.get('DEV_MODE', 'false').lower() == 'true'
dev_otp_code = os.environ.get('DEV_OTP_CODE', '123456')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== Models ====================

class Server(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    first_name: str
    photo_url: Optional[str] = None
    stripe_account_id: Optional[str] = None
    stripe_onboarding_complete: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ServerCreate(BaseModel):
    phone: str
    first_name: str
    photo_url: Optional[str] = None

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class Tip(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    server_id: str
    amount: float  # Tip amount the server receives
    total_paid: float  # Total amount customer paid
    tipsy_fee: float  # 1% fee
    stripe_fee: float  # Stripe processing fee
    currency: str = "chf"
    session_id: str
    payment_status: str  # pending, paid, failed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    payment_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    server_id: str
    amount: float
    currency: str
    payment_status: str
    status: str
    metadata: Optional[Dict] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TipCheckoutRequest(BaseModel):
    server_id: str
    amount: float
    host_url: str

# ==================== Routes ====================

@api_router.get("/")
async def root():
    return {"message": "Tipsy API"}

# Auth routes (Twilio Verify or Dev Mode)
@api_router.post("/auth/send-otp")
async def send_otp(request: SendOTPRequest):
    if dev_mode:
        # Development mode - use fixed OTP
        logger.info(f"[DEV MODE] OTP for {request.phone}: {dev_otp_code}")
        return {
            "success": True,
            "message": f"Code envoyé (DEV: {dev_otp_code})",
            "status": "dev_mode"
        }
    
    # Production mode - use Twilio
    try:
        verification = twilio_client.verify.services(twilio_verify_service).verifications.create(
            to=request.phone,
            channel="sms"
        )
        logger.info(f"OTP sent to {request.phone}, status: {verification.status}")
        return {
            "success": True,
            "message": f"OTP sent to {request.phone}",
            "status": verification.status
        }
    except Exception as e:
        logger.error(f"Error sending OTP: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to send OTP: {str(e)}")

@api_router.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    if dev_mode:
        # Development mode - check against fixed OTP
        if request.otp != dev_otp_code:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        logger.info(f"[DEV MODE] OTP verified for {request.phone}")
    else:
        # Production mode - verify with Twilio
        try:
            check = twilio_client.verify.services(twilio_verify_service).verification_checks.create(
                to=request.phone,
                code=request.otp
            )
            
            is_valid = check.status == "approved"
            
            if not is_valid:
                raise HTTPException(status_code=400, detail="Invalid OTP")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error verifying OTP: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to verify OTP: {str(e)}")
    
    # Check if server exists (same for both modes)
    server_doc = await db.servers.find_one({"phone": request.phone}, {"_id": 0})
    
    if server_doc:
        # Update verification record
        await db.phone_verifications.update_one(
            {"phone_number": request.phone, "verified": False},
            {"$set": {"verified": True, "verified_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        
        return {
            "success": True,
            "is_new_user": False,
            "server": server_doc
        }
    
    return {
        "success": True,
        "is_new_user": True,
        "phone": request.phone
    }

# Server routes
@api_router.post("/servers/profile", response_model=Server)
async def create_or_update_server_profile(server_data: ServerCreate):
    # Check if server exists
    existing = await db.servers.find_one({"phone": server_data.phone}, {"_id": 0})
    
    if existing:
        # Update existing
        update_data = server_data.model_dump()
        await db.servers.update_one(
            {"phone": server_data.phone},
            {"$set": update_data}
        )
        updated = await db.servers.find_one({"phone": server_data.phone}, {"_id": 0})
        return Server(**updated)
    else:
        # Create new
        server = Server(**server_data.model_dump())
        await db.servers.insert_one(server.model_dump())
        return server

@api_router.get("/servers/by-phone/{phone}", response_model=Server)
async def get_server_by_phone(phone: str):
    server_doc = await db.servers.find_one({"phone": phone}, {"_id": 0})
    if not server_doc:
        raise HTTPException(status_code=404, detail="Server not found")
    return Server(**server_doc)

@api_router.get("/servers/{server_id}", response_model=Server)
async def get_server(server_id: str):
    server_doc = await db.servers.find_one({"id": server_id}, {"_id": 0})
    if not server_doc:
        raise HTTPException(status_code=404, detail="Server not found")
    return Server(**server_doc)

@api_router.get("/servers/{server_id}/tips", response_model=List[Tip])
async def get_server_tips(server_id: str):
    tips = await db.tips.find(
        {"server_id": server_id, "payment_status": "paid"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [Tip(**tip) for tip in tips]

@api_router.get("/servers/{server_id}/stats")
async def get_server_stats(server_id: str):
    # Get all paid tips
    tips = await db.tips.find(
        {"server_id": server_id, "payment_status": "paid"},
        {"_id": 0}
    ).to_list(1000)
    
    total_tips = sum(tip.get("amount", 0) for tip in tips)
    tip_count = len(tips)
    
    return {
        "total_tips": round(total_tips, 2),
        "tip_count": tip_count,
        "average_tip": round(total_tips / tip_count, 2) if tip_count > 0 else 0
    }

# Stripe Connect routes
@api_router.post("/servers/{server_id}/stripe-connect/onboard")
async def create_stripe_connect_account(server_id: str, request: Request):
    import stripe
    stripe.api_key = stripe_api_key
    
    # Get server
    server_doc = await db.servers.find_one({"id": server_id}, {"_id": 0})
    if not server_doc:
        raise HTTPException(status_code=404, detail="Server not found")
    
    try:
        # Create Stripe Connect Express account if doesn't exist
        if not server_doc.get("stripe_account_id"):
            account = stripe.Account.create(
                type="express",
                country="CH",  # Switzerland
                email=f"{server_doc['phone']}@tipsy.app",  # Placeholder email
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
            )
            
            # Update server with Stripe account ID
            await db.servers.update_one(
                {"id": server_id},
                {"$set": {"stripe_account_id": account.id}}
            )
            stripe_account_id = account.id
        else:
            stripe_account_id = server_doc["stripe_account_id"]
        
        # Create account link for onboarding
        body = await request.json()
        refresh_url = body.get("refresh_url", f"https://tipsy-pay.preview.emergentagent.com/dashboard")
        return_url = body.get("return_url", f"https://tipsy-pay.preview.emergentagent.com/dashboard")
        
        account_link = stripe.AccountLink.create(
            account=stripe_account_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding",
        )
        
        return {
            "url": account_link.url,
            "stripe_account_id": stripe_account_id
        }
    except Exception as e:
        logger.error(f"Error creating Stripe Connect account: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/servers/{server_id}/stripe-connect/status")
async def get_stripe_connect_status(server_id: str):
    import stripe
    stripe.api_key = stripe_api_key
    
    server_doc = await db.servers.find_one({"id": server_id}, {"_id": 0})
    if not server_doc:
        raise HTTPException(status_code=404, detail="Server not found")
    
    stripe_account_id = server_doc.get("stripe_account_id")
    if not stripe_account_id:
        return {
            "connected": False,
            "charges_enabled": False,
            "details_submitted": False
        }
    
    try:
        account = stripe.Account.retrieve(stripe_account_id)
        
        # Update server onboarding status
        is_complete = account.charges_enabled and account.details_submitted
        await db.servers.update_one(
            {"id": server_id},
            {"$set": {"stripe_onboarding_complete": is_complete}}
        )
        
        return {
            "connected": True,
            "charges_enabled": account.charges_enabled,
            "details_submitted": account.details_submitted,
            "payouts_enabled": account.payouts_enabled,
            "requirements": account.requirements.currently_due if hasattr(account.requirements, 'currently_due') else []
        }
    except Exception as e:
        logger.error(f"Error retrieving Stripe account: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@api_router.post("/tips/create-checkout")
async def create_tip_checkout(tip_request: TipCheckoutRequest):
    import stripe
    stripe.api_key = stripe_api_key
    
    # Validate server exists
    server_doc = await db.servers.find_one({"id": tip_request.server_id}, {"_id": 0})
    if not server_doc:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # Calculate fees
    tip_amount = tip_request.amount
    tipsy_fee = round(tip_amount * 0.01, 2)  # 1%
    stripe_fee = round(tip_amount * 0.029 + 0.30, 2)  # Stripe: 2.9% + €0.30
    total_to_charge = round(tip_amount + tipsy_fee + stripe_fee, 2)
    
    # Convert to cents for Stripe
    amount_in_cents = int(total_to_charge * 100)
    tipsy_fee_cents = int(tipsy_fee * 100)
    
    try:
        # Create checkout session with Stripe Connect
        success_url = f"{tip_request.host_url}/tip-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{tip_request.host_url}/t/{tip_request.server_id}"
        
        session_params = {
            "payment_method_types": ["card"],
            "line_items": [{
                "price_data": {
                    "currency": "chf",
                    "product_data": {
                        "name": f"Tip for {server_doc.get('first_name', 'Server')}",
                        "description": "100% goes to the server",
                    },
                    "unit_amount": amount_in_cents,
                },
                "quantity": 1,
            }],
            "mode": "payment",
            "success_url": success_url,
            "cancel_url": cancel_url,
            "metadata": {
                "server_id": tip_request.server_id,
                "tip_amount": str(tip_amount),
                "tipsy_fee": str(tipsy_fee),
                "stripe_fee": str(stripe_fee),
                "type": "tip"
            }
        }
        
        # If server has Stripe Connect account, use it
        stripe_account_id = server_doc.get("stripe_account_id")
        if stripe_account_id and server_doc.get("stripe_onboarding_complete"):
            session_params["payment_intent_data"] = {
                "application_fee_amount": tipsy_fee_cents,
                "transfer_data": {
                    "destination": stripe_account_id,
                },
            }
        
        session = stripe.checkout.Session.create(**session_params)
        
        # Create payment transaction record
        transaction = PaymentTransaction(
            session_id=session.id,
            server_id=tip_request.server_id,
            amount=total_to_charge,
            currency="chf",
            payment_status="pending",
            status="pending",
            metadata={
                "tip_amount": tip_amount,
                "tipsy_fee": tipsy_fee,
                "stripe_fee": stripe_fee,
                "stripe_account_id": stripe_account_id if stripe_account_id else None
            }
        )
        await db.payment_transactions.insert_one(transaction.model_dump())
        
        return {
            "url": session.url,
            "session_id": session.id,
            "breakdown": {
                "tip": tip_amount,
                "tipsy_fee": tipsy_fee,
                "stripe_fee": stripe_fee,
                "total": total_to_charge
            }
        }
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/tips/checkout-status/{session_id}")
async def get_checkout_status(session_id: str):
    # Get transaction from database
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If already processed, return cached status
    if transaction.get("payment_status") == "paid":
        return {
            "status": "complete",
            "payment_status": "paid",
            "session_id": session_id
        }
    
    # Check with Stripe
    webhook_url = "https://placeholder.com/webhook"  # Not used for status check
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction status
        new_status = "paid" if checkout_status.payment_status == "paid" else "pending"
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "payment_status": new_status,
                    "status": checkout_status.status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # If paid and not yet recorded as tip, create tip record
        if new_status == "paid":
            existing_tip = await db.tips.find_one({"session_id": session_id})
            if not existing_tip:
                metadata = transaction.get("metadata", {})
                tip = Tip(
                    server_id=transaction["server_id"],
                    amount=float(metadata.get("tip_amount", 0)),
                    total_paid=transaction["amount"],
                    tipsy_fee=float(metadata.get("tipsy_fee", 0)),
                    stripe_fee=float(metadata.get("stripe_fee", 0)),
                    currency=transaction["currency"],
                    session_id=session_id,
                    payment_status="paid"
                )
                await db.tips.insert_one(tip.model_dump())
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "session_id": session_id
        }
    except Exception as e:
        logger.error(f"Error checking payment status: {e}")
        raise HTTPException(status_code=500, detail="Error checking payment status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    body = await request.body()
    
    webhook_url = "https://placeholder.com/webhook"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        logger.info(f"Webhook received: {webhook_response.event_type}")
        
        # Update transaction based on webhook
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {
                    "$set": {
                        "payment_status": webhook_response.payment_status,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        
        return {"success": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
