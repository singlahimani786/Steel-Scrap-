#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install it first:"
    echo "   npm install -g ngrok"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Start backend in background
echo "🔧 Starting Flask backend..."
cd backend
python3 app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Backend is running on port 5001"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel..."
ngrok http 5001 > /dev/null &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)

if [ -z "$NGROK_URL" ] || [ "$NGROK_URL" = "null" ]; then
    echo "❌ Failed to get ngrok URL"
    kill $BACKEND_PID $NGROK_PID 2>/dev/null
    exit 1
fi

echo "✅ ngrok tunnel established: $NGROK_URL"

# Deploy frontend to Vercel
echo "🚀 Deploying frontend to Vercel..."
cd frontend

# Set environment variable
echo "🔧 Setting environment variable..."
vercel env add NEXT_PUBLIC_BACKEND_URL <<< "$NGROK_URL"

# Deploy
echo "📦 Building and deploying..."
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📱 Frontend: Check your Vercel dashboard"
echo "🔧 Backend: $NGROK_URL"
echo ""
echo "⚠️  Remember:"
echo "   - Backend will stop when you close this terminal"
echo "   - ngrok URL changes on restart (free tier)"
echo "   - Set up proper backend hosting for production"
echo ""
echo "🔄 To stop: Press Ctrl+C or run: kill $BACKEND_PID $NGROK_PID"
