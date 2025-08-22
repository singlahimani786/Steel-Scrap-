#!/usr/bin/env python3
"""
Clean Factory Data Script
This script cleans up the database to ensure proper factory data isolation.
"""

import os
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = 'steel_scrap_db'

def clean_factory_data():
    """Clean up factory data and ensure proper isolation"""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
        db = client[DB_NAME]
        
        print("🏭 Cleaning factory data...")
        
        # 1. Check current state
        total_records = db.analysis_history.count_documents({})
        records_with_factory = db.analysis_history.count_documents({"factory_id": {"$exists": True}})
        records_without_factory = db.analysis_history.count_documents({"factory_id": {"$exists": False}})
        
        print(f"📊 Current state:")
        print(f"   Total records: {total_records}")
        print(f"   Records with factory_id: {records_with_factory}")
        print(f"   Records without factory_id: {records_without_factory}")
        
        # 2. Get factory information
        factories = list(db.factories.find({}))
        print(f"\n🏭 Available factories:")
        for factory in factories:
            print(f"   - {factory['name']} (ID: {factory['_id']})")
        
        # 3. Clean up records without factory_id
        if records_without_factory > 0:
            print(f"\n🗑️  Removing {records_without_factory} records without factory_id...")
            result = db.analysis_history.delete_many({"factory_id": {"$exists": False}})
            print(f"   ✅ Removed {result.deleted_count} records")
        
        # 4. Create fresh factory-specific data
        print(f"\n🌱 Creating fresh factory-specific data...")
        
        # Clear existing analysis data
        db.analysis_history.delete_many({})
        
        # Create sample data for each factory
        for factory in factories:
            factory_id = str(factory['_id'])
            factory_name = factory['name']
            
            print(f"   Creating data for {factory_name}...")
            
            # Generate 30 days of sample data for this factory
            start_date = datetime.utcnow() - timedelta(days=30)
            
            for day in range(30):
                current_date = start_date + timedelta(days=day)
                
                # Generate 2-5 records per day
                daily_records = 2 + (day % 4)  # Vary between 2-5
                
                for _ in range(daily_records):
                    # Create a sample analysis record
                    record = {
                        "timestamp": current_date,
                        "truck_number": f"MH{day:02d}AB{_:02d}34",
                        "scrap_image": f"scrap_{factory_name.lower().replace(' ', '_')}_{day}_{_}.jpg",
                        "plate_image": f"plate_{factory_name.lower().replace(' ', '_')}_{day}_{_}.jpg",
                        "scrap_predictions": [
                            {
                                "class": "CRC" if _ % 3 == 0 else "Burada" if _ % 3 == 1 else "K2",
                                "confidence": 0.85 + (_ * 0.05),
                                "bbox": [100, 100, 500, 500]
                            }
                        ],
                        "plate_predictions": [
                            {
                                "class": f"MH{day:02d}AB{_:02d}34",
                                "confidence": 0.90 + (_ * 0.03),
                                "bbox": [50, 50, 300, 100]
                            }
                        ],
                        "estimated_weight": 5.0 + (_ * 2.5),
                        "estimated_price": (5.0 + (_ * 2.5)) * 45000,
                        "analysis_id": f"analysis_{factory_id}_{day}_{_}",
                        "worker_id": f"worker_{factory_id}_{_ % 3 + 1}",
                        "processing_time": 3.0 + (_ * 0.5),
                        "status": "completed",
                        "factory_id": factory_id,
                        "owner_id": factory['owner_id']
                    }
                    
                    db.analysis_history.insert_one(record)
            
            print(f"   ✅ Created {30 * daily_records} records for {factory_name}")
        
        # 5. Verify the cleanup
        total_records_after = db.analysis_history.count_documents({})
        records_by_factory = {}
        
        for factory in factories:
            factory_id = str(factory['_id'])
            count = db.analysis_history.count_documents({"factory_id": factory_id})
            records_by_factory[factory['name']] = count
        
        print(f"\n✅ Cleanup completed!")
        print(f"📊 Final state:")
        print(f"   Total records: {total_records_after}")
        for factory_name, count in records_by_factory.items():
            print(f"   {factory_name}: {count} records")
        
        # 6. Test factory filtering
        print(f"\n🧪 Testing factory filtering...")
        for factory in factories:
            factory_id = str(factory['_id'])
            factory_name = factory['name']
            
            # Test analytics endpoint filtering
            test_filter = {"factory_id": factory_id}
            test_records = list(db.analysis_history.find(test_filter).limit(5))
            
            print(f"   {factory_name}: {len(test_records)} records found with filter")
            if test_records:
                sample = test_records[0]
                print(f"     Sample: {sample['truck_number']} - {sample['scrap_predictions'][0]['class']}")
        
        client.close()
        print(f"\n🎉 Factory data cleanup completed successfully!")
        
    except Exception as e:
        print(f"❌ Error cleaning factory data: {e}")
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    clean_factory_data()
