from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
import logging

# Imports des configurations et des routes
from config.db import client
from routes import auth, servers, tips

# Configuration du logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Création de l'application FastAPI
app = FastAPI(title="Tipsy API")

# Configuration des CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enregistrement des différents routeurs (équivalent à ton ancien api_router)
app.include_router(auth.router, prefix="/api")
app.include_router(servers.router, prefix="/api")
app.include_router(tips.router, prefix="/api")

@app.get("/api/")
async def root():
    return {"message": "Tipsy API"}

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()