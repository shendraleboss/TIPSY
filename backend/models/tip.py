import uuid
from datetime import datetime, timezone
from typing import Optional, Dict
from pydantic import BaseModel, Field, ConfigDict

class Tip(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # On s'assure que l'ID n'est pas une chaîne vide
    server_id: str = Field(..., min_length=10)
    # Impossible d'avoir des montants négatifs dans la base de données
    amount: float = Field(..., ge=0)
    total_paid: float = Field(..., ge=0)
    tipsy_fee: float = Field(..., ge=0)
    stripe_fee: float = Field(..., ge=0)
    # La monnaie doit toujours faire 3 lettres
    currency: str = Field(default="chf", min_length=3, max_length=3)
    session_id: str = Field(..., min_length=5)
    payment_status: str = Field(..., min_length=3)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    payment_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str = Field(..., min_length=5)
    server_id: str = Field(..., min_length=10)
    amount: float = Field(..., ge=0)
    currency: str = Field(..., min_length=3, max_length=3)
    payment_status: str = Field(..., min_length=3)
    status: str = Field(..., min_length=3)
    metadata: Optional[Dict] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TipCheckoutRequest(BaseModel):
    # L'ID du serveur 
    server_id: str = Field(..., min_length=10, max_length=50)
    
    # Refus pourboire inférieur à 1.00 CHF
    amount: float = Field(..., ge=1.00, description="Le montant doit couvrir les frais fixes")
    
    # L'URL doit avoir une longueur cohérente
    host_url: str = Field(..., min_length=10, max_length=200)
    
    # Ticket unique
    idempotency_key: str = Field(..., min_length=10, max_length=50, description="Clé anti-doublon") 