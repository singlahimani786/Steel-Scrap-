#!/usr/bin/env python3
"""
Test script to verify Roboflow API connection and predictions
"""

import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_roboflow_api():
    """Test Roboflow API connection"""
    api_key = os.getenv("API_KEY")
    
    if not api_key:
        print("❌ No API key found in .env file")
        return False
    
    print(f"🔑 API Key: {api_key[:10]}...")
    
    # Test scrap classification model
    scrap_project = "my-first-project-iyasr"
    scrap_version = "4"
    
    # Test license plate model
    plate_project = "license-plate-recognition-rxg4e"
    plate_version = "11"
    
    print(f"\n🧪 Testing Scrap Classification Model:")
    print(f"   Project: {scrap_project}")
    print(f"   Version: {scrap_version}")
    
    # Test with a sample image if available
    test_image_path = "static/car.jpg"
    
    if os.path.exists(test_image_path):
        print(f"   Using test image: {test_image_path}")
        
        try:
            with open(test_image_path, 'rb') as img_file:
                img_bytes = img_file.read()
            
            # Test scrap classification
            scrap_url = f"https://detect.roboflow.com/{scrap_project}/{scrap_version}?api_key={api_key}"
            scrap_response = requests.post(scrap_url, files={"file": img_bytes})
            
            print(f"   Scrap API Status: {scrap_response.status_code}")
            if scrap_response.status_code == 200:
                scrap_result = scrap_response.json()
                print(f"   ✅ Scrap Prediction: {scrap_result}")
            else:
                print(f"   ❌ Scrap API Error: {scrap_response.text}")
            
            # Test license plate recognition
            plate_url = f"https://detect.roboflow.com/{plate_project}/{plate_version}?api_key={api_key}"
            plate_response = requests.post(plate_url, files={"file": img_bytes})
            
            print(f"   Plate API Status: {plate_response.status_code}")
            if plate_response.status_code == 200:
                plate_result = plate_response.json()
                print(f"   ✅ Plate Prediction: {plate_result}")
            else:
                print(f"   ❌ Plate API Error: {plate_response.text}")
                
        except Exception as e:
            print(f"   ❌ Error testing API: {e}")
    else:
        print(f"   ⚠️ No test image found at {test_image_path}")
        print("   Testing API endpoints only...")
        
        # Test API endpoints without image
        try:
            scrap_url = f"https://detect.roboflow.com/{scrap_project}/{scrap_version}?api_key={api_key}"
            response = requests.get(scrap_url)
            print(f"   Scrap endpoint status: {response.status_code}")
            
            plate_url = f"https://detect.roboflow.com/{plate_project}/{plate_version}?api_key={api_key}"
            response = requests.get(plate_url)
            print(f"   Plate endpoint status: {response.status_code}")
            
        except Exception as e:
            print(f"   ❌ Error testing endpoints: {e}")
    
    return True

if __name__ == "__main__":
    print("🧪 Testing Roboflow API Configuration")
    print("=" * 50)
    test_roboflow_api()
    print("\n✅ Test completed!")
