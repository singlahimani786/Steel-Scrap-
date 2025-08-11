from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from pymongo import MongoClient
from PIL import Image
import pytesseract
import numpy as np
import os
import smtplib
from email.message import EmailMessage
import requests
import certifi
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ========== Setup ==========
app = Flask(__name__)
CORS(app)

# MongoDB connection
client = MongoClient(os.getenv("MONGO_URI"), tlsCAFile=certifi.where())
db = client["steel_scrap_db"]
truck_collection = db["truck_records"]
scrap_collection = db["scrap_records"]

# Create static folder for image uploads
os.makedirs("static", exist_ok=True)

# ========== Utility Functions ==========

def get_inference(image_path, project, version):
    api_key = os.getenv("API_KEY")
    with open(image_path, 'rb') as img_file:
        img_bytes = img_file.read()

    url = f"https://detect.roboflow.com/{project}/{version}?api_key={api_key}"
    response = requests.post(url, files={"file": img_bytes})
    return response.json() if response.status_code == 200 else None

def extract_plate_number(result, image_path):
    if result and result.get("predictions"):
        pred = result["predictions"][0]
        x, y = int(pred["x"]), int(pred["y"])
        w, h = int(pred["width"]), int(pred["height"])

        img = Image.open(image_path)
        img_array = np.array(img)
        x1 = max(0, x - w // 2)
        y1 = max(0, y - h // 2)
        x2 = min(img_array.shape[1], x + w // 2)
        y2 = min(img_array.shape[0], y + h // 2)

        cropped_img = img_array[y1:y2, x1:x2]
        if cropped_img.size > 0:
            return pytesseract.image_to_string(Image.fromarray(cropped_img), config='--psm 8').strip()

    return "Not Detected"

def send_upload_notification(plate_number, scrap_img_path, plate_img_path, scrap_result):
    try:
        msg = EmailMessage()
        msg['Subject'] = f"New Scrap Upload - Truck: {plate_number or 'Unknown'}"
        msg['From'] = os.getenv("EMAIL_ADDRESS")
        msg['To'] = os.getenv("OWNER_EMAIL")

        body = f"""
Hi,

A new scrap upload has been made from the yard system.

📌 Truck Plate: {plate_number or 'Not Detected'}



Regards,  
Steel Scrap System
"""
        msg.set_content(body)

        # Attach images
        with open(scrap_img_path, 'rb') as f:
            msg.add_attachment(f.read(), maintype='image', subtype='jpeg', filename=os.path.basename(scrap_img_path))
        with open(plate_img_path, 'rb') as f:
            msg.add_attachment(f.read(), maintype='image', subtype='jpeg', filename=os.path.basename(plate_img_path))

        with smtplib.SMTP(os.getenv("EMAIL_HOST"), int(os.getenv("EMAIL_PORT"))) as server:
            server.starttls()
            server.login(os.getenv("EMAIL_ADDRESS"), os.getenv("EMAIL_PASSWORD"))
            server.send_message(msg)
            print("✅ Email sent successfully.")
    except Exception as e:
        print(f"❌ Email sending failed: {e}")

# ========== Upload Route ==========

@app.route('/upload', methods=['POST'])
def upload():
    try:
        scrap_image = request.files['truck_image']
        plate_image = request.files['plate_image']

        scrap_path = os.path.join('static', scrap_image.filename)
        plate_path = os.path.join('static', plate_image.filename)
        scrap_image.save(scrap_path)
        plate_image.save(plate_path)

        scrap_result = get_inference(scrap_path, "my-first-project-iyasr", "4")
        plate_result = get_inference(plate_path, "license-plate-recognition-rxg4e", "11")
        plate_number = extract_plate_number(plate_result, plate_path)

        truck_record = truck_collection.find_one({"truck_number": plate_number})
        if not truck_record:
            truck_id = truck_collection.insert_one({
                "truck_number": plate_number,
                "plate_image": plate_image.filename,
                "plate_predictions": plate_result
            }).inserted_id
        else:
            truck_id = truck_record["_id"]

        scrap_collection.insert_one({
            "timestamp": datetime.utcnow(),
            "scrap_image": scrap_image.filename,
            "scrap_predictions": scrap_result,
            "truck_id": truck_id
        })

        send_upload_notification(plate_number, scrap_path, plate_path, scrap_result)

        return jsonify({
            "status": "success",
            "plate_number": plate_number,
            "scrap_result": scrap_result
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# ========== Run App ==========
if __name__ == '__main__':
    app.run(debug=True, port=5000)
