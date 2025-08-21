#!/usr/bin/env python3
"""
Create proper user management system with 3-tier hierarchy:
Admin -> Owner -> Labourer
"""
import os
import certifi
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime
import hashlib
import secrets

# Load environment variables
load_dotenv()

# MongoDB connection (same as app.py)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "steel_scrap_db"

def hash_password(password):
    """Hash password using SHA-256 with salt"""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${hashed}"

def create_user_management_system():
    """Create the user management system with proper roles and relationships"""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
        client.admin.command('ping')
        print("✅ MongoDB connected successfully")
        
        db = client[DB_NAME]
        
        print("🏗️  Setting up user management system...")
        
        # Clear existing user collections
        db.users.delete_many({})
        db.user_sessions.delete_many({})
        db.factories.delete_many({})
        
        # Create indexes
        db.users.create_index("email", unique=True)
        db.users.create_index("role")
        db.users.create_index("created_by")
        db.users.create_index("factory_id")
        db.factories.create_index("name", unique=True)
        db.factories.create_index("owner_id")
        
        # 1. Create Super Admin (first user)
        admin_password = "admin123"  # Change this in production
        admin_user = {
            "email": "admin@steel.com",
            "password": hash_password(admin_password),
            "role": "admin",
            "name": "System Administrator",
            "phone": "+91-9876543210",
            "created_at": datetime.utcnow(),
            "created_by": None,  # No one created admin
            "is_active": True,
            "permissions": ["create_owners", "view_all_factories", "system_management"]
        }
        
        db.users.insert_one(admin_user)
        print(f"👑 Created Super Admin: admin@steel.com / {admin_password}")
        
        # 2. Create Sample Factory Owner
        owner_password = "owner123"  # Will be set by admin
        owner_user = {
            "email": "owner@steelfactory.com",
            "password": hash_password(owner_password),
            "role": "owner",
            "name": "Rajesh Kumar",
            "phone": "+91-9876543211",
            "created_at": datetime.utcnow(),
            "created_by": "admin@steel.com",
            "is_active": True,
            "permissions": ["create_labourers", "view_factory_data", "manage_analysis"],
            "factory_details": {
                "name": "Steel Solutions Ltd",
                "address": "Industrial Area, Mumbai",
                "gst_number": "27ABCDE1234F1Z5",
                "contact_person": "Rajesh Kumar",
                "phone": "+91-9876543211"
            }
        }
        
        owner_result = db.users.insert_one(owner_user)
        owner_id = str(owner_result.inserted_id)
        
        # 3. Create Factory Record
        factory_record = {
            "name": "Steel Solutions Ltd",
            "owner_id": owner_id,
            "address": "Industrial Area, Mumbai",
            "gst_number": "27ABCDE1234F1Z5",
            "contact_person": "Rajesh Kumar",
            "phone": "+91-9876543211",
            "created_at": datetime.utcnow(),
            "is_active": True,
            "factory_type": "Steel Scrap Processing",
            "capacity": "1000 tons/month"
        }
        
        factory_result = db.factories.insert_one(factory_record)
        factory_id = str(factory_result.inserted_id)
        
        # Update owner with factory_id
        db.users.update_one(
            {"_id": owner_result.inserted_id},
            {"$set": {"factory_id": factory_id}}
        )
        
        print(f"🏭 Created Factory Owner: owner@steelfactory.com / {owner_password}")
        print(f"🏭 Factory: Steel Solutions Ltd (ID: {factory_id})")
        
        # 4. Create Sample Labourers
        labourer_passwords = ["labourer1", "labourer2", "labourer3"]
        labourer_names = ["Amit Singh", "Suresh Patel", "Ramesh Kumar"]
        labourer_phones = ["+91-9876543212", "+91-9876543213", "+91-9876543214"]
        
        for i, (name, phone, password) in enumerate(zip(labourer_names, labourer_phones, labourer_passwords)):
            labourer_user = {
                "email": f"labourer{i+1}@steelfactory.com",
                "password": hash_password(password),
                "role": "labourer",
                "name": name,
                "phone": phone,
                "created_at": datetime.utcnow(),
                "created_by": "owner@steelfactory.com",
                "factory_id": factory_id,
                "is_active": True,
                "permissions": ["upload_images", "view_own_analysis", "basic_reports"],
                "employee_id": f"EMP{i+1:03d}",
                "department": "Scrap Analysis",
                "shift": "Day" if i % 2 == 0 else "Night"
            }
            
            db.users.insert_one(labourer_user)
            print(f"👷 Created Labourer: labourer{i+1}@steelfactory.com / {password}")
        
        # 5. Create additional sample factories and owners
        additional_factories = [
            {
                "name": "Iron Works Corp",
                "owner_name": "Priya Sharma",
                "owner_email": "priya@ironworks.com",
                "owner_phone": "+91-9876543215",
                "address": "Industrial Zone, Delhi",
                "gst_number": "07ABCDE1234F1Z6"
            },
            {
                "name": "Metal Processing Ltd",
                "owner_name": "Vikram Singh",
                "owner_email": "vikram@metalprocessing.com",
                "owner_phone": "+91-9876543216",
                "address": "Manufacturing Hub, Bangalore",
                "gst_number": "29ABCDE1234F1Z7"
            }
        ]
        
        for factory_data in additional_factories:
            # Create owner
            owner_password = f"owner{secrets.token_hex(4)}"
            owner_user = {
                "email": factory_data["owner_email"],
                "password": hash_password(owner_password),
                "role": "owner",
                "name": factory_data["owner_name"],
                "phone": factory_data["owner_phone"],
                "created_at": datetime.utcnow(),
                "created_by": "admin@steel.com",
                "is_active": True,
                "permissions": ["create_labourers", "view_factory_data", "manage_analysis"]
            }
            
            owner_result = db.users.insert_one(owner_user)
            owner_id = str(owner_result.inserted_id)
            
            # Create factory
            factory_record = {
                "name": factory_data["name"],
                "owner_id": owner_id,
                "address": factory_data["address"],
                "gst_number": factory_data["gst_number"],
                "contact_person": factory_data["owner_name"],
                "phone": factory_data["owner_phone"],
                "created_at": datetime.utcnow(),
                "is_active": True,
                "factory_type": "Steel Scrap Processing",
                "capacity": "800 tons/month"
            }
            
            factory_result = db.factories.insert_one(factory_record)
            factory_id = str(factory_result.inserted_id)
            
            # Update owner with factory_id
            db.users.update_one(
                {"_id": owner_result.inserted_id},
                {"$set": {"factory_id": factory_id}}
            )
            
            print(f"🏭 Created Factory: {factory_data['name']}")
            print(f"👤 Owner: {factory_data['owner_email']} / {owner_password}")
        
        # Verify the system
        admin_count = db.users.count_documents({"role": "admin"})
        owner_count = db.users.count_documents({"role": "owner"})
        labourer_count = db.users.count_documents({"role": "labourer"})
        factory_count = db.factories.count_documents({})
        
        print(f"\n📊 User Management System Summary:")
        print(f"   Admins: {admin_count}")
        print(f"   Factory Owners: {owner_count}")
        print(f"   Labourers: {labourer_count}")
        print(f"   Factories: {factory_count}")
        
        print(f"\n🔑 Default Credentials:")
        print(f"   Admin: admin@steel.com / admin123")
        print(f"   Owner: owner@steelfactory.com / owner123")
        print(f"   Labourers: labourer1@steelfactory.com / labourer1")
        
        print(f"\n🎉 User management system created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating user management system: {e}")
        print(f"🔗 Connection URI: {MONGO_URI}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    create_user_management_system()
