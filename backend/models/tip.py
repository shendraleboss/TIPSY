import uuid
from datetime import datetime, timezone
from typing import Optional, Dict
from pydantic import BaseModel, Field, ConfigDict

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