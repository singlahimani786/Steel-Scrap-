import requests
import os
from PIL import Image
import numpy as np
import pytesseract
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from datetime import datetime
from bson import ObjectId

load_dotenv()

api_key = os.getenv("API_KEY")

def serialize_mongodb_doc(doc):
    """
    Recursively serializes a MongoDB document, converting:
    - ObjectId to string
    - datetime to ISO format string
    - Handles nested dictionaries and lists
    """
    if isinstance(doc, dict):
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                doc[key] = str(value)
            elif isinstance(value, datetime):
                doc[key] = value.isoformat()
            elif isinstance(value, (dict, list)):
                doc[key] = serialize_mongodb_doc(value)
    elif isinstance(doc, list):
        return [serialize_mongodb_doc(item) for item in doc]
    return doc

def get_inference(image_path, project, version):
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
        msg['Subject'] = f"🛻 New Scrap Upload - Truck: {plate_number or 'Unknown'}"
        msg['From'] = os.getenv("EMAIL_ADDRESS")
        msg['To'] = os.getenv("OWNER_EMAIL")

        body = f"""
Hi,

A new scrap upload has been made from the yard system.

📌 Truck Plate: {plate_number or 'Not Detected'}


Visit your dashboard to review: http://yourwebsite.com/dashboard

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
