#!/usr/bin/env python3
"""
MongoDB Seeding Script for Steel Scrap Analysis System
Populates the database with realistic data for 7 scrap types and various number plates
"""

import os
import sys
from datetime import datetime, timedelta
import random
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "steel_scrap_db"

# Scrap types with realistic characteristics
SCRAP_TYPES = [
    {
        "name": "CRC",
        "price": 52000,
        "rawMaterials": ["Cold Rolled Coil", "Zinc Coating", "Chromium", "Nickel"],
        "processingSteps": ["Inspection", "Cleaning", "Coating Removal", "Melting", "Alloying"],
        "energyRequired": "2.8 MWh/ton",
        "carbonFootprint": "0.9 tons CO2/ton",
        "description": "Cold Rolled Coil scrap with high quality surface finish"
    },
    {
        "name": "Burada",
        "price": 38000,
        "rawMaterials": ["Iron Ore", "Coke", "Limestone", "Dolomite"],
        "processingSteps": ["Sorting", "Crushing", "Screening", "Blending", "Sintering"],
        "energyRequired": "3.2 MWh/ton",
        "carbonFootprint": "1.1 tons CO2/ton",
        "description": "Iron ore fines and sinter feed material"
    },
    {
        "name": "K2",
        "price": 65000,
        "rawMaterials": ["High Carbon Steel", "Manganese", "Silicon", "Chromium"],
        "processingSteps": ["Grading", "Cleaning", "Melting", "Alloying", "Refining"],
        "energyRequired": "3.5 MWh/ton",
        "carbonFootprint": "1.3 tons CO2/ton",
        "description": "High-grade steel scrap with specific alloy composition"
    },
    {
        "name": "Selected",
        "price": 75000,
        "rawMaterials": ["Premium Steel", "Alloy Elements", "Clean Scrap"],
        "processingSteps": ["Quality Check", "Sorting", "Cleaning", "Melting", "Refining"],
        "energyRequired": "2.2 MWh/ton",
        "carbonFootprint": "0.7 tons CO2/ton",
        "description": "Premium quality selected steel scrap"
    },
    {
        "name": "Piece to Piece",
        "price": 42000,
        "rawMaterials": ["Mixed Steel", "Iron", "Alloy Elements"],
        "processingSteps": ["Manual Sorting", "Size Classification", "Cleaning", "Melting"],
        "energyRequired": "2.8 MWh/ton",
        "carbonFootprint": "0.9 tons CO2/ton",
        "description": "Individual pieces of steel scrap requiring manual handling"
    },
    {
        "name": "Melting",
        "price": 35000,
        "rawMaterials": ["Low Grade Steel", "Iron", "Carbon"],
        "processingSteps": ["Preheating", "Melting", "Basic Refining", "Casting"],
        "energyRequired": "4.0 MWh/ton",
        "carbonFootprint": "1.5 tons CO2/ton",
        "description": "Low-grade scrap suitable for basic melting processes"
    },
    {
        "name": "Sponge Iron",
        "price": 28000,
        "rawMaterials": ["Iron Ore", "Coal", "Natural Gas"],
        "processingSteps": ["Reduction", "Cooling", "Screening", "Briquetting"],
        "energyRequired": "5.5 MWh/ton",
        "carbonFootprint": "2.0 tons CO2/ton",
        "description": "Direct reduced iron with high porosity structure"
    }
]

# Sample number plates (Indian format)
NUMBER_PLATES = [
    "MH01AB1234", "MH02CD5678", "MH03EF9012", "MH04GH3456", "MH05IJ7890",
    "DL01AB1234", "DL02CD5678", "DL03EF9012", "DL04GH3456", "DL05IJ7890",
    "KA01AB1234", "KA02CD5678", "KA03EF9012", "KA04GH3456", "KA05IJ7890",
    "TN01AB1234", "TN02CD5678", "TN03EF9012", "TN04GH3456", "TN05IJ7890",
    "AP01AB1234", "AP02CD5678", "AP03EF9012", "AP04GH3456", "AP05IJ7890",
    "GJ01AB1234", "GJ02CD5678", "GJ03EF9012", "GJ04GH3456", "GJ05IJ7890",
    "UP01AB1234", "UP02CD5678", "UP03EF9012", "UP04GH3456", "UP05IJ7890"
]

