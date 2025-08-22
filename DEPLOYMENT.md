# 🚀 Deployment Guide: Frontend on Vercel + Backend on ngrok

## 📋 Overview
This guide explains how to deploy your scrap identification system with:
- **Frontend**: Deployed on Vercel (free hosting)
- **Backend**: Running locally via ngrok tunnel

## 🔧 Prerequisites
- Node.js and npm installed
- Vercel CLI installed (`npm i -g vercel`)
- ngrok installed (`npm i -g ngrok`)
- Flask backend running on port 5001

## 🎯 Step 1: Backend Setup (ngrok)

### 1.1 Start your Flask backend
```bash
cd backend
python3 app.py
```

### 1.2 Expose backend via ngrok
```bash
ngrok http 5001
```

### 1.3 Copy the ngrok URL
You'll get a URL like: `https://abc123.ngrok.io`

## 🎯 Step 2: Frontend Deployment (Vercel)

### 2.1 Set environment variable in Vercel
```bash
cd frontend
vercel env add NEXT_PUBLIC_BACKEND_URL
# Enter your ngrok URL: https://abc123.ngrok.io
```

### 2.2 Deploy to Vercel
```bash
vercel --prod
```

### 2.3 Verify deployment
- Check your Vercel dashboard
- Test the deployed app
- Verify API calls work with ngrok backend

## 🔄 Alternative: Manual Environment Setup

### Option 1: Vercel Dashboard
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add: `NEXT_PUBLIC_BACKEND_URL` = `https://your-ngrok-url.ngrok.io`

### Option 2: Local .env.local (for development)
```bash
# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=https://your-ngrok-url.ngrok.io
```

## ⚠️ Important Notes

### ngrok Limitations
- **Free tier**: URL changes every restart
- **Paid plans**: Fixed URLs available
- **Security**: Your local backend becomes publicly accessible

### Environment Variables
- All API calls now use `process.env.NEXT_PUBLIC_BACKEND_URL`
- Fallback to `http://localhost:5001` for local development
- No hardcoded URLs in the codebase

### CORS Configuration
- Backend CORS is set to allow all origins (`CORS(app)`)
- This allows Vercel domains to access your ngrok backend

## 🚀 Production Recommendations

### Better Backend Hosting
Consider these alternatives for production:
- **Railway**: Easy deployment, free tier
- **Render**: Free tier available
- **Heroku**: Classic choice
- **DigitalOcean**: More control

### Environment Management
- Use Vercel's environment variables
- Keep sensitive data out of code
- Use different URLs for dev/staging/prod

## 🔍 Troubleshooting

### Common Issues
1. **CORS errors**: Check backend CORS configuration
2. **404 errors**: Verify ngrok URL is correct
3. **Environment variables**: Ensure they're set in Vercel
4. **ngrok tunnel**: Make sure backend is running

### Testing
```bash
# Test backend via ngrok
curl https://your-ngrok-url.ngrok.io/health

# Test frontend deployment
# Visit your Vercel URL and try logging in
```

## 📱 Final Result
- ✅ Frontend: Fast, global CDN via Vercel
- ✅ Backend: Local development with real-time updates
- ✅ API: All calls use environment variables
- ✅ Deployment: One-command deployment to Vercel
