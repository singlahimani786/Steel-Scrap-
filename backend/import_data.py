#!/usr/bin/env python3
"""
Simple MongoDB Import Script for Steel Scrap Analysis System
Imports the seed_data.json file into MongoDB collections
"""

import json
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "steel_scrap_db"

def import_data():
    """Import data from JSON file into MongoDB"""
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Clear existing data
        print("🗑️  Clearing existing data...")
        db.analysis_history.delete_many({})
        db.truck_records.delete_many({})
        db.scrap_records.delete_many({})
        
        # Read JSON file
        print("📖 Reading seed data...")
        with open('seed_data.json', 'r') as file:
            data = json.load(file)
        
        # Import analysis history
        print("📊 Importing analysis history...")
        if 'analysis_history' in data:
            result = db.analysis_history.insert_many(data['analysis_history'])
            print(f"✅ Imported {len(result.inserted_ids)} analysis records")
        
        # Import truck records
        print("🚛 Importing truck records...")
        if 'truck_records' in data:
            result = db.truck_records.insert_many(data['truck_records'])
            print(f"✅ Imported {len(result.inserted_ids)} truck records")
        
        # Import scrap records
        print("🔧 Importing scrap records...")
        if 'scrap_records' in data:
            result = db.scrap_records.insert_many(data['scrap_records'])
            print(f"✅ Imported {len(result.inserted_ids)} scrap records")
        
        # Verify data
        print("\n📋 Data verification:")
        print(f"   Analysis History: {db.analysis_history.count_documents({})}")
        print(f"   Truck Records: {db.truck_records.count_documents({})}")
        print(f"   Scrap Records: {db.scrap_records.count_documents({})}")
        
        # Show sample data
        print("\n📋 Sample analysis records:")
        sample_records = list(db.analysis_history.find().limit(3))
        for i, record in enumerate(sample_records, 1):
            scrap_type = record['scrap_predictions'][0]['class'] if record['scrap_predictions'] else 'Unknown'
            print(f"  {i}. {record['truck_number']} - {scrap_type} ({record['timestamp'][:10]})")
        
        client.close()
        print("\n✅ Data import completed successfully!")
        
    except Exception as e:
        print(f"❌ Error importing data: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Steel Scrap Analysis System - Data Importer")
    print("=" * 50)
    
    # Check if JSON file exists
    if not os.path.exists('seed_data.json'):
        print("❌ seed_data.json file not found!")
        print("Please ensure seed_data.json is in the same directory")
        exit(1)
    
    # Check MongoDB connection
    try:
        client = MongoClient(MONGO_URI)
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        client.close()
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("Please ensure MongoDB is running and accessible")
        exit(1)
    
    # Import data
    if import_data():
        print("\n🎉 You can now start the backend server and view the analytics!")
        print("   Run: python3 app.py")
    else:
        print("\n❌ Data import failed. Please check the error messages above.")
