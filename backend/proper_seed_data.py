#!/usr/bin/env python3
"""
Proper database seeding for steel scrap analysis system
Workflow: Worker enters truck ID and scrap image -> Results stored in analysis_history
"""
import os
import certifi
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime, timedelta
import random
import secrets

# Load environment variables
load_dotenv()

# MongoDB connection (same as app.py)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "steel_scrap_db"

# Scrap types with proper details
SCRAP_TYPES = [
    "CRC", "Burada", "K2", "Selected", "Piece to Piece", "Melting", "Sponge Iron"
]

# Truck number plates (10 unique trucks)
TRUCK_NUMBERS = [
    "MH12AB1234", "DL01CD5678", "KA02EF9012", "TN03GH3456", "AP04IJ7890",
    "KL05KL2345", "GJ06MN6789", "MP07OP0123", "RJ08QR4567", "HR09ST8901"
]

# Mock image filenames
SCRAP_IMAGES = [
    "crc.jpg", "burada.jpg", "k2.jpg", "selected.jpg", "piece_to_piece.jpg", 
    "melting.jpg", "sponge_iron.jpg", "steel_scrap.jpg", "iron_scrap.jpg"
]

def generate_analysis_record(date, truck_number, scrap_type):
    """Generate a single analysis record following the proper workflow"""
    
    # Generate confidence scores (realistic values)
    confidence = round(random.uniform(0.75, 0.98), 3)
    
    # Generate predictions in the format the system expects
    scrap_predictions = [
        {
            "class": scrap_type,
            "confidence": confidence,
            "bbox": [random.randint(100, 400), random.randint(100, 400), 
                    random.randint(500, 800), random.randint(500, 800)]
        }
    ]
    
    # Generate plate predictions (mock data)
    plate_predictions = [
        {
            "class": truck_number,
            "confidence": round(random.uniform(0.85, 0.99), 3),
            "bbox": [random.randint(50, 200), random.randint(50, 200), 
                    random.randint(250, 400), random.randint(250, 400)]
        }
    ]
    
    # Generate weight and price estimates
    estimated_weight = round(random.uniform(5.0, 25.0), 2)
    estimated_price = round(estimated_weight * random.uniform(2000, 5000), 2)
    
    # Create the analysis record
    record = {
        "timestamp": date,
        "truck_number": truck_number,
        "scrap_image": random.choice(SCRAP_IMAGES),
        "plate_image": f"plate_{truck_number}.jpg",
        "scrap_predictions": scrap_predictions,
        "plate_predictions": plate_predictions,
        "estimated_weight": estimated_weight,
        "estimated_price": estimated_price,
        "analysis_id": f"analysis_{secrets.token_hex(8)}",
        "worker_id": f"worker_{random.randint(1, 5)}",
        "processing_time": round(random.uniform(2.5, 8.0), 2),
        "status": "completed",
        "factory_id": "68a631be20e6edab0728e430",  # Default factory ID from create_user_management.py
        "owner_id": "default_owner_id"  # This will be updated when proper user management is implemented
    }
    
    return record

def seed_database():
    """Seed the database with proper analysis history data"""
    try:
        # Connect to MongoDB (same connection logic as app.py)
        client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
        
        # Test the connection
        client.admin.command('ping')
        print("✅ MongoDB connected successfully")
        
        db = client[DB_NAME]
        
        print("🌱 Starting database seeding...")
        
        # Clear existing data
        print("🗑️  Clearing existing data...")
        db.analysis_history.delete_many({})
        db.users.delete_many({})
        
        # Create indexes
        db.analysis_history.create_index("timestamp")
        db.analysis_history.create_index("truck_number")
        db.analysis_history.create_index("scrap_predictions.class")
        
        # Generate one year of data (365 days)
        start_date = datetime.utcnow() - timedelta(days=365)
        records = []
        
        print("📊 Generating analysis records...")
        
        for day in range(365):
            current_date = start_date + timedelta(days=day)
            
            # Generate 2-5 records per day (realistic daily volume)
            daily_records = random.randint(2, 5)
            
            for _ in range(daily_records):
                truck_number = random.choice(TRUCK_NUMBERS)
                scrap_type = random.choice(SCRAP_TYPES)
                
                record = generate_analysis_record(current_date, truck_number, scrap_type)
                records.append(record)
        
        # Insert all records
        if records:
            result = db.analysis_history.insert_many(records)
            print(f"✅ Inserted {len(result.inserted_ids)} analysis records")
        
        # Create a test owner user
        owner_user = {
            "email": "owner@steel.com",
            "password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqQKqK",  # "password123"
            "role": "owner",
            "created_at": datetime.utcnow()
        }
        
        db.users.insert_one(owner_user)
        print("👤 Created owner user: owner@steel.com / password123")
        
        # Verify the data
        total_records = db.analysis_history.count_documents({})
        unique_trucks = len(db.analysis_history.distinct("truck_number"))
        unique_types = len(db.analysis_history.distinct("scrap_predictions.class"))
        
        print(f"\n📊 Database Summary:")
        print(f"   Total analysis records: {total_records}")
        print(f"   Unique trucks: {unique_trucks}")
        print(f"   Unique scrap types: {unique_types}")
        print(f"   Date range: {start_date.strftime('%Y-%m-%d')} to {datetime.utcnow().strftime('%Y-%m-%d')}")
        
        # Show sample record structure
        sample = db.analysis_history.find_one()
        if sample:
            print(f"\n📋 Sample record structure:")
            print(f"   Timestamp: {sample['timestamp']}")
            print(f"   Truck: {sample['truck_number']}")
            print(f"   Scrap Type: {sample['scrap_predictions'][0]['class']}")
            print(f"   Confidence: {sample['scrap_predictions'][0]['confidence']}")
        
        print("\n🎉 Database seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        print(f"🔗 Connection URI: {MONGO_URI}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    seed_database()
