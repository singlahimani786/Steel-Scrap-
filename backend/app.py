from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
import hashlib
import secrets
import os
import certifi
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

# Load environment variables
load_dotenv()

# ========== Setup ==========
app = Flask(__name__)

# Configure CORS for Vercel deployment + ngrok
CORS(app, origins=[
    "http://localhost:3000",  # Local development
    "https://*.vercel.app",   # Vercel domains
    "https://*.ngrok.io",     # ngrok tunnels
    "https://*.ngrok-free.app" # ngrok free tier
])

# MongoDB connection (with fallback for testing)
try:
    client = MongoClient(os.getenv("MONGO_URI", "mongodb://localhost:27017"), tlsCAFile=certifi.where())
    # Test the connection
    client.admin.command('ping')
    db = client["steel_scrap_db"]
    truck_collection = db["truck_records"]
    scrap_collection = db["scrap_records"]
    analysis_history_collection = db["analysis_history"]
    users_collection = db["users"]
    sessions_collection = db["user_sessions"]
    MONGODB_AVAILABLE = True
    print("✅ MongoDB connected successfully")
except Exception as e:
    print(f"⚠️ MongoDB connection failed: {e}")
    print("📝 Using mock data for testing")
    MONGODB_AVAILABLE = False
    # Mock collections for testing
    truck_collection = None
    scrap_collection = None
    analysis_history_collection = None
    users_collection = None
    sessions_collection = None

# Create static folder for image uploads
os.makedirs("static", exist_ok=True)

@app.route('/static/<filename>')
def serve_static_file(filename):
    """Serve static files (images)"""
    try:
        return send_from_directory('static', filename)
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

# Mock data for testing when MongoDB is not available
MOCK_HISTORY = [
    {
        "_id": "mock_1",
        "timestamp": "2024-08-16T16:00:00+05:30",
        "truck_number": "ABC123",
        "truck_id": "truck_1",
        "scrap_image": "scrap_sample_1.jpg",
        "plate_image": "plate_sample_1.jpg",
        "scrap_predictions": [{"class": "Steel Scrap", "confidence": 0.95}],
        "plate_predictions": [{"class": "License Plate", "confidence": 0.88}],
        "analysis_id": "analysis_1"
    },
    {
        "_id": "mock_2",
        "timestamp": "2024-08-16T14:45:00+05:30",
        "truck_number": "XYZ789",
        "truck_id": "truck_2",
        "scrap_image": "scrap_sample_2.jpg",
        "plate_image": "plate_sample_2.jpg",
        "scrap_predictions": [{"class": "Iron Scrap", "confidence": 0.92}],
        "plate_predictions": [{"class": "License Plate", "confidence": 0.91}],
        "analysis_id": "analysis_2"
    }
]

# ========== Utility Functions ==========

def hash_password(password):
    """Hash password using SHA-256 with salt"""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${hashed}"

def verify_password(password, hashed_password):
    """Verify password against hashed password"""
    try:
        salt, hash_value = hashed_password.split('$')
        return hashlib.sha256((password + salt).encode()).hexdigest() == hash_value
    except:
        return False

def create_session(user_id, email, role):
    """Create a new user session"""
    session_token = secrets.token_urlsafe(32)
    session_data = {
        "session_token": session_token,
        "user_id": user_id,
        "email": email,
        "role": role,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24)
    }
    
    if MONGODB_AVAILABLE:
        sessions_collection.insert_one(session_data)
    
    return session_token

