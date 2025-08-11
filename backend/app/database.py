from pymongo import MongoClient
import os
from dotenv import load_dotenv
import certifi

load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"), tlsCAFile=certifi.where())
db = client["steel_scrap_db"]

truck_collection = db["truck_records"]
scrap_collection = db["scrap_records"]
