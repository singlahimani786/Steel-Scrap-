#!/bin/bash

echo "🔄 Starting fresh database setup..."

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if ! curl -s "http://localhost:27017" > /dev/null 2>&1; then
    echo "❌ MongoDB is not running. Please start MongoDB first."
    exit 1
fi

echo "✅ MongoDB is running"

# Clear the database
echo "🗑️  Clearing existing database..."
python3 clear_database.py

# Seed fresh data
echo "🌱 Seeding fresh data..."
python3 proper_seed_data.py

# Start the backend
echo "🚀 Starting backend server..."
python3 app.py
