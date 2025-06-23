# Nearest Nice Weather API Reference

## Base URL
```
Development: http://localhost:8000
Production: TBD
```

## Authentication
Currently using development mode without authentication. JWT authentication will be implemented in next phase.

## API Endpoints

### Health & Status

#### `GET /`
**Description**: Root endpoint with basic API information

**Response**:
```json
{
  "message": "Nearest Nice Weather API",
  "status": "running",
  "timestamp": "2025-06-23T15:56:52.718724"
}
```

#### `GET /health`
**Description**: Simple health check endpoint

**Response**:
```json
{
  "status": "healthy"
}
```

#### `GET /infrastructure`
**Description**: Comprehensive infrastructure status validation

**Response**:
```json
{
  "api": "running",
  "database": "connected",
  "redis": "connected", 
  "timestamp": "2025-06-23T15:56:52.718724",
  "sample_locations": 5
}
```

### Data Endpoints

#### `GET /locations`
**Description**: Retrieve all weather monitoring locations

**Response**:
```json
{
  "locations": [
    {
      "name": "Minneapolis",
      "state": "MN",
      "longitude": -93.265,
      "latitude": 44.9778
    },
    {
      "name": "Duluth", 
      "state": "MN",
      "longitude": -92.1005,
      "latitude": 46.7867
    }
  ]
}
```

#### `GET /operators`
**Description**: Retrieve tourism operators in the system

**Response**:
```json
{
  "operators": [
    {
      "business_name": "North Woods Ice Fishing",
      "business_type": "ice_fishing",
      "contact_email": "info@northwoodsice.com",
      "longitude": -94.2008,
      "latitude": 46.358
    },
    {
      "business_name": "BWCA Adventures",
      "business_type": "bwca_outfitter", 
      "contact_email": "guide@bwcaadventures.com",
      "longitude": -91.8668,
      "latitude": 47.903
    }
  ]
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `500`: Internal server error (database/Redis connection issues)

Error responses include details:
```json
{
  "error": "Description of the error"
}
```

## Interactive Documentation

FastAPI automatically generates interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Database Schema

### Weather Schema
- `locations`: Geographic points for weather monitoring
- `forecasts`: Weather forecast data (structure defined, data pending API integration)

### Tourism Schema  
- `operators`: Tourism business information and preferences
- `activity_preferences`: Weather thresholds for different activities

### Analytics Schema
- `weather_requests`: API usage tracking and analytics

## Next Implementation Phase

The following endpoints are planned for weather API integration:
- `POST /weather/recommendations` - Core weather-activity matching
- `GET /weather/forecast/{location_id}` - Detailed weather forecasts
- `POST /notifications/weather-alerts` - Weather alert subscriptions
- `GET /analytics/usage` - Tourism operator dashboard data

## Geographic Functions

PostGIS functions available for distance calculations:
- `calculate_distance_miles(lat1, lon1, lat2, lon2)` - Returns distance in miles
- Spatial indexing on all coordinate fields for performance

## Development Notes

- All endpoints support CORS for localhost:3000 (frontend development)
- Async database connections using asyncpg
- Redis caching ready for weather data storage
- Health checks validate all infrastructure components
- Sample data loaded for immediate development and testing