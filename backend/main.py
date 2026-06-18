from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from contextlib import asynccontextmanager

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from config.security import limiter

# Imports des configurations et des routes
from config.db import client
from routes import auth, servers, tips

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# GESTION DE DÉMARRAGE/ARRÊT
@asynccontextmanager
async def lifespan(app: FastAPI):
    #avant yield = démarrage
    yield
    # après = arrêt du serveur
    client.close()

# Création de l'application FastAPI
app = FastAPI(title="Tipsy API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configuration des CORS
raw_cors = os.environ.get('CORS_ORIGINS', 'http://localhost:3000')
cors_origins = [
    origin.strip() 
    for origin in raw_cors.split(',') 
    if origin.strip() and origin.strip() != "*"
]

if not cors_origins:
    cors_origins = ["http://localhost:3000"]
    
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrement des différents routeurs
app.include_router(auth.router, prefix="/api")
app.include_router(servers.router, prefix="/api")
app.include_router(tips.router, prefix="/api")

@app.get("/api/")
async def root():
    return {"message": "Tipsy API"}