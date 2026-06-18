import os
import stripe
import logging
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, Header

from config.db import db
from models.tip import Tip, PaymentTransaction, TipCheckoutRequest

router = APIRouter(prefix="/tips", tags=["Tips"])
logger = logging.getLogger(__name__)

stripe.api_key = os.environ.get('STRIPE_API_KEY')

@router.post("/create-checkout")
async def create_tip_checkout(tip_request: TipCheckoutRequest):
    # DEV MODE EXCEPTION FOR TESTING
    dev_mode = os.environ.get('DEV_MODE', 'false').lower() == 'true'
    if dev_mode and "sk_test" not in str(stripe.api_key):
        return {
            "url": "https://checkout.stripe.com/c/pay/fake_session_for_dev",
            "session_id": "cs_test_fake_id",
            "breakdown": {
                "tip": tip_request.amount,
                "tipsy_fee": round(tip_request.amount * 0.01, 2),
                "stripe_fee": round(tip_request.amount * 0.029 + 0.30, 2),
                "total": round(tip_request.amount * 1.039 + 0.30, 2)
            }
        }

    server_doc = await db.servers.find_one({"id": tip_request.server_id}, {"_id": 0})
    if not server_doc:
        raise HTTPException(status_code=404, detail="Server not found")
    
    tip_amount = tip_request.amount
    tipsy_fee = round(tip_amount * 0.01, 2)
    stripe_fee = round(tip_amount * 0.029 + 0.30, 2)
    total_to_charge = round(tip_amount + tipsy_fee + stripe_fee, 2)
    
    amount_in_cents = int(total_to_charge * 100)
    tipsy_fee_cents = int(tipsy_fee * 100)
    
    try:
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
        
        stripe_account_id = server_doc.get("stripe_account_id")
        if stripe_account_id and server_doc.get("stripe_onboarding_complete"):
            session_params["payment_intent_data"] = {
                "application_fee_amount": tipsy_fee_cents,
                "transfer_data": {"destination": stripe_account_id},
            }
        
        session = stripe.checkout.Session.create(**session_params)
        
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

@router.get("/checkout-status/{session_id}")
async def get_checkout_status(session_id: str):
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.get("payment_status") == "paid" or session_id == "cs_test_fake_id":
        return {"status": "complete", "payment_status": "paid", "session_id": session_id}
    
    try:
        session = await stripe.checkout.Session.retrieve_async(session_id)
        new_status = "paid" if session.payment_status == "paid" else "pending"
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": new_status, "status": session.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
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
        
        return {"status": session.status, "payment_status": session.payment_status, "session_id": session_id}
    except Exception as e:
        logger.error(f"Error checking payment status: {e}")
        raise HTTPException(status_code=500, detail="Error checking payment status")

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    body = await request.body()
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    if not stripe_signature or not webhook_secret:
        raise HTTPException(status_code=400, detail="Missing signature or webhook secret configuration")
    
    try:
        event = stripe.Webhook.construct_event(
            payload=body,
            sig_header=stripe_signature,
            secret=webhook_secret
        )
        
        logger.info(f"Webhook received: {event.type}")
        if event.type == "checkout.session.completed":
            session = event.data.object
            await db.payment_transactions.update_one(
                {"session_id": session.id},
                {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        return {"success": True}
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid webhook signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))