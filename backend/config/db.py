import os
from dotenv import load_dotenv, find_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# find_dotenv() cherche automatiquement le fichier .env où qu'il soit
load_dotenv(find_dotenv())

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]