#!/usr/bin/env python3
"""
Test script for the authentication system
"""

import requests
import json

BASE_URL = "http://localhost:5001"

def test_health():
    """Test the health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Health check: {response.status_code}")
        print(f"📊 Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")

def test_register(email, password, role):
    """Test user registration"""
    print(f"\n🔍 Testing registration for {email} as {role}...")
    try:
        data = {
            "email": email,
            "password": password,
            "role": role
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        print(f"✅ Registration: {response.status_code}")
        if response.status_code == 201:
            result = response.json()
            print(f"📊 User created: {result['user']}")
            print(f"🔑 Session token: {result['session_token'][:20]}...")
            return result['session_token']
        else:
            print(f"❌ Registration failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return None

def test_login(email, password, role):
    """Test user login"""
    print(f"\n🔍 Testing login for {email} as {role}...")
    try:
        data = {
            "email": email,
            "password": password,
            "role": role
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=data)
        print(f"✅ Login: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"📊 User logged in: {result['user']}")
            print(f"🔑 Session token: {result['session_token'][:20]}...")
            return result['session_token']
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_session_verify(session_token):
    """Test session verification"""
    print(f"\n🔍 Testing session verification...")
    try:
        data = {
            "session_token": session_token
        }
        response = requests.post(f"{BASE_URL}/auth/verify", json=data)
        print(f"✅ Session verification: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"📊 Session valid: {result['user']}")
            return True
        else:
            print(f"❌ Session verification failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Session verification error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Authentication System Tests")
    print("=" * 50)
    
    # Test health endpoint
    test_health()
    
    # Test registration
    test_email = "test@example.com"
    test_password = "testpassword123"
    test_role = "worker"
    
    session_token = test_register(test_email, test_password, test_role)
    
    if session_token:
        # Test session verification
        test_session_verify(session_token)
        
        # Test login with same credentials
        login_session = test_login(test_email, test_password, test_role)
        
        if login_session:
            # Test session verification for login
            test_session_verify(login_session)
    
    # Test owner registration
    print(f"\n🔍 Testing owner registration...")
    owner_session = test_register("owner@example.com", "ownerpass123", "owner")
    
    if owner_session:
        test_session_verify(owner_session)
    
    print("\n" + "=" * 50)
    print("🏁 Authentication tests completed!")

if __name__ == "__main__":
    main()

