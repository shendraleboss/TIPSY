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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe setup
stripe_api_key = os.environ.get('STRIPE_API_KEY')

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
    currency: str = "eur"
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

# Auth routes (mock for now)
@api_router.post("/auth/send-otp")
async def send_otp(request: SendOTPRequest):
    # Mock OTP - in production, use Twilio
    logger.info(f"Mock OTP for {request.phone}: 123456")
    return {"success": True, "message": "OTP sent (mock: 123456)"}

@api_router.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    # Mock verification - accept any OTP for now
    if request.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check if server exists
    server_doc = await db.servers.find_one({"phone": request.phone}, {"_id": 0})
    
    if server_doc:
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

# Tip/Payment routes
@api_router.post("/tips/create-checkout")
async def create_tip_checkout(tip_request: TipCheckoutRequest):
    # Validate server exists
    server_doc = await db.servers.find_one({"id": tip_request.server_id}, {"_id": 0})
    if not server_doc:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # Calculate fees
    tip_amount = tip_request.amount
    tipsy_fee = round(tip_amount * 0.01, 2)  # 1%
    stripe_fee = round(tip_amount * 0.029 + 0.30, 2)  # Stripe: 2.9% + €0.30
    total_to_charge = round(tip_amount + tipsy_fee + stripe_fee, 2)
    
    # Initialize Stripe
    webhook_url = f"{tip_request.host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Create checkout session
    success_url = f"{tip_request.host_url}/tip-success?session_id={{{{CHECKOUT_SESSION_ID}}}}"
    cancel_url = f"{tip_request.host_url}/t/{tip_request.server_id}"
    
    checkout_request = CheckoutSessionRequest(
        amount=total_to_charge,
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "server_id": tip_request.server_id,
            "tip_amount": str(tip_amount),
            "tipsy_fee": str(tipsy_fee),
            "stripe_fee": str(stripe_fee),
            "type": "tip"
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        session_id=session.session_id,
        server_id=tip_request.server_id,
        amount=total_to_charge,
        currency="eur",
        payment_status="pending",
        status="pending",
        metadata={
            "tip_amount": tip_amount,
            "tipsy_fee": tipsy_fee,
            "stripe_fee": stripe_fee
        }
    )
    await db.payment_transactions.insert_one(transaction.model_dump())
    
    return {
        "url": session.url,
        "session_id": session.session_id,
        "breakdown": {
            "tip": tip_amount,
            "tipsy_fee": tipsy_fee,
            "stripe_fee": stripe_fee,
            "total": total_to_charge
        }
    }

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