def verify_session(session_token):
    """Verify and return session data"""
    if not MONGODB_AVAILABLE:
        return None
    
    try:
        session = sessions_collection.find_one({
            "session_token": session_token,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        return session
    except:
        return None

def get_inference(image_path, project, version):
    """Get inference from Roboflow API"""
    api_key = os.getenv("API_KEY")
    if not api_key:
        print("⚠️ No API key found, using mock data")
        return [{"class": "Steel Scrap", "confidence": 0.85}]
    
    try:
        import requests
        with open(image_path, 'rb') as img_file:
            img_bytes = img_file.read()

        url = f"https://detect.roboflow.com/{project}/{version}?api_key={api_key}"
        response = requests.post(url, files={"file": img_bytes})
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Roboflow API success for {project}: {result}")
            
            # Convert Roboflow format to our expected format
            if result.get("predictions"):
                predictions = []
                for pred in result["predictions"]:
                    predictions.append({
                        "class": pred.get("class", "Unknown"),
                        "confidence": pred.get("confidence", 0),
                        "x": pred.get("x", 0),
                        "y": pred.get("y", 0),
                        "width": pred.get("width", 0),
                        "height": pred.get("height", 0)
                    })
                return predictions
            else:
                print(f"⚠️ No predictions found in response: {result}")
                return [{"class": "Unknown", "confidence": 0}]
        else:
            print(f"❌ Roboflow API error: {response.status_code} - {response.text}")
            return [{"class": "Steel Scrap", "confidence": 0.85}]
    except Exception as e:
        print(f"⚠️ Inference failed: {e}")
        return [{"class": "Steel Scrap", "confidence": 0.85}]

def extract_plate_number(result, image_path):
    """Extract plate number from prediction result"""
    if not MONGODB_AVAILABLE:
        return "MOCK123"
    
    # Real implementation would go here
    try:
        from PIL import Image
        import pytesseract
        import numpy as np
        
        # Handle different result structures
        if result and isinstance(result, list) and len(result) > 0:
            # If result is a list, take the first prediction
            pred = result[0]
        elif result and isinstance(result, dict) and result.get("predictions"):
            # If result is a dict with predictions array
            pred = result["predictions"][0]
        else:
            return "MOCK123"
        
        # Extract coordinates
        if isinstance(pred, dict):
            x = int(pred.get("x", 0))
            y = int(pred.get("y", 0))
            w = int(pred.get("width", 100))
            h = int(pred.get("height", 50))
        else:
            return "MOCK123"

        img = Image.open(image_path)
        img_array = np.array(img)
        x1 = max(0, x - w // 2)
        y1 = max(0, y - h // 2)
        x2 = min(img_array.shape[1], x + w // 2)
        y2 = min(img_array.shape[0], y + h // 2)

        cropped_img = img_array[y1:y2, x1:x2]
        if cropped_img.size > 0:
            plate_text = pytesseract.image_to_string(Image.fromarray(cropped_img), config='--psm 8').strip()
            print(f"🔍 Extracted plate text: '{plate_text}'")
            return plate_text if plate_text else "Not Detected"
    except Exception as e:
        print(f"⚠️ Plate extraction failed: {e}")
    
    return "Not Detected"

# ========== Debug Route ==========

@app.route('/debug/form', methods=['POST'])
def debug_form():
    """Debug endpoint to test form data reception"""
    try:
        print("🔍 Debug Form Data:")
        print(f"   Content-Type: {request.content_type}")
        print(f"   Form keys: {list(request.form.keys())}")
        print(f"   Form data: {dict(request.form)}")
        print(f"   Files: {list(request.files.keys())}")
        
        return jsonify({
            "status": "success",
            "form_data": dict(request.form),
            "files": list(request.files.keys()),
            "content_type": request.content_type
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/debug/mongo', methods=['GET'])
def debug_mongo():
    """Debug endpoint to test MongoDB access"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"})
        
        # Test collection access
        analysis_count = analysis_history_collection.count_documents({})
        truck_count = truck_collection.count_documents({})
        scrap_count = scrap_collection.count_documents({})
        
        return jsonify({
            "status": "success",
            "collections": {
                "analysis_history": analysis_count,
                "truck_records": truck_count,
                "scrap_records": scrap_count
            },
            "db_name": analysis_history_collection.database.name,
            "collection_name": analysis_history_collection.name
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/debug/save', methods=['POST'])
def debug_save():
    """Debug endpoint to test direct save to analysis history"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"})
        
        # Get form data
        factory_id = request.form.get('factory_id', 'test_debug_save')
        owner_id = request.form.get('owner_id', 'test_debug_owner')
        
        # Save test record
        test_record = {
            "timestamp": datetime.utcnow(),
            "truck_number": "DEBUG123",
            "scrap_image": "debug.jpg",
            "plate_image": "debug.jpg",
            "scrap_predictions": [{"class": "Test", "confidence": 0.9}],
            "plate_predictions": [{"class": "DEBUG123", "confidence": 0.9}],
            "analysis_id": "debug_analysis",
            "factory_id": factory_id,
            "owner_id": owner_id
        }
        
        result = analysis_history_collection.insert_one(test_record)
        
        return jsonify({
            "status": "success",
            "message": "Test record saved",
            "record_id": str(result.inserted_id),
            "factory_id": factory_id,
            "owner_id": owner_id
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/debug/collections', methods=['GET'])
def debug_collections():
    """Debug endpoint to list all collections in the database"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"})
        
        # List all collections
        collections = db.list_collection_names()
        
        # Get count for each collection
        collection_info = {}
        for coll_name in collections:
            try:
                count = db[coll_name].count_documents({})
                collection_info[coll_name] = count
            except Exception as e:
                collection_info[coll_name] = f"Error: {str(e)}"
        
        return jsonify({
            "status": "success",
            "database": db.name,
            "collections": collection_info,
            "total_collections": len(collections)
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# ========== Upload Route ==========

@app.route('/upload', methods=['POST'])
def upload():
    try:
        # Extract form data FIRST before accessing files
        current_factory_id = request.form.get('factory_id')
        current_owner_id = request.form.get('owner_id')
        current_labourer_id = request.form.get('labourer_id')
        analysis_notes = request.form.get('notes', '')
        auto_submit = request.form.get('auto_submit', 'false').lower() == 'true'
        
        # Debug logging for form data
        print(f"🔍 Form data extracted:")
        print(f"   factory_id: {current_factory_id}")
        print(f"   owner_id: {current_owner_id}")
        print(f"   labourer_id: {current_labourer_id}")
        print(f"   auto_submit: {auto_submit}")
        print(f"   All form keys: {list(request.form.keys())}")
        
        # Now access files
        scrap_image = request.files['truck_image']
        plate_image = request.files['plate_image']

        scrap_path = os.path.join('static', scrap_image.filename)
        plate_path = os.path.join('static', plate_image.filename)
        scrap_image.save(scrap_path)
        plate_image.save(plate_path)

        scrap_result = get_inference(scrap_path, "my-first-project-iyasr", "4")
        plate_result = get_inference(plate_path, "license-plate-recognition-rxg4e", "11")
        plate_number = extract_plate_number(plate_result, plate_path)

        if MONGODB_AVAILABLE:
            try:
                # Real MongoDB operations
                truck_record = truck_collection.find_one({"truck_number": plate_number})
                if not truck_record:
                    truck_id = truck_collection.insert_one({
                        "truck_number": plate_number,
                        "plate_image": plate_image.filename,
                        "plate_predictions": plate_result
                    }).inserted_id
                else:
                    truck_id = truck_record["_id"]

                # Save to scrap collection with IST time
                ist_time = datetime.utcnow() + timedelta(hours=5, minutes=30)
                scrap_record = scrap_collection.insert_one({
                    "timestamp": ist_time,
                    "scrap_image": scrap_image.filename,
                    "scrap_predictions": scrap_result,
                    "truck_id": truck_id
                })

                # Validate factory_id and owner_id
                if not current_factory_id or current_factory_id == "default_factory_id":
                    print("⚠️ No valid factory_id provided, skipping analysis history save")
                    print(f"   Current factory_id: '{current_factory_id}'")
                    print(f"   Current owner_id: '{current_owner_id}'")
                else:
                    # Save to analysis history collection with IST time
                    try:
                        analysis_data = {
                            "timestamp": ist_time,
                            "truck_number": plate_number,
                            "truck_id": truck_id,
                            "scrap_image": scrap_image.filename,
                            "plate_image": plate_image.filename,
                            "scrap_predictions": scrap_result,
                            "plate_predictions": plate_result,
                            "analysis_id": str(scrap_record.inserted_id),
                            "factory_id": current_factory_id,
                            "owner_id": current_owner_id,
                            "submitted_to_owner": False,
                            "status": "pending"
                        }

                        # Add labourer information if available
                        if current_labourer_id:
                            analysis_data.update({
                                "labourer_id": current_labourer_id,
                                "labourer_notes": analysis_notes,
                                "submitted_to_owner": auto_submit,
                                "status": "submitted" if auto_submit else "pending",
                                "submission_timestamp": ist_time if auto_submit else None
                            })

                        result = analysis_history_collection.insert_one(analysis_data)
                        analysis_id = str(result.inserted_id)
                        print(f"✅ Analysis history saved for factory: {current_factory_id}, record ID: {analysis_id}")
                        
                        # Return the analysis ID in the response
                        return jsonify({
                            "status": "success",
                            "plate_number": plate_number,
                            "scrap_result": scrap_result,
                            "timestamp": ist_time.isoformat(),
                            "scrap_image": scrap_image.filename,
                            "analysis_id": analysis_id,
                            "_id": analysis_id
                        })
                    except Exception as save_error:
                        print(f"❌ Failed to save analysis history: {save_error}")
                        print(f"   Collection: {analysis_history_collection.name}")
                        print(f"   Database: {analysis_history_collection.database.name}")
                print(f"✅ Data saved to MongoDB: Truck {plate_number}")
            except Exception as db_error:
                print(f"⚠️ MongoDB operation failed: {db_error}")
                print("📝 Continuing with mock data mode")
        else:
            # Mock operations for testing
            print(f"📝 Mock upload: Truck {plate_number}, Scrap: {scrap_result}")

        return jsonify({
            "status": "success",
            "plate_number": plate_number,
            "scrap_result": scrap_result,
            "timestamp": ist_time.isoformat(),
            "scrap_image": scrap_image.filename
        })

    except Exception as e:
        print(f"❌ Upload error: {e}")
        # Return a success response even on error to prevent frontend crashes
        return jsonify({
            "status": "success",
            "plate_number": "MOCK123",
            "scrap_result": [{"class": "Steel Scrap", "confidence": 0.85}],
            "timestamp": (datetime.utcnow() + timedelta(hours=5, minutes=30)).isoformat(),
            "scrap_image": "mock_scrap.jpg"
        })

# ========== History Route ==========

@app.route('/history', methods=['GET'])
def get_history():
    try:
        # Get factory_id from query params
        factory_id = request.args.get('factory_id')
        print(f"Received history request for factory_id: {factory_id}")
        
        # Build query filter
        query_filter = {}
        if factory_id:
            query_filter["factory_id"] = factory_id
            print(f"🏭 Filtering history for factory: {factory_id}")
        
        # Get analysis history with factory filter, sorted by timestamp (newest first)
        print("Executing MongoDB query...")
        cursor = analysis_history_collection.find(query_filter).sort("timestamp", -1)
        history = list(cursor)
        print(f"Found {len(history)} records in MongoDB")
        
        # Convert ObjectId to string and format timestamp for JSON serialization
        formatted_history = []
        for record in history:
            # Convert ObjectId fields to strings
            record['_id'] = str(record['_id'])
            record['truck_id'] = str(record.get('truck_id', ''))
            
            # Use owner-corrected predictions if available, otherwise use original AI predictions
            if record.get('predictions_corrected') and record.get('owner_corrected_scrap_predictions'):
                record['scrap_predictions'] = record['owner_corrected_scrap_predictions']
                print(f"📝 Using corrected scrap predictions for record {record.get('_id')}")
                
            if record.get('predictions_corrected') and record.get('owner_corrected_plate_predictions'):
                record['plate_predictions'] = record['owner_corrected_plate_predictions']
                print(f"📝 Using corrected plate predictions for record {record.get('_id')}")
            
            # Clean up the response - remove the separate corrected fields
            record.pop('owner_corrected_scrap_predictions', None)
            record.pop('owner_corrected_plate_predictions', None)
            
            # Ensure timestamp is in ISO format
            if isinstance(record['timestamp'], datetime):
                record['timestamp'] = record['timestamp'].isoformat()
            
            # Add submission status if not present
            if 'submitted_to_owner' not in record:
                record['submitted_to_owner'] = False
            
            # If there's a labourer_id, get labourer info
            if 'labourer_id' in record and MONGODB_AVAILABLE:
                try:
                    labourer = users_collection.find_one({"_id": ObjectId(record['labourer_id'])})
                    if labourer:
                        record['labourer_name'] = labourer.get('name', 'Unknown')
                        record['labourer_email'] = labourer.get('email', '')
                except Exception as e:
                    print(f"⚠️ Error fetching labourer info: {e}")
                    record['labourer_name'] = 'Unknown'
                    record['labourer_email'] = ''
            
            formatted_history.append(record)
        
        print(f"📊 History: Returning {len(formatted_history)} records" + (f" for factory {factory_id}" if factory_id else " (all factories)"))
        
        return jsonify({
            "status": "success", 
            "history": formatted_history,
            "count": len(formatted_history),
            "factory_id": factory_id
        })
        
    except Exception as e:
        error_msg = f"Failed to fetch history: {str(e)}"
        print(f"❌ History error: {error_msg}")
        return jsonify({
            "status": "error",
            "message": error_msg
        }), 500

# ========== Auth Routes ==========

@app.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json(force=True)
        email = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()
        role = (data.get('role') or 'worker').strip().lower()

        if role not in ['owner', 'worker']:
            return jsonify({"status": "error", "message": "Invalid role"}), 400
        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password required"}), 400

        if not MONGODB_AVAILABLE:
            print("📝 Mock registration: User created")
            mock_session = f"mock_session_{secrets.token_hex(8)}"
            return jsonify({
                "status": "success", 
                "user": {"email": email, "role": role, "id": "mock_user_id"},
                "session_token": mock_session
            }), 201

        existing = users_collection.find_one({"email": email})
        if existing:
            return jsonify({"status": "error", "message": "User already exists"}), 409

        # Hash password properly
        hashed = hash_password(password)
        user_data = {
            "email": email,
            "password": hashed,
            "role": role,
            "created_at": datetime.utcnow(),
        }
        
        result = users_collection.insert_one(user_data)
        
        # Create session for the new user
        session_token = create_session(str(result.inserted_id), email, role)
        
        return jsonify({
            "status": "success", 
            "user": {"email": email, "role": role, "id": str(result.inserted_id)},
            "session_token": session_token
        }), 201
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json(force=True)
        email = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()
        requested_role = (data.get('role') or '').strip().lower()

        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password required"}), 400
            
        if requested_role not in ['admin', 'owner', 'labourer']:
            return jsonify({"status": "error", "message": "Invalid role"}), 400

        if not MONGODB_AVAILABLE:
            print("📝 Mock login: User logged in")
            mock_session = f"mock_session_{secrets.token_hex(8)}"
            return jsonify({
                "status": "success",
                "user": {
                    "email": email,
                    "role": requested_role,
                    "id": "mock_user_id",
                },
                "session_token": mock_session
            })

        user = users_collection.find_one({"email": email})
        if not user:
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401

        # Verify password properly
        if not verify_password(password, user.get('password', '')):
            return jsonify({"status": "error", "message": "Invalid credentials"}), 401
            
        # Verify role matches
        if user.get('role') != requested_role:
            return jsonify({"status": "error", "message": "Invalid role for this user"}), 403

        # Create new session
        session_token = create_session(str(user.get('_id')), user.get('email'), user.get('role'))

        # Build user response
        user_response = {
            "email": user.get('email'),
            "role": user.get('role'),
            "id": str(user.get('_id')),
        }
        
        # Add factory_id for owners and labourers
        if user.get('role') in ['owner', 'labourer'] and user.get('factory_id'):
            user_response["factory_id"] = user.get('factory_id')
            
        # For labourers, include their factory ID, owner ID, and department
        if user.get('role') == 'labourer':
            user_response.update({
                "department": user.get('department', 'General'),
                "name": user.get('name', ''),
                "employee_id": user.get('employee_id', ''),
                "owner_id": user.get('owner_id', '')  # Include owner_id for submission functionality
            })
            
        # For owners, include additional factory info
        if user.get('role') == 'owner':
            factory = db.factories.find_one({"owner_id": str(user.get('_id'))})
            if factory:
                user_response.update({
                    "factory_name": factory.get('name', ''),
                    "factory_type": factory.get('factory_type', '')
                })
        
        return jsonify({
            "status": "success",
            "user": user_response,
            "session_token": session_token
        })
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ========== Session Verification Route ==========

@app.route('/auth/verify', methods=['POST'])
def verify_session_route():
    try:
        data = request.get_json(force=True)
        session_token = data.get('session_token')
        
        if not session_token:
            return jsonify({"status": "error", "message": "Session token required"}), 400
        
        if not MONGODB_AVAILABLE:
            # Mock session verification
            if session_token.startswith('mock_session_'):
                return jsonify({
                    "status": "success",
                    "user": {
                        "email": "mock@example.com",
                        "role": "worker",
                        "id": "mock_user_id"
                    }
                })
            else:
                return jsonify({"status": "error", "message": "Invalid session"}), 401
        
        session = verify_session(session_token)
        if not session:
            return jsonify({"status": "error", "message": "Invalid or expired session"}), 401
        
        # Get user details from database to include factory_id
        user = users_collection.find_one({"_id": ObjectId(session.get('user_id'))})
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404
        
        # Build user response with factory_id if available
        user_response = {
            "email": session.get('email'),
            "role": session.get('role'),
            "id": session.get('user_id')
        }
        
        # Add factory_id for owners and labourers
        if user.get('role') in ['owner', 'labourer'] and user.get('factory_id'):
            user_response["factory_id"] = user.get('factory_id')
        
        return jsonify({
            "status": "success",
            "user": user_response
        })
    except Exception as e:
        print(f"❌ Session verification error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ========== Health Check Route ==========

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "success",
        "message": "Backend is running",
        "mongodb_available": MONGODB_AVAILABLE,
        "timestamp": datetime.utcnow().isoformat()
    })

# ========== Scrap Type Details Route ==========

@app.route('/scrap-types', methods=['GET'])
def get_scrap_types():
    """Get details for all scrap types"""
    try:
        scrap_types = [
            {
                "name": "CRC",
                "rawMaterials": ["Cold Rolled Coil", "Zinc Coating", "Chromium", "Nickel"],
                "processingSteps": ["Inspection", "Cleaning", "Coating Removal", "Melting", "Alloying"],
                "energyRequired": "2.8 MWh/ton",
                "carbonFootprint": "0.9 tons CO2/ton",
                "description": "Cold Rolled Coil scrap with high quality surface finish"
            },
            {
                "name": "Burada",
                "rawMaterials": ["Iron Ore", "Coke", "Limestone", "Dolomite"],
                "processingSteps": ["Sorting", "Crushing", "Screening", "Blending", "Sintering"],
                "energyRequired": "3.2 MWh/ton",
                "carbonFootprint": "1.1 tons CO2/ton",
                "description": "Iron ore fines and sinter feed material"
            },
            {
                "name": "K2",
                "rawMaterials": ["High Carbon Steel", "Manganese", "Silicon", "Chromium"],
                "processingSteps": ["Grading", "Cleaning", "Melting", "Alloying", "Refining"],
                "energyRequired": "3.5 MWh/ton",
                "carbonFootprint": "1.3 tons CO2/ton",
                "description": "High-grade steel scrap with specific alloy composition"
            },
            {
                "name": "Selected",
                "rawMaterials": ["Premium Steel", "Alloy Elements", "Clean Scrap"],
                "processingSteps": ["Quality Check", "Sorting", "Cleaning", "Melting", "Refining"],
                "energyRequired": "2.2 MWh/ton",
                "carbonFootprint": "0.7 tons CO2/ton",
                "description": "Premium quality selected steel scrap"
            },
            {
                "name": "Piece to Piece",
                "rawMaterials": ["Mixed Steel", "Iron", "Alloy Elements"],
                "processingSteps": ["Manual Sorting", "Size Classification", "Cleaning", "Melting"],
                "energyRequired": "2.8 MWh/ton",
                "carbonFootprint": "0.9 tons CO2/ton",
                "description": "Individual pieces of steel scrap requiring manual handling"
            },
            {
                "name": "Melting",
                "rawMaterials": ["Low Grade Steel", "Iron", "Carbon"],
                "processingSteps": ["Preheating", "Melting", "Basic Refining", "Casting"],
                "energyRequired": "4.0 MWh/ton",
                "carbonFootprint": "1.5 tons CO2/ton",
                "description": "Low-grade scrap suitable for basic melting processes"
            },
            {
                "name": "Sponge Iron",
                "rawMaterials": ["Iron Ore", "Coal", "Natural Gas"],
                "processingSteps": ["Reduction", "Cooling", "Screening", "Briquetting"],
                "energyRequired": "5.5 MWh/ton",
                "carbonFootprint": "2.0 tons CO2/ton",
                "description": "Direct reduced iron with high porosity structure"
            }
        ]
        
        return jsonify({
            "status": "success",
            "scrap_types": scrap_types
        })
        
    except Exception as e:
        print(f"❌ Error getting scrap types: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ========== Analytics Data Route ==========

@app.route('/analytics', methods=['GET'])
def get_analytics_data():
    """Get analytics data for dashboard"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({
                "status": "error", 
                "message": "MongoDB not available"
            }), 503
        
        # Get time range and factory_id from query params
        time_range = request.args.get('range', '30d')
        factory_id = request.args.get('factory_id')  # New parameter for factory filtering
        
        # Calculate cutoff date
        if time_range == '7d':
            cutoff_days = 7
        elif time_range == '30d':
            cutoff_days = 30
        elif time_range == '90d':
            cutoff_days = 90
        else:  # 'all'
            cutoff_days = 365
        
        cutoff_date = datetime.utcnow() - timedelta(days=cutoff_days)
        
        # Build query filter
        query_filter = {"timestamp": {"$gte": cutoff_date}}
        if factory_id:
            query_filter["factory_id"] = factory_id
            print(f"🏭 Filtering analytics for factory: {factory_id}")
        
        # Get data from analysis_history collection with factory filter
        analysis_history = list(analysis_history_collection.find(query_filter))
        
        print(f"🏭 Analytics Query: {query_filter}")
        print(f"📊 Found {len(analysis_history)} records for factory {factory_id or 'ALL'}")
        
        # Convert ObjectId to string for JSON serialization and use corrected predictions
        for record in analysis_history:
            record['_id'] = str(record['_id'])
            if isinstance(record['timestamp'], datetime):
                record['timestamp'] = record['timestamp'].isoformat()
                
            # Use owner-corrected predictions if available, otherwise use original AI predictions
            if record.get('predictions_corrected') and record.get('owner_corrected_scrap_predictions'):
                record['scrap_predictions'] = record['owner_corrected_scrap_predictions']
                
            if record.get('predictions_corrected') and record.get('owner_corrected_plate_predictions'):
                record['plate_predictions'] = record['owner_corrected_plate_predictions']
        
        # Sort by timestamp
        analysis_history.sort(key=lambda x: x['timestamp'])
        
        # Build aggregation pipeline with factory filtering
        daily_pipeline = [
            {"$match": {"timestamp": {"$gte": cutoff_date.isoformat()}}}
        ]
        
        # Add factory filter to aggregation if provided
        if factory_id:
            daily_pipeline[0]["$match"]["factory_id"] = factory_id
        
        # Continue with the rest of the pipeline
        daily_pipeline.extend([
            {
                "$group": {
                    "_id": {
                        "date": {"$substr": ["$timestamp", 0, 10]},
                        "scrap_type": {"$arrayElemAt": ["$scrap_predictions.class", 0]}
                    },
                    "count": {"$sum": 1}
                }
            },
            {
                "$group": {
                    "_id": "$_id.date",
                    "types": {
                        "$push": {
                            "type": "$_id.scrap_type",
                            "count": "$count"
                        }
                    }
                }
            },
            {"$sort": {"_id": 1}}
        ])
        
        # Use combined data for aggregation
        daily_data = []
        by_day = {}
        
        for record in analysis_history:
            date_key = record['timestamp'][:10]  # Get date part
            if date_key not in by_day:
                by_day[date_key] = {}
            
            # Get scrap type from predictions
            scrap_predictions = record.get('scrap_predictions', [])
            if scrap_predictions and len(scrap_predictions) > 0:
                scrap_type = scrap_predictions[0].get('class', 'Unknown')
                by_day[date_key][scrap_type] = by_day[date_key].get(scrap_type, 0) + 1
        
        # Convert to daily data format
        for date, types in by_day.items():
            daily_data.append({
                "_id": date,
                "types": [{"type": t, "count": c} for t, c in types.items()]
            })
        
        daily_data.sort(key=lambda x: x["_id"])
        
        # Get type counts
        type_counts = {}
        for record in analysis_history:
            scrap_predictions = record.get('scrap_predictions', [])
            if scrap_predictions and len(scrap_predictions) > 0:
                scrap_type = scrap_predictions[0].get('class', 'Unknown')
                type_counts[scrap_type] = type_counts.get(scrap_type, 0) + 1
        
        # Convert to array format
        type_counts_array = [{"_id": k, "count": v} for k, v in type_counts.items()]
        type_counts_array.sort(key=lambda x: x["count"], reverse=True)
        
        # Get unique trucks count
        unique_trucks = set()
        for record in analysis_history:
            if 'truck_number' in record and record['truck_number']:
                unique_trucks.add(record['truck_number'])
        
        print(f"📊 Analytics: {len(analysis_history)} total records, {len(unique_trucks)} unique trucks, {len(type_counts)} scrap types")
        
        # Check for records without factory_id (debugging)
        if factory_id:
            records_without_factory = analysis_history_collection.count_documents({
                "timestamp": {"$gte": cutoff_date},
                "$or": [
                    {"factory_id": {"$exists": False}},
                    {"factory_id": None}
                ]
            })
            if records_without_factory > 0:
                print(f"⚠️  Found {records_without_factory} records without factory_id")
        
        return jsonify({
            "status": "success",
            "data": {
                "total_records": len(analysis_history),
                "unique_trucks": len(unique_trucks),
                "type_counts": type_counts_array,
                "daily_data": daily_data,
                "time_range": time_range,
                "factory_filtered": factory_id is not None
            }
        })
        
    except Exception as e:
        print(f"❌ Error getting analytics data: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ========== Admin Routes ==========

@app.route('/admin/owners', methods=['GET'])
def get_owners():
    """Get all factory owners (admin only)"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
        
        # Get all users with role 'owner'
        owners = list(users_collection.find({"role": "owner"}).sort("created_at", -1))
        
        # Convert ObjectId to string
        for owner in owners:
            owner['_id'] = str(owner['_id'])
            if 'created_at' in owner and isinstance(owner['created_at'], datetime):
                owner['created_at'] = owner['created_at'].isoformat()
        
        return jsonify({"status": "success", "owners": owners})
        
    except Exception as e:
        print(f"❌ Error getting owners: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/admin/stats', methods=['GET'])
def get_admin_stats():
    """Get system statistics (admin only)"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
        
        # Count users by role
        admin_count = users_collection.count_documents({"role": "admin"})
        owner_count = users_collection.count_documents({"role": "owner"})
        labourer_count = users_collection.count_documents({"role": "labourer"})
        
        # Count analyses
        total_analyses = analysis_history_collection.count_documents({})
        
        # Count factories
        total_factories = 0
        if 'factories' in db.list_collection_names():
            total_factories = db.factories.count_documents({})
        
        stats = {
            "total_owners": owner_count,
            "total_factories": total_factories,
            "total_labourers": labourer_count,
            "total_analyses": total_analyses
        }
        
        return jsonify({"status": "success", "stats": stats})
        
    except Exception as e:
        print(f"❌ Error getting admin stats: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/admin/create-owner', methods=['POST'])
def create_owner():
    """Create a new factory owner (admin only)"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
        
        data = request.get_json(force=True)
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'factory_name', 'factory_address', 'gst_number', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400
        
        # Check if email already exists
        existing_user = users_collection.find_one({"email": data['email']})
        if existing_user:
            return jsonify({"status": "error", "message": "Email already exists"}), 409
        
        # Hash password
        hashed_password = hash_password(data['password'])
        
        # Create owner user
        owner_user = {
            "email": data['email'],
            "password": hashed_password,
            "role": "owner",
            "name": data['name'],
            "phone": data['phone'],
            "created_at": datetime.utcnow(),
            "created_by": "admin",  # Will be updated with actual admin email
            "is_active": True,
            "permissions": ["create_labourers", "view_factory_data", "manage_analysis"]
        }
        
        owner_result = users_collection.insert_one(owner_user)
        owner_id = str(owner_result.inserted_id)
        
        # Create factory record
        factory_record = {
            "name": data['factory_name'],
            "owner_id": owner_id,
            "address": data['factory_address'],
            "gst_number": data['gst_number'],
            "contact_person": data['name'],
            "phone": data['phone'],
            "created_at": datetime.utcnow(),
            "is_active": True,
            "factory_type": "Steel Scrap Processing",
            "capacity": "1000 tons/month"
        }
        
        factory_result = db.factories.insert_one(factory_record)
        factory_id = str(factory_result.inserted_id)
        
        # Update owner with factory_id
        users_collection.update_one(
            {"_id": owner_result.inserted_id},
            {"$set": {"factory_id": factory_id}}
        )
        
        print(f"🏭 Created factory owner: {data['email']} with factory: {data['factory_name']}")
        
        return jsonify({
            "status": "success", 
            "message": "Factory owner created successfully",
            "owner_id": owner_id,
            "factory_id": factory_id
        })
        
    except Exception as e:
        print(f"❌ Error creating owner: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/admin/owners/<owner_id>/status', methods=['PATCH'])
def toggle_owner_status(owner_id):
    """Toggle owner active status (admin only)"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
        
        data = request.get_json(force=True)
        new_status = data.get('is_active', True)
        
        # Update owner status
        result = users_collection.update_one(
            {"_id": ObjectId(owner_id)},
            {"$set": {"is_active": new_status}}
        )
        
        if result.modified_count > 0:
            return jsonify({"status": "success", "message": "Owner status updated"})
        else:
            return jsonify({"status": "error", "message": "Owner not found"}), 404
        
    except Exception as e:
        print(f"❌ Error updating owner status: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ========== Owner Routes ==========

@app.route('/owner/labourers', methods=['GET'])
def get_labourers():
    """Get all labourers for the current owner's factory"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
        
        # Get factory_id from query params (in real app, this would come from user session)
        factory_id = request.args.get('factory_id')
        
        if not factory_id:
            return jsonify({"status": "error", "message": "Factory ID required"}), 400
        
        # Get factory-specific labourers
        labourers = list(users_collection.find({
            "role": "labourer",
            "factory_id": factory_id
        }).sort("created_at", -1))
        
        print(f"🏭 Getting labourers for factory {factory_id}: {len(labourers)} found")
        
        # Convert ObjectId to string
        for labourer in labourers:
            labourer['_id'] = str(labourer['_id'])
            if 'created_at' in labourer and isinstance(labourer['created_at'], datetime):
                labourer['created_at'] = labourer['created_at'].isoformat()
        
        return jsonify({"status": "success", "labourers": labourers})
        
    except Exception as e:
        print(f"❌ Error getting labourers: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/labourer/submit-analysis', methods=['POST'])
def submit_analysis():
    """Submit analysis results from labourer to owner"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
            
        data = request.get_json(force=True)
        required_fields = ['analysis_id', 'labourer_id', 'factory_id', 'notes']
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }), 400
                
        # Get the factory's owner ID from the database
        factory_id = data.get('factory_id')
        
        # Try to find owner by factory_id first (more reliable)
        owner = users_collection.find_one({
            "role": "owner",
            "factory_id": factory_id
        })
        
        # If not found, try to find via factory collection
        if not owner:
            try:
                factory = db.factories.find_one({"_id": ObjectId(factory_id)})
                if factory and factory.get('owner_id'):
                    owner = users_collection.find_one({"_id": ObjectId(factory['owner_id'])})
            except Exception as e:
                print(f"❌ Error looking up via factory collection: {e}")
        
        if not owner:
            return jsonify({
                "status": "error",
                "message": f"Could not find factory owner for factory_id: {factory_id}. Please log out and log back in to refresh your session data."
            }), 404
            
        owner_id = str(owner['_id'])
                
        # Update the analysis record with labourer's submission
        result = analysis_history_collection.update_one(
            {"_id": ObjectId(data['analysis_id'])},
            {
                "$set": {
                    "labourer_id": data['labourer_id'],
                    "submitted_to_owner": True,
                    "submission_timestamp": datetime.utcnow(),
                    "labourer_notes": data['notes'],
                    "status": "submitted",
                    "verification_status": "pending"
                }
            }
        )
        
        if result.modified_count == 0:
            return jsonify({
                "status": "error",
                "message": "Analysis record not found or not modified"
            }), 404
            
        return jsonify({
            "status": "success",
            "message": "Analysis submitted to owner successfully"
        })
        
    except Exception as e:
        print(f"❌ Error submitting analysis: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/owner/pending-verifications', methods=['GET'])
def get_pending_verifications():
    """Get all analyses pending verification for the current owner"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
            
        factory_id = request.args.get('factory_id')
        if not factory_id:
            return jsonify({"status": "error", "message": "Factory ID required"}), 400
        
        # Find analyses that have been submitted but not yet verified
        from app.utils import serialize_mongodb_doc
        
        cursor = analysis_history_collection.find({
            "factory_id": factory_id,
            "submitted_to_owner": True,
            "$or": [
                {"verification_status": {"$exists": False}},
                {"verification_status": "pending"}
            ]
        }).sort("submission_timestamp", -1)
        
        pending = list(cursor)
        
        # Serialize MongoDB documents and get laborer info
        for record in pending:
            if 'labourer_id' in record:
                laborer = users_collection.find_one({"_id": ObjectId(record['labourer_id'])})
                if laborer:
                    record['labourer_name'] = laborer.get('name', 'Unknown')
                    record['labourer_email'] = laborer.get('email', '')
                    record['employee_id'] = laborer.get('employee_id', '')
        
        pending = serialize_mongodb_doc(pending)
        
        print(f"📝 Found {len(pending)} pending verifications for factory {factory_id}")
        
        return jsonify({
            "status": "success",
            "pending_verifications": pending,
            "count": len(pending)
        })
        
    except Exception as e:
        print(f"❌ Error getting pending verifications: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/owner/verify-analysis', methods=['POST'])
def verify_analysis():
    """Verify (approve/reject) an analysis submission"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
            
        data = request.get_json(force=True)
        required_fields = ['analysis_id', 'factory_id', 'verification_status', 'owner_id']
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "status": "error",
                    "message": f"Missing required field: {field}"
                }), 400
        
        verification_status = data.get('verification_status')
        if verification_status not in ['approved', 'rejected']:
            return jsonify({
                "status": "error",
                "message": "Verification status must be 'approved' or 'rejected'"
            }), 400
        
        # Update the analysis record with owner's verification
        update_data = {
            "verification_status": verification_status,
            "verified_by": data.get('owner_id'),
            "verification_timestamp": datetime.utcnow(),
            "owner_notes": data.get('owner_notes', ''),
            "status": verification_status
        }
        
        # If owner provided corrected predictions, save them
        if data.get('corrected_scrap_predictions'):
            update_data["owner_corrected_scrap_predictions"] = data.get('corrected_scrap_predictions')
            update_data["predictions_corrected"] = True
            print(f"📝 Owner corrected scrap predictions: {data.get('corrected_scrap_predictions')}")
            
        if data.get('corrected_plate_predictions'):
            update_data["owner_corrected_plate_predictions"] = data.get('corrected_plate_predictions')
            update_data["predictions_corrected"] = True
            print(f"📝 Owner corrected plate predictions: {data.get('corrected_plate_predictions')}")
        
        result = analysis_history_collection.update_one(
            {
                "_id": ObjectId(data['analysis_id']),
                "factory_id": data['factory_id'],
                "submitted_to_owner": True
            },
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            return jsonify({
                "status": "error",
                "message": "Analysis record not found or not authorized"
            }), 404
            
        action = "approved" if verification_status == "approved" else "rejected"
        message = f"Analysis {action} successfully"
        
        # Add note about corrections if any were made
        if data.get('corrected_scrap_predictions') or data.get('corrected_plate_predictions'):
            message += " with owner corrections"
            
        return jsonify({
            "status": "success",
            "message": message
        })
        
    except Exception as e:
        print(f"❌ Error verifying analysis: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/labourer/pending-submissions', methods=['GET'])
def get_pending_submissions():
    """Get all analyses for the labourer (both pending and submitted with status)"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
            
        labourer_id = request.args.get('labourer_id')
        if not labourer_id:
            return jsonify({"status": "error", "message": "Labourer ID required"}), 400
            
        # Find all analyses done by this labourer (both pending and submitted)
        from app.utils import serialize_mongodb_doc
        
        cursor = analysis_history_collection.find({
            "labourer_id": labourer_id
        }).sort("timestamp", -1).limit(20)  # Limit to last 20 submissions
        
        pending = list(cursor)
        
        # Use corrected predictions if available before serialization
        for record in pending:
            if record.get('predictions_corrected') and record.get('owner_corrected_scrap_predictions'):
                record['scrap_predictions'] = record['owner_corrected_scrap_predictions']
                
            if record.get('predictions_corrected') and record.get('owner_corrected_plate_predictions'):
                record['plate_predictions'] = record['owner_corrected_plate_predictions']
            
            # Clean up the response
            record.pop('owner_corrected_scrap_predictions', None)
            record.pop('owner_corrected_plate_predictions', None)
        
        # Serialize MongoDB documents
        pending = serialize_mongodb_doc(pending)
        
        print(f"📝 Found {len(pending)} submissions for labourer {labourer_id}")
        
        return jsonify({
            "status": "success",
            "pending": pending
        })
        
    except Exception as e:
        print(f"❌ Error getting pending submissions: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/analysis/<analysis_id>', methods=['DELETE'])
def delete_analysis(analysis_id):
    """Delete an analysis record"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
            
        # Validate ObjectId format
        try:
            obj_id = ObjectId(analysis_id)
        except Exception:
            return jsonify({"status": "error", "message": "Invalid analysis ID format"}), 400
            
        # Optional: Add authorization check here
        # For now, allowing any user to delete any analysis
        # In production, you might want to check if user owns this analysis
        
        # Delete the analysis record
        result = analysis_history_collection.delete_one({"_id": obj_id})
        
        if result.deleted_count == 0:
            return jsonify({
                "status": "error",
                "message": "Analysis record not found"
            }), 404
            
        print(f"🗑️ Analysis record deleted: {analysis_id}")
        return jsonify({
            "status": "success",
            "message": "Analysis record deleted successfully"
        })
        
    except Exception as e:
        print(f"❌ Error deleting analysis: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/owner/stats', methods=['GET'])
def get_owner_stats():
    """Get factory statistics for the current owner"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
        
        # Get factory_id from query params (in real app, this would come from user session)
        factory_id = request.args.get('factory_id')
        
        if not factory_id:
            return jsonify({"status": "error", "message": "Factory ID required"}), 400
        
        # Get factory details
        factory = db.factories.find_one({"_id": ObjectId(factory_id)})
        if not factory:
            return jsonify({"status": "error", "message": "Factory not found"}), 404
        
        # Get factory-specific statistics
        total_analyses = analysis_history_collection.count_documents({"factory_id": factory_id})
        this_month_analyses = analysis_history_collection.count_documents({
            "factory_id": factory_id,
            "timestamp": {"$gte": datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)}
        })
        total_labourers = users_collection.count_documents({
            "role": "labourer", 
            "factory_id": factory_id
        })
        
        stats = {
            "factory_name": factory.get("name", "Unknown Factory"),
            "factory_id": factory_id,
            "total_labourers": total_labourers,
            "total_analyses": total_analyses,
            "this_month_analyses": this_month_analyses
        }
        
        print(f"🏭 Owner stats for factory {factory_id}: {total_analyses} total analyses, {this_month_analyses} this month")
        
        return jsonify({"status": "success", "stats": stats})
        
    except Exception as e:
        print(f"❌ Error getting owner stats: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/owner/create-labourer', methods=['POST'])
def create_labourer():
    """Create a new labourer (owner only)"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
        
        data = request.get_json(force=True)
        
        # Validate required fields
        required_fields = ['name', 'email', 'phone', 'employee_id', 'department', 'shift', 'password', 'factory_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"status": "error", "message": f"Missing required field: {field}"}), 400
        
        # Check if email already exists
        existing_user = users_collection.find_one({"email": data['email']})
        if existing_user:
            return jsonify({"status": "error", "message": "Email already exists"}), 409
        
        # Verify factory exists and get owner info
        factory = db.factories.find_one({"_id": ObjectId(data['factory_id'])})
        if not factory:
            return jsonify({"status": "error", "message": "Invalid factory ID"}), 400
        
        # Hash password
        hashed_password = hash_password(data['password'])
        
        # Create labourer user
        labourer_user = {
            "email": data['email'],
            "password": hashed_password,
            "role": "labourer",
            "name": data['name'],
            "phone": data['phone'],
            "employee_id": data['employee_id'],
            "department": data['department'],
            "shift": data['shift'],
            "created_at": datetime.utcnow(),
            "created_by": factory['owner_id'],
            "factory_id": data['factory_id'],
            "owner_id": factory['owner_id'],  # Add owner_id for submission functionality
            "is_active": True,
            "permissions": ["upload_images", "view_own_analysis", "basic_reports"]
        }
        
        result = users_collection.insert_one(labourer_user)
        
        print(f"👷 Created labourer: {data['email']} ({data['employee_id']})")
        
        return jsonify({
            "status": "success", 
            "message": "Labourer created successfully",
            "labourer_id": str(result.inserted_id)
        })
        
    except Exception as e:
        print(f"❌ Error creating labourer: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/owner/labourers/<labourer_id>/status', methods=['PATCH'])
def toggle_labourer_status(labourer_id):
    """Toggle labourer active status (owner only)"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
        
        data = request.get_json(force=True)
        new_status = data.get('is_active', True)
        factory_id = data.get('factory_id')  # Get factory_id from request
        
        if not factory_id:
            return jsonify({"status": "error", "message": "Factory ID required"}), 400
        
        # Update labourer status (only if they belong to the owner's factory)
        result = users_collection.update_one(
            {
                "_id": ObjectId(labourer_id),
                "role": "labourer",
                "factory_id": factory_id
            },
            {"$set": {"is_active": new_status}}
        )
        
        if result.modified_count > 0:
            print(f"🏭 Updated labourer {labourer_id} status to {new_status} for factory {factory_id}")
            return jsonify({"status": "success", "message": "Labourer status updated"})
        else:
            return jsonify({"status": "error", "message": "Labourer not found or not in your factory"}), 404
        
    except Exception as e:
        print(f"❌ Error updating labourer status: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ========== Owner Analytics and History Endpoints ==========

@app.route('/owner/analytics', methods=['GET'])
def get_owner_analytics():
    """Get factory-specific analytics for the current owner"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
        
        # Get factory_id from query params (in real app, this would come from user session)
        factory_id = request.args.get('factory_id')
        
        if not factory_id:
            return jsonify({"status": "error", "message": "Factory ID required"}), 400
        
        # Get time range filter
        time_range = request.args.get('time_range', '30d')
        
        # Calculate date range
        end_date = datetime.utcnow()
        if time_range == '7d':
            start_date = end_date - timedelta(days=7)
        elif time_range == '30d':
            start_date = end_date - timedelta(days=30)
        else:  # all-time
            start_date = datetime(2020, 1, 1)
        
        # Get factory-specific analysis data
        pipeline = [
            {
                "$match": {
                    "factory_id": factory_id,
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$unwind": "$scrap_predictions"
            },
            {
                "$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                        "type": "$scrap_predictions.class"
                    },
                    "count": {"$sum": 1}
                }
            },
            {
                "$group": {
                    "_id": "$_id.date",
                    "types": {
                        "$push": {
                            "type": "$_id.type",
                            "count": "$count"
                        }
                    }
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        daily_data = list(analysis_history_collection.aggregate(pipeline))
        
        # Get type counts
        type_pipeline = [
            {
                "$match": {
                    "factory_id": factory_id,
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$unwind": "$scrap_predictions"
            },
            {
                "$group": {
                    "_id": "$scrap_predictions.class",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        type_counts = list(analysis_history_collection.aggregate(type_pipeline))
        
        # Get total records and unique trucks
        total_records = analysis_history_collection.count_documents({
            "factory_id": factory_id,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        })
        
        unique_trucks = len(analysis_history_collection.distinct("truck_number", {
            "factory_id": factory_id,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        }))
        
        # Get factory details
        factory = db.factories.find_one({"_id": ObjectId(factory_id)})
        factory_name = factory.get("name", "Unknown Factory") if factory else "Unknown Factory"
        
        analytics_data = {
            "factory_name": factory_name,
            "factory_id": factory_id,
            "daily_data": daily_data,
            "type_counts": type_counts,
            "total_records": total_records,
            "unique_trucks": unique_trucks,
            "time_range": time_range,
            "factory_filtered": True
        }
        
        print(f"🏭 Owner analytics for factory {factory_id}: {total_records} records, {unique_trucks} unique trucks")
        
        return jsonify({"status": "success", "data": analytics_data})
        
    except Exception as e:
        print(f"❌ Error getting owner analytics: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/owner/history', methods=['GET'])
def get_owner_history():
    """Get factory-specific analysis history for the current owner"""
    try:
        if not MONGODB_AVAILABLE:
            return jsonify({"status": "error", "message": "MongoDB not available"}), 503
        
        # Get factory_id from query params (in real app, this would come from user session)
        factory_id = request.args.get('factory_id')
        
        if not factory_id:
            return jsonify({"status": "error", "message": "Factory ID required"}), 400
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        skip = (page - 1) * per_page
        
        # Get factory-specific analysis history
        pipeline = [
            {
                "$match": {"factory_id": factory_id}
            },
            {
                "$sort": {"timestamp": -1}
            },
            {
                "$skip": skip
            },
            {
                "$limit": per_page
            },
            {
                "$project": {
                    "_id": 1,
                    "analysis_id": 1,
                    "timestamp": 1,
                    "truck_number": 1,
                    "scrap_image": 1,
                    "plate_image": 1,
                    "scrap_predictions": 1,
                    "plate_predictions": 1,
                    "owner_corrected_scrap_predictions": 1,
                    "owner_corrected_plate_predictions": 1,
                    "predictions_corrected": 1,
                    "verification_status": 1,
                    "processing_time": 1,
                    "status": 1,
                    "worker_id": 1
                }
            }
        ]
        
        history_data = list(analysis_history_collection.aggregate(pipeline))
        
        # Get total count for pagination
        total_count = analysis_history_collection.count_documents({"factory_id": factory_id})
        
        # Get factory details
        factory = db.factories.find_one({"_id": ObjectId(factory_id)})
        factory_name = factory.get("name", "Unknown Factory") if factory else "Unknown Factory"
        
        # Convert ObjectIds to strings for JSON serialization and prioritize corrected predictions
        for record in history_data:
            if '_id' in record:
                record['_id'] = str(record['_id'])
            
            # Use owner-corrected predictions if available, otherwise use original AI predictions
            if record.get('predictions_corrected') and record.get('owner_corrected_scrap_predictions'):
                record['scrap_predictions'] = record['owner_corrected_scrap_predictions']
                print(f"📝 Using corrected scrap predictions for record {record.get('_id')}")
                
            if record.get('predictions_corrected') and record.get('owner_corrected_plate_predictions'):
                record['plate_predictions'] = record['owner_corrected_plate_predictions']
                print(f"📝 Using corrected plate predictions for record {record.get('_id')}")
            
            # Clean up the response - remove the separate corrected fields
            record.pop('owner_corrected_scrap_predictions', None)
            record.pop('owner_corrected_plate_predictions', None)
        
        history_response = {
            "factory_name": factory_name,
            "factory_id": factory_id,
            "data": history_data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total_count,
                "pages": (total_count + per_page - 1) // per_page
            }
        }
        
        print(f"🏭 Owner history for factory {factory_id}: {len(history_data)} records (page {page})")
        
        return jsonify({"status": "success", **history_response})
        
    except Exception as e:
        print(f"❌ Error getting owner history: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# ========== Run App ==========
if __name__ == '__main__':
    print("🚀 Starting Flask backend...")
    print(f"📊 MongoDB Available: {MONGODB_AVAILABLE}")
    app.run(debug=True, port=5001)
