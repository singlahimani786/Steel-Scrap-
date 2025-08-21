#!/usr/bin/env python3
"""
Clear all MongoDB collections and start fresh
"""
import os
import certifi
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

# MongoDB connection (same as app.py)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "steel_scrap_db"

def clear_database():
    """Clear all collections in the database"""
    try:
        # Connect to MongoDB (same connection logic as app.py)
        client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
        
        # Test the connection
        client.admin.command('ping')
        print("✅ MongoDB connected successfully")
        
        db = client[DB_NAME]
        
        print("🗑️  Clearing all collections...")
        
        # List all collections
        collections = db.list_collection_names()
        print(f"📋 Found collections: {collections}")
        
        # Clear each collection
        for collection_name in collections:
            collection = db[collection_name]
            count = collection.count_documents({})
            collection.delete_many({})
            print(f"🗑️  Cleared {collection_name}: {count} documents deleted")
        
        print("✅ Database cleared successfully!")
        
        # Verify collections are empty
        for collection_name in collections:
            collection = db[collection_name]
            count = collection.count_documents({})
            print(f"📊 {collection_name}: {count} documents remaining")
        
    except Exception as e:
        print(f"❌ Error clearing database: {e}")
        print(f"🔗 Connection URI: {MONGO_URI}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    clear_database()
