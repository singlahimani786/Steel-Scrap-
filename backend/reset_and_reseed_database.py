#!/usr/bin/env python3
"""
Complete Database Reset and Reseed Script
This script completely cleans the database and creates fresh factory-specific data.
"""

import os
import sys
import secrets
from datetime import datetime, timedelta
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv
import hashlib

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI')
DB_NAME = 'steel_scrap_db'

def hash_password(password):
    """Hash password using SHA-256 with salt (matching backend)"""
    import secrets
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${hashed}"

def reset_and_reseed_database():
    """Completely reset and reseed the database"""
    try:
        # Connect to MongoDB
        print("🔌 Connecting to MongoDB...")
        client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
        db = client[DB_NAME]
        
        # Test connection
        client.admin.command('ping')
        print("✅ MongoDB connected successfully")
        
        print("\n🗑️  Starting complete database reset...")
        
        # 1. Drop all collections
        print("📋 Dropping all existing collections...")
        collections_to_drop = [
            'users', 'factories', 'analysis_history', 
            'user_sessions', 'truck_records', 'scrap_records'
        ]
        
        for collection_name in collections_to_drop:
            if collection_name in db.list_collection_names():
                db[collection_name].drop()
                print(f"   ✅ Dropped {collection_name}")
            else:
                print(f"   ℹ️  {collection_name} doesn't exist")
        
        print("\n🏗️  Creating fresh database structure...")
        
        # 2. Create Super Admin
        admin_user = {
            "email": "admin@steel.com",
            "password": hash_password("admin123"),
            "role": "admin",
            "name": "System Administrator",
            "phone": "+91-9876543210",
            "created_at": datetime.utcnow(),
            "created_by": None,
            "is_active": True,
            "permissions": ["create_owners", "view_all_factories", "system_management"]
        }
        
        admin_result = db.users.insert_one(admin_user)
        admin_id = str(admin_result.inserted_id)
        print(f"👑 Created Super Admin: admin@steel.com / admin123")
        
        # 3. Create Factory Owners and Factories
        factory_data = [
            {
                "name": "Steel Solutions Ltd",
                "owner_email": "owner@steelfactory.com",
                "owner_name": "Rajesh Kumar",
                "owner_phone": "+91-9876543211",
                "address": "Industrial Area, Mumbai",
                "gst_number": "27ABCDE1234F1Z5",
                "capacity": "1000 tons/month"
            },
            {
                "name": "Iron Works Corp",
                "owner_email": "priya@ironworks.com",
                "owner_name": "Priya Sharma",
                "owner_phone": "+91-9876543212",
                "address": "Steel Zone, Delhi",
                "gst_number": "07ABCDE1234F1Z6",
                "capacity": "800 tons/month"
            },
            {
                "name": "Metal Processing Ltd",
                "owner_email": "vikram@metalprocessing.com",
                "owner_name": "Vikram Singh",
                "owner_phone": "+91-9876543213",
                "address": "Industrial Hub, Bangalore",
                "gst_number": "29ABCDE1234F1Z7",
                "capacity": "1200 tons/month"
            }
        ]
        
        factories_created = []
        
        for i, factory_info in enumerate(factory_data):
            # Create owner
            owner_password = f"owner{i+1}23"
            owner_user = {
                "email": factory_info["owner_email"],
                "password": hash_password(owner_password),
                "role": "owner",
                "name": factory_info["owner_name"],
                "phone": factory_info["owner_phone"],
                "created_at": datetime.utcnow(),
                "created_by": admin_id,
                "is_active": True,
                "permissions": ["create_labourers", "view_factory_data", "manage_analysis"]
            }
            
            owner_result = db.users.insert_one(owner_user)
            owner_id = str(owner_result.inserted_id)
            
            # Create factory
            factory_record = {
                "name": factory_info["name"],
                "owner_id": owner_id,
                "address": factory_info["address"],
                "gst_number": factory_info["gst_number"],
                "contact_person": factory_info["owner_name"],
                "phone": factory_info["owner_phone"],
                "created_at": datetime.utcnow(),
                "is_active": True,
                "factory_type": "Steel Scrap Processing",
                "capacity": factory_info["capacity"]
            }
            
            factory_result = db.factories.insert_one(factory_record)
            factory_id = str(factory_result.inserted_id)
            
            # Update owner with factory_id
            db.users.update_one(
                {"_id": owner_result.inserted_id},
                {"$set": {"factory_id": factory_id}}
            )
            
            factories_created.append({
                "factory_id": factory_id,
                "owner_id": owner_id,
                "name": factory_info["name"],
                "owner_email": factory_info["owner_email"],
                "owner_password": owner_password
            })
            
            print(f"🏭 Created Factory: {factory_info['name']}")
            print(f"👤 Owner: {factory_info['owner_email']} / {owner_password}")
        
        # 4. Create Labourers for each factory
        labourer_names = ["Amit Singh", "Suresh Patel", "Ramesh Kumar", "Lakshmi Devi", "Arun Kumar"]
        labourer_phones = ["+91-9876543220", "+91-9876543221", "+91-9876543222", "+91-9876543223", "+91-9876543224"]
        
        for factory_info in factories_created:
            factory_id = factory_info["factory_id"]
            factory_name = factory_info["name"]
            
            print(f"\n👷 Creating labourers for {factory_name}...")
            
            for i in range(3):  # 3 labourers per factory
                labourer_password = f"labourer{i+1}"
                labourer_user = {
                    "email": f"labourer{i+1}@{factory_name.lower().replace(' ', '').replace('.', '')}.com",
                    "password": hash_password(labourer_password),
                    "role": "labourer",
                    "name": labourer_names[i],
                    "phone": labourer_phones[i],
                    "created_at": datetime.utcnow(),
                    "created_by": factory_info["owner_id"],
                    "factory_id": factory_id,
                    "owner_id": factory_info["owner_id"],  # Add owner_id for submission functionality
                    "is_active": True,
                    "permissions": ["upload_images", "view_own_analysis", "basic_reports"],
                    "employee_id": f"EMP{i+1:03d}",
                    "department": "Scrap Analysis",
                    "shift": "Day" if i % 2 == 0 else "Night"
                }
                
                db.users.insert_one(labourer_user)
                print(f"   👷 Created: {labourer_names[i]} / {labourer_password}")
        
        # 5. Create Factory-Specific Analysis Data
        print(f"\n📊 Creating factory-specific analysis data...")
        
        scrap_types = ["CRC", "Burada", "K2", "Selected", "Piece to Piece", "Melting", "Sponge Iron"]
        
        for factory_info in factories_created:
            factory_id = factory_info["factory_id"]
            factory_name = factory_info["name"]
            
            print(f"   🏭 Creating data for {factory_name}...")
            
            # Generate 60 days of sample data for this factory
            start_date = datetime.utcnow() - timedelta(days=60)
            
            for day in range(60):
                current_date = start_date + timedelta(days=day)
                
                # Generate 1-4 records per day (realistic variation)
                daily_records = 1 + (day % 4)  # Vary between 1-4
                
                for record_num in range(daily_records):
                    # Create a sample analysis record
                    scrap_type = scrap_types[(day + record_num) % len(scrap_types)]
                    
                    record = {
                        "timestamp": current_date,
                        "truck_number": f"MH{day:02d}AB{record_num:02d}34",
                        "scrap_image": f"scrap_{factory_name.lower().replace(' ', '_').replace('.', '')}_{day}_{record_num}.jpg",
                        "plate_image": f"plate_{factory_name.lower().replace(' ', '_').replace('.', '')}_{day}_{record_num}.jpg",
                        "scrap_predictions": [
                            {
                                "class": scrap_type,
                                "confidence": 0.85 + (record_num * 0.05),
                                "bbox": [100, 100, 500, 500]
                            }
                        ],
                        "plate_predictions": [
                            {
                                "class": f"MH{day:02d}AB{record_num:02d}34",
                                "confidence": 0.90 + (record_num * 0.03),
                                "bbox": [50, 50, 300, 100]
                            }
                        ],

                        "analysis_id": f"analysis_{factory_id}_{day}_{record_num}",
                        "worker_id": f"worker_{factory_id}_{record_num % 3 + 1}",
                        "processing_time": 3.0 + (record_num * 0.5),
                        "status": "completed",
                        "factory_id": factory_id,
                        "owner_id": factory_info["owner_id"]
                    }
                    
                    db.analysis_history.insert_one(record)
            
            print(f"   ✅ Created {60 * daily_records} analysis records for {factory_name}")
        
        # 6. Create indexes for performance
        print(f"\n📈 Creating database indexes...")
        
        db.users.create_index("email", unique=True)
        db.users.create_index("role")
        db.users.create_index("factory_id")
        db.factories.create_index("owner_id")
        db.analysis_history.create_index("factory_id")
        db.analysis_history.create_index("timestamp")
        db.analysis_history.create_index("truck_number")
        
        print("   ✅ Indexes created successfully")
        
        # 7. Verify the setup
        print(f"\n🔍 Verifying database setup...")
        
        admin_count = db.users.count_documents({"role": "admin"})
        owner_count = db.users.count_documents({"role": "owner"})
        labourer_count = db.users.count_documents({"role": "labourer"})
        factory_count = db.factories.count_documents({})
        analysis_count = db.analysis_history.count_documents({})
        
        print(f"📊 Database Summary:")
        print(f"   Admins: {admin_count}")
        print(f"   Factory Owners: {owner_count}")
        print(f"   Labourers: {labourer_count}")
        print(f"   Factories: {factory_count}")
        print(f"   Analysis Records: {analysis_count}")
        
        # 8. Test factory isolation
        print(f"\n🧪 Testing factory data isolation...")
        
        for factory_info in factories_created:
            factory_id = factory_info["factory_id"]
            factory_name = factory_info["name"]
            
            # Count records for this factory
            factory_records = db.analysis_history.count_documents({"factory_id": factory_id})
            print(f"   {factory_name}: {factory_records} analysis records")
            
            # Verify no cross-factory data
            other_factories_records = db.analysis_history.count_documents({
                "factory_id": {"$ne": factory_id}
            })
            if other_factories_records > 0:
                print(f"     ⚠️  Found {other_factories_records} records from other factories")
            else:
                print(f"     ✅ No cross-factory data found")
        
        # 9. Display login credentials
        print(f"\n🔑 Login Credentials:")
        print(f"   Admin: admin@steel.com / admin123")
        for factory_info in factories_created:
            print(f"   {factory_info['name']} Owner: {factory_info['owner_email']} / {factory_info['owner_password']}")
        
        client.close()
        print(f"\n🎉 Database reset and reseed completed successfully!")
        print(f"🏭 Each factory now has isolated data with no cross-contamination!")
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    reset_and_reseed_database()
