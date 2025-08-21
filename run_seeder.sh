#!/bin/bash

echo "🚀 Steel Scrap Analysis System - Setup Script"
echo "=============================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Install required Python packages
echo "📦 Installing required Python packages..."
pip3 install pymongo python-dotenv

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if ! python3 -c "from pymongo import MongoClient; MongoClient('mongodb://localhost:27017').admin.command('ping')" 2>/dev/null; then
    echo "❌ MongoDB is not running. Please start MongoDB first:"
    echo "   - On macOS: brew services start mongodb-community"
    echo "   - On Ubuntu: sudo systemctl start mongod"
    echo "   - On Windows: Start MongoDB service"
    exit 1
fi

echo "✅ MongoDB is running"

# Run the seeder
echo "🌱 Running database seeder..."
cd backend
python3 seed_data.py

# Start the backend server
echo "🚀 Starting backend server..."
python3 app.py
