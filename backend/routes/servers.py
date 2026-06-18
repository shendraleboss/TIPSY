import os
import stripe
import logging
from typing import List
from fastapi import APIRouter, HTTPException, Request, Depends

from config.db import db
from models.server import Server, ServerCreate
from models.tip import Tip
from config.security import get_current_phone

router = APIRouter(prefix="/servers", tags=["Servers"])
logger = logging.getLogger(__name__)

stripe.api_key = os.environ.get('STRIPE_API_KEY')

@router.post("/profile", response_model=Server)
async def create_or_update_server_profile(
    server_data: ServerCreate,
    current_phone: str = Depends(get_current_phone)
):
    if server_data.phone != current_phone:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé à modifier ce profil.")
    
    existing = await db.servers.find_one({"phone": server_data.phone}, {"_id": 0})
    if existing:
        update_data = server_data.model_dump()
        await db.servers.update_one(
            {"phone": server_data.phone},
            {"$set": update_data}
        )
        updated = await db.servers.find_one({"phone": server_data.phone}, {"_id": 0})
        return Server(**updated)
    else:
        server = Server(**server_data.model_dump())
        await db.servers.insert_one(server.model_dump())
        return server

@router.get("/by-phone/{phone}", response_model=Server)
async def get_server_by_phone(phone: str, current_phone: str = Depends(get_current_phone)):
    if phone != current_phone:
        raise HTTPException(status_code=403, detail="Accès refusé.")
    server_doc = await db.servers.find_one({"phone": phone}, {"_id": 0})
    if not server_doc:
        raise HTTPException(status_code=404, detail="Server not found")
    return Server(**server_doc)

@router.get("/{server_id}")
async def get_server(server_id: str):
    # On ne demande à la BDD que l'ID, le prénom et la photo (1 = inclure, 0 = exclure)
    server_doc = await db.servers.find_one(
        {"id": server_id}, 
        {"_id": 0, "id": 1, "first_name": 1, "photo_url": 1}
    )
    if not server_doc:
        raise HTTPException(status_code=404, detail="Server not found")
    
    # On renvoie directement le dictionnaire filtré au lieu du modèle Pydantic complet
    return server_doc

@router.get("/{server_id}/tips", response_model=List[Tip])
async def get_server_tips(server_id: str, current_phone: str = Depends(get_current_phone)):
    server_doc = await db.servers.find_one({"id": server_id}, {"_id": 0})
    if not server_doc or server_doc.get("phone") != current_phone:
        raise HTTPException(status_code=403, detail="Accès refusé.")

    tips = await db.tips.find(
        {"server_id": server_id, "payment_status": "paid"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [Tip(**tip) for tip in tips]

@router.get("/{server_id}/stats")
async def get_server_stats(server_id: str, current_phone: str = Depends(get_current_phone)):
    server_doc = await db.servers.find_one({"id": server_id}, {"_id": 0})
    if not server_doc or server_doc.get("phone") != current_phone:
        raise HTTPException(status_code=403, detail="Accès refusé.")

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

@router.post("/{server_id}/stripe-connect/onboard")
async def create_stripe_connect_account(server_id: str, request: Request, current_phone: str = Depends(get_current_phone)):
    server_doc = await db.servers.find_one({"id": server_id}, {"_id": 0})
    if not server_doc:
        raise HTTPException(status_code=404, detail="Server not found")
    
    if server_doc.get("phone") != current_phone:
        raise HTTPException(status_code=403, detail="Accès refusé.")
    
    try:
        if not server_doc.get("stripe_account_id"):
            phone_number = server_doc.get("phone", "")
            clean_phone = phone_number.replace(" ", "").replace("+", "")
            
            account = stripe.Account.create(
                type="express",
                country="CH",
                email=f"{clean_phone}@tipsy.app",
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
            )
            await db.servers.update_one(
                {"id": server_id},
                {"$set": {"stripe_account_id": account.id}}
            )
            stripe_account_id = account.id
        else:
            stripe_account_id = server_doc["stripe_account_id"]
        
        body = await request.json()
        refresh_url = body.get("refresh_url", "http://localhost:3000/dashboard")
        return_url = body.get("return_url", "http://localhost:3000/dashboard")
        
        account_link = stripe.AccountLink.create(
            account=stripe_account_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding",
        )
        return {"url": account_link.url, "stripe_account_id": stripe_account_id}
        
    except Exception as e:
        logger.error(f"Error creating Stripe Connect account: {e}")
        raise HTTPException(status_code=500, detail="Impossible d'initialiser la connexion avec Stripe.")

@router.get("/{server_id}/stripe-connect/status")
async def get_stripe_connect_status(server_id: str, current_phone: str = Depends(get_current_phone)):
    server_doc = await db.servers.find_one({"id": server_id}, {"_id": 0})
    if not server_doc:
        raise HTTPException(status_code=404, detail="Server not found")
    
    if server_doc.get("phone") != current_phone:
        raise HTTPException(status_code=403, detail="Accès refusé.")
    
    stripe_account_id = server_doc.get("stripe_account_id")
    if not stripe_account_id:
        return {"connected": False, "charges_enabled": False, "details_submitted": False}
    
    try:
        account = stripe.Account.retrieve(stripe_account_id)
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
        # On masque l'erreur détaillée pour éviter de divulguer des informations sensibles
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification du statut Stripe.")