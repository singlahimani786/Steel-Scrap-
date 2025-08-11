from flask import Blueprint, request, jsonify
import os
from datetime import datetime
from .utils import get_inference, extract_plate_number
from .database import truck_collection, scrap_collection
from .utils import get_inference, extract_plate_number, send_upload_notification
upload_route = Blueprint('upload_route', __name__)

@upload_route.route('/upload', methods=['POST'])
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
        send_upload_notification(
            plate_number=plate_number,
            scrap_img_path=scrap_path,
            plate_img_path=plate_path,
            scrap_result=scrap_result
        )
        return jsonify({"status": "success", "plate_number": plate_number, "scrap_result": scrap_result})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
