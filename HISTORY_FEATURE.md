# Analysis History Feature

## Overview

The Analysis History feature has been implemented to store and display all scrap and truck identification results in a comprehensive database table. This allows users to track, search, and export their analysis history.

## Features Implemented

### 1. Database Storage
- **New Collection**: `analysis_history` in MongoDB
- **Stores**: Every scrap and truck analysis result with timestamps
- **Fields**: 
  - `timestamp`: When the analysis was performed
  - `truck_number`: Identified truck plate number
  - `truck_id`: Reference to truck record
  - `scrap_image`: Filename of uploaded scrap image
  - `plate_image`: Filename of uploaded plate image
  - `scrap_predictions`: AI analysis results for scrap
  - `plate_predictions`: AI analysis results for plate
  - `analysis_id`: Unique identifier for the analysis

### 2. Backend API
- **Modified `/upload` endpoint**: Now saves results to history collection
- **New `/history` endpoint**: Retrieves all analysis history (sorted by timestamp)
- **Automatic storage**: Every successful analysis is automatically saved

### 3. Frontend Dashboard
- **Real-time updates**: History refreshes after each new analysis
- **Loading states**: Proper loading indicators
- **Empty states**: User-friendly messages when no data exists
- **Link to full history**: Quick access to detailed history page

### 4. Dedicated History Page (`/dashboard/history`)
- **Comprehensive view**: Full analysis history with advanced features
- **Statistics dashboard**: 
  - Total analyses count
  - Unique trucks count
  - Today's analyses count
  - Success rate percentage
- **Search functionality**: Search by truck number or scrap type
- **Filtering**: Filter by specific truck
- **Export capability**: Download history as CSV
- **Refresh functionality**: Manual refresh of data

### 5. Enhanced Data Table
- **Improved columns**: 
  - Date & Time (sortable)
  - Truck Number (sortable)
  - Scrap Analysis (type + confidence)
  - Scrap Image
  - Actions menu
- **Better formatting**: Proper date formatting and data display
- **Interactive actions**: Copy truck number, analysis ID, view details

### 6. Navigation Updates
- **Navbar links**: Added Dashboard and History links for authenticated users
- **Mobile responsive**: Proper mobile navigation support

## Database Schema

```javascript
// analysis_history collection
{
  "_id": ObjectId,
  "timestamp": ISODate,
  "truck_number": String,
  "truck_id": ObjectId,
  "scrap_image": String,
  "plate_image": String,
  "scrap_predictions": Array,
  "plate_predictions": Array,
  "analysis_id": String
}
```

## API Endpoints

### GET /history
Returns all analysis history sorted by timestamp (newest first)

**Response:**
```json
{
  "status": "success",
  "history": [
    {
      "_id": "string",
      "timestamp": "2024-01-01T12:00:00Z",
      "truck_number": "ABC123",
      "truck_id": "string",
      "scrap_image": "scrap_001.jpg",
      "plate_image": "plate_001.jpg",
      "scrap_predictions": [...],
      "plate_predictions": [...],
      "analysis_id": "string"
    }
  ]
}
```

### POST /upload (Enhanced)
Now automatically saves results to history collection in addition to existing functionality.

## Usage

### For Users
1. **Upload Analysis**: Use the dashboard to upload scrap and truck images
2. **View Recent History**: See recent analyses on the dashboard
3. **Access Full History**: Click "View Full History" or navigate to `/dashboard/history`
4. **Search & Filter**: Use search and filter options on the history page
5. **Export Data**: Download analysis history as CSV for reporting

### For Developers
1. **Database Access**: All history is stored in `analysis_history` collection
2. **API Integration**: Use `/history` endpoint to fetch data
3. **Real-time Updates**: History automatically updates after each analysis
4. **Extensible**: Easy to add more fields or functionality

## Technical Implementation

### Backend Changes
- `backend/app/database.py`: Added `analysis_history_collection`
- `backend/app/routes.py`: Enhanced upload route and added history endpoint

### Frontend Changes
- `frontend/src/components/columns.tsx`: Updated for analysis data display
- `frontend/src/components/datatable.tsx`: Updated type definitions
- `frontend/src/app/dashboard/page.tsx`: Added history fetching and display
- `frontend/src/app/dashboard/history/page.tsx`: New comprehensive history page
- `frontend/src/components/navbar.tsx`: Added navigation links

## Testing

Run the test script to verify functionality:
```bash
cd backend
python test_history.py
```

## Future Enhancements

1. **Advanced Filtering**: Date range filters, confidence thresholds
2. **Analytics Dashboard**: Charts and graphs for analysis trends
3. **Bulk Operations**: Bulk export, delete, or update operations
4. **Real-time Notifications**: WebSocket updates for new analyses
5. **Image Preview**: Thumbnail previews in the history table
6. **Advanced Search**: Full-text search across all fields
7. **Data Retention**: Automatic cleanup of old records
8. **Audit Trail**: Track who performed each analysis

## Security Considerations

- History data is tied to user authentication
- Sensitive data (like full image paths) is handled securely
- API endpoints include proper error handling
- Database queries are optimized for performance

## Performance Notes

- History is sorted by timestamp for optimal retrieval
- Pagination can be added for large datasets
- Indexes should be added on frequently queried fields
- CSV export handles large datasets efficiently
