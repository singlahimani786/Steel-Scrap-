#!/bin/bash

echo "🚀 Setting up Complete 3-Tier User Management System..."

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if ! curl -s "http://localhost:27017" > /dev/null 2>&1; then
    echo "❌ MongoDB is not running. Please start MongoDB first."
    exit 1
fi

echo "✅ MongoDB is running"

# Navigate to backend directory
cd backend

# 1. Clear and setup user management system
echo "🏗️  Setting up user management system..."
python3 create_user_management.py

# 2. Seed analysis data
echo "🌱 Seeding analysis data..."
python3 proper_seed_data.py

# 3. Start the backend server
echo "🚀 Starting backend server..."
echo "📱 The system is now ready with:"
echo "   👑 Admin: admin@steel.com / admin123"
echo "   🏭 Owner: owner@steelfactory.com / owner123"
echo "   👷 Labourer: labourer1@steelfactory.com / labourer1"
echo ""
echo "🌐 Frontend should be running on: http://localhost:3000"
echo "🔧 Backend running on: http://localhost:5001"
echo ""
echo "📋 Access URLs:"
echo "   - Admin Panel: http://localhost:3000/admin"
echo "   - Owner Panel: http://localhost:3000/owner"
echo "   - Dashboard: http://localhost:3000/dashboard"
echo "   - Analytics: http://localhost:3000/dashboard/analytics"

python3 app.py
