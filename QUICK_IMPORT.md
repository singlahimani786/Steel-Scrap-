# Quick MongoDB Import Guide

## Option 1: Using the Import Script (Recommended)

```bash
cd backend
python3 import_data.py
```

This will automatically:
- Clear existing data
- Import all collections from `seed_data.json`
- Verify the import was successful

## Option 2: Manual MongoDB Import

### 1. Start MongoDB Compass or mongo shell
```bash
# Using mongo shell
mongo

# Or use MongoDB Compass (GUI)
```

### 2. Create/Select Database
```javascript
use steel_scrap_db
```

### 3. Import Collections

#### Analysis History Collection
```javascript
db.analysis_history.insertMany([
  // Copy the analysis_history array from seed_data.json
])
```

#### Truck Records Collection
```javascript
db.truck_records.insertMany([
  // Copy the truck_records array from seed_data.json
])
```

#### Scrap Records Collection
```javascript
db.scrap_records.insertMany([
  // Copy the scrap_records array from seed_data.json
])
```

### 4. Verify Import
```javascript
// Check counts
db.analysis_history.count()
db.truck_records.count()
db.scrap_records.count()

// View sample data
db.analysis_history.find().limit(3)
```

## Option 3: Using mongoimport Command

```bash
# Import analysis history
mongoimport --db steel_scrap_db --collection analysis_history --file seed_data.json --jsonArray

# Note: You'll need to extract each collection separately for this method
```

## What Gets Imported

### 📊 Analysis History (21 records)
- **CRC**: 3 records
- **Burada**: 3 records  
- **K2**: 3 records
- **Selected**: 3 records
- **Piece to Piece**: 3 records
- **Melting**: 3 records
- **Sponge Iron**: 3 records

### 🚛 Truck Records (10 unique trucks)
- MH01AB1234, DL02CD5678, KA03EF9012, etc.
- Each with plate predictions and images

### 🔧 Scrap Records (7 records)
- One record per scrap type
- Linked to truck numbers

## Data Structure

Each analysis record contains:
- **timestamp**: ISO format with IST timezone
- **truck_number**: Indian format license plate
- **scrap_predictions**: Array with class, confidence, coordinates
- **plate_predictions**: License plate detection results
- **scrap_image**: Generated filename
- **plate_image**: Generated filename
- **analysis_id**: Unique identifier

## After Import

1. **Start Backend Server**:
   ```bash
   cd backend
   python3 app.py
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **View Analytics**:
   - Navigate to `/dashboard/analytics`
   - You should now see real data in all charts
   - Test the time range filters
   - Click on different scrap types

## Troubleshooting

### Data Not Showing?
- Check MongoDB connection
- Verify collections exist and have data
- Check backend server logs
- Ensure frontend is calling correct API endpoints

### Import Errors?
- Ensure MongoDB is running
- Check file permissions on seed_data.json
- Verify JSON syntax is valid
- Check MongoDB version compatibility

### Collection Names
Make sure these exact collection names exist:
- `analysis_history`
- `truck_records` 
- `scrap_records`

## Expected Results

After successful import, you should see:
- **21 analysis records** in the history table
- **7 scrap types** in the analytics charts
- **10 unique trucks** in the data
- **Real-time filtering** by time range
- **Interactive charts** with actual data
- **Detailed analysis** for each scrap type

The dashboard will now show real data instead of mock data, giving you a fully functional analytics system!
