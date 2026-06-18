import uuid
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, HttpUrl

# modèle de base de données interne
class Server(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    first_name: str
    photo_url: Optional[str] = None
    stripe_account_id: Optional[str] = None
    stripe_onboarding_complete: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Modèle de création de profil
class ServerCreate(BaseModel):
    phone: str = Field(
        ..., 
        strip_whitespace=True, # Retire les espaces avant et après
        pattern=r"^\+[1-9]\d{1,14}$", 
        description="Doit être au format international E.164"
    )
    # On nettoie le prénom et on force un minimum de 2 lettres
    first_name: str = Field(..., strip_whitespace=True, min_length=2, max_length=50)
    
    # vérifier  vrai lien internet (http/https)
    photo_url: Optional[HttpUrl] = None

# Modèle de demande de SMS
class SendOTPRequest(BaseModel):
    # éviter faux numéros
    phone: str = Field(
        ..., 
        strip_whitespace=True,
        pattern=r"^\+[1-9]\d{1,14}$",
        description="Doit être au format international E.164"
    )

# Modèle de vérification
class VerifyOTPRequest(BaseModel):
    phone: str = Field(
        ..., 
        strip_whitespace=True,
        pattern=r"^\+[1-9]\d{1,14}$",
        description="Doit être au format international E.164"
    )
    # l'OTPil doit faire exactement 6 caractères
    otp: str = Field(..., strip_whitespace=True, min_length=6, max_length=6)