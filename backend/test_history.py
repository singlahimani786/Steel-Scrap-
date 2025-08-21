#!/usr/bin/env python3
"""
Test script to verify the analysis history functionality
"""

import requests
import json
from datetime import datetime

def test_history_endpoint():
    """Test the history endpoint"""
    try:
        # Test GET /history
        response = requests.get("http://localhost:5001/history")
        print(f"History endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response status: {data.get('status')}")
            print(f"Number of history records: {len(data.get('history', []))}")
            
            if data.get('history'):
                print("\nSample history record:")
                sample_record = data['history'][0]
                print(f"  Truck Number: {sample_record.get('truck_number')}")
                print(f"  Timestamp: {sample_record.get('timestamp')}")
                print(f"  Scrap Image: {sample_record.get('scrap_image')}")
                print(f"  Analysis ID: {sample_record.get('analysis_id')}")
        else:
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the backend is running on http://localhost:5001")
    except Exception as e:
        print(f"Error: {e}")

def test_upload_endpoint():
    """Test the upload endpoint with dummy data"""
    try:
        # Create dummy form data
        files = {
            'truck_image': ('test_scrap.jpg', b'dummy_image_data', 'image/jpeg'),
            'plate_image': ('test_plate.jpg', b'dummy_image_data', 'image/jpeg')
        }
        
        response = requests.post("http://localhost:5001/upload", files=files)
        print(f"\nUpload endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Upload response: {data}")
        else:
            print(f"Upload error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure the backend is running on http://localhost:5001")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing Analysis History Functionality")
    print("=" * 40)
    
    test_history_endpoint()
    # Uncomment the line below to test upload (will fail without proper images)
    # test_upload_endpoint()
    
    print("\nTest completed!")
