# Steel Scrap Analytics System Setup Guide

## Overview
This system provides comprehensive analytics for 7 steel scrap types with MongoDB integration, featuring:
- Real-time data retrieval from MongoDB
- Interactive charts and visualizations
- Detailed scrap type analysis
- Time-range filtering (7/30/90 days, all time)
- Owner-only access control

## Prerequisites
- Python 3.8+
- MongoDB running locally
- Node.js 16+ (for frontend)
- pip3 package manager

## Quick Setup

### 1. Start MongoDB
```bash
# macOS
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
# Start MongoDB service from Services
```

### 2. Run Automated Setup
```bash
# Make script executable (if not already)
chmod +x run_seeder.sh

# Run the complete setup
./run_seeder.sh
```

This script will:
- Install required Python packages
- Check MongoDB connection
- Seed the database with 1 year of realistic data
- Start the backend server

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

## Manual Setup

### 1. Backend Setup
```bash
cd backend

# Install Python dependencies
pip3 install pymongo python-dotenv flask flask-cors

# Seed the database
python3 seed_data.py

# Start the server
python3 app.py
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Database Structure

### Collections Created
- `analysis_history`: Main analysis records
- `truck_records`: Truck information and plate data
- `scrap_records`: Scrap analysis details

### Data Generated
- **365 days** of realistic data
- **7 scrap types**: CRC, Burada, K2, Selected, Piece to Piece, Melting, Sponge Iron
- **35 unique truck numbers** (Indian format)
- **5-15 records per day** (weekends have less activity)
- **Realistic confidence scores** and coordinates

## API Endpoints

### New Analytics Endpoints
- `GET /scrap-types` - Get all scrap type details
- `GET /analytics?range=30d` - Get analytics data for specified time range

### Existing Endpoints
- `GET /history` - Get analysis history
- `POST /upload` - Upload images for analysis

## Features

### 1. Interactive Scrap Type Selection
- Click any of the 7 scrap types to see detailed analysis
- Shows count, unique trucks, estimated weight, and value
- Displays processing information and raw materials

### 2. Time Range Filtering
- **7 days**: Last week of data
- **30 days**: Last month of data  
- **90 days**: Last quarter of data
- **All time**: Complete year of data

### 3. Chart Visualizations
- **Pie Chart**: Overall distribution of scrap types
- **Bar Chart**: Counts by scrap type
- **Line Chart**: Daily trends for all types
- **Stacked Bar**: Monthly aggregated data
- **Yearly Trend**: Complete year analysis

### 4. Detailed Analytics
- **Key Metrics**: Total analyses, unique trucks, weight, value
- **Processing Info**: Price per ton, energy required, carbon footprint
- **Raw Materials**: Required materials for each scrap type
- **Processing Steps**: Step-by-step workflow

## Data Flow

1. **Database Seeding**: `seed_data.py` generates realistic data
2. **Backend API**: Flask server provides data via REST endpoints
3. **Frontend Fetching**: React components fetch and display data
4. **Real-time Updates**: Data refreshes based on selected time range

## Testing

### 1. Verify Database Seeding
```bash
# Check MongoDB collections
mongo steel_scrap_db
> db.analysis_history.count()
> db.truck_records.count()
> db.scrap_records.count()
```

### 2. Test API Endpoints
```bash
# Test scrap types endpoint
curl http://localhost:5001/scrap-types

# Test analytics endpoint
curl "http://localhost:5001/analytics?range=30d"
```

### 3. Frontend Testing
- Navigate to `/dashboard/analytics`
- Verify owner-only access
- Test time range filters
- Click different scrap types
- Verify chart data updates

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `.env` file
   - Verify network access

2. **Python Package Errors**
   - Update pip: `pip3 install --upgrade pip`
   - Install packages individually: `pip3 install pymongo python-dotenv`

3. **Frontend Build Errors**
   - Clear node_modules: `rm -rf node_modules package-lock.json`
   - Reinstall: `npm install`

4. **Data Not Loading**
   - Check backend server logs
   - Verify API endpoints are accessible
   - Check browser console for errors

### Logs and Debugging
- Backend logs appear in terminal
- Frontend errors in browser console
- MongoDB queries can be monitored in MongoDB Compass

## Performance Notes

- **Database Size**: ~10,000+ records after seeding
- **Query Performance**: Indexed on timestamp and truck_number
- **Chart Rendering**: Optimized with React memoization
- **Data Fetching**: Efficient aggregation pipelines

## Security Features

- **Owner-only Access**: Dashboard requires `role: 'owner'`
- **Protected Routes**: All analytics pages are secured
- **Input Validation**: Backend validates all incoming data
- **CORS Protection**: Configured for local development

## Next Steps

1. **Real Data Integration**: Replace mock data with actual production data
2. **Advanced Analytics**: Add machine learning insights
3. **Real-time Updates**: Implement WebSocket for live data
4. **Export Features**: Add CSV/PDF export capabilities
5. **Mobile Optimization**: Responsive design improvements

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend logs
3. Check browser console errors
4. Verify MongoDB connection and data