def generate_analysis_record(date, truck_number, scrap_type):
    """Generate a realistic analysis record"""
    
    # Find scrap type details
    type_details = next((t for t in SCRAP_TYPES if t["name"] == scrap_type), None)
    if not type_details:
        return None
    
    # Generate realistic confidence scores
    confidence = random.uniform(0.75, 0.98)
    
    # Generate predictions array
    predictions = [
        {
            "class": scrap_type,
            "confidence": confidence,
            "x": random.uniform(100, 500),
            "y": random.uniform(100, 500),
            "width": random.uniform(50, 200),
            "height": random.uniform(50, 200)
        }
    ]
    
    # Add secondary predictions with lower confidence
    other_types = [t["name"] for t in SCRAP_TYPES if t["name"] != scrap_type]
    if random.random() < 0.3:  # 30% chance of secondary detection
        secondary_type = random.choice(other_types)
        secondary_confidence = random.uniform(0.1, 0.4)
        predictions.append({
            "class": secondary_type,
            "confidence": secondary_confidence,
            "x": random.uniform(100, 500),
            "y": random.uniform(100, 500),
            "width": random.uniform(30, 150),
            "height": random.uniform(30, 150)
        })
    
    # Generate plate predictions
    plate_predictions = [
        {
            "class": "License Plate",
            "confidence": random.uniform(0.85, 0.98),
            "x": random.uniform(200, 400),
            "y": random.uniform(50, 150),
            "width": random.uniform(80, 120),
            "height": random.uniform(20, 30)
        }
    ]
    
    # Generate image filenames
    scrap_image = f"scrap_{scrap_type.lower().replace(' ', '_')}_{date.strftime('%Y%m%d')}_{random.randint(1000, 9999)}.jpg"
    plate_image = f"plate_{truck_number}_{date.strftime('%Y%m%d')}_{random.randint(1000, 9999)}.jpg"
    
    return {
        "timestamp": date.isoformat(),
        "truck_number": truck_number,
        "scrap_image": scrap_image,
        "plate_image": plate_image,
        "scrap_predictions": predictions,
        "plate_predictions": plate_predictions,
        "analysis_id": f"analysis_{date.strftime('%Y%m%d')}_{random.randint(10000, 99999)}"
    }

def seed_database():
    """Seed the MongoDB database with realistic data"""
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Clear existing data
        print("🗑️  Clearing existing data...")
        db.analysis_history.delete_many({})
        db.truck_records.delete_many({})
        db.scrap_records.delete_many({})
        
        # Create collections if they don't exist
        analysis_collection = db.analysis_history
        truck_collection = db.truck_records
        scrap_collection = db.scrap_records
        
        print("🌱 Starting to seed database...")
        
        # Generate data for the past year
        start_date = datetime.now() - timedelta(days=365)
        end_date = datetime.now()
        
        total_records = 0
        
        # Generate daily records
        current_date = start_date
        while current_date <= end_date:
            # Skip some days randomly (weekends have less activity)
            if current_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
                if random.random() < 0.7:  # 70% chance to skip weekend
                    current_date += timedelta(days=1)
                    continue
            
            # Generate 5-15 records per day
            daily_records = random.randint(5, 15)
            
            for _ in range(daily_records):
                # Select random truck and scrap type
                truck_number = random.choice(NUMBER_PLATES)
                scrap_type = random.choice(SCRAP_TYPES)["name"]
                
                # Generate analysis record
                record = generate_analysis_record(current_date, truck_number, scrap_type)
                if record:
                    # Insert into analysis history
                    analysis_collection.insert_one(record)
                    
                    # Insert/update truck record
                    truck_collection.update_one(
                        {"truck_number": truck_number},
                        {
                            "$set": {
                                "truck_number": truck_number,
                                "plate_image": record["plate_image"],
                                "plate_predictions": record["plate_predictions"],
                                "last_updated": current_date.isoformat()
                            }
                        },
                        upsert=True
                    )
                    
                    # Insert scrap record
                    scrap_collection.insert_one({
                        "timestamp": record["timestamp"],
                        "scrap_image": record["scrap_image"],
                        "scrap_predictions": record["scrap_predictions"],
                        "truck_number": truck_number
                    })
                    
                    total_records += 1
            
            current_date += timedelta(days=1)
            
            # Progress indicator
            if total_records % 100 == 0:
                print(f"📊 Generated {total_records} records...")
        
        print(f"✅ Database seeding completed!")
        print(f"📈 Total records generated: {total_records}")
        print(f"🚛 Unique trucks: {len(NUMBER_PLATES)}")
        print(f"🔧 Scrap types: {len(SCRAP_TYPES)}")
        
        # Print sample data
        print("\n📋 Sample records:")
        sample_records = list(analysis_collection.find().limit(3))
        for i, record in enumerate(sample_records, 1):
            print(f"  {i}. {record['truck_number']} - {record['scrap_predictions'][0]['class']} ({record['timestamp'][:10]})")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🚀 Steel Scrap Analysis System - Database Seeder")
    print("=" * 50)
    
    # Check if MongoDB is accessible
    try:
        client = MongoClient(MONGO_URI)
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        client.close()
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("Please ensure MongoDB is running and accessible")
        sys.exit(1)
    
    # Confirm before proceeding
    response = input("\nDo you want to proceed with seeding the database? (y/N): ")
    if response.lower() in ['y', 'yes']:
        seed_database()
    else:
        print("❌ Database seeding cancelled")
        sys.exit(0)
