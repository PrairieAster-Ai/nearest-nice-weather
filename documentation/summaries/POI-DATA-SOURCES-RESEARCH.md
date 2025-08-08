# Minnesota Parks Data Sources Research - 1000+ POI Expansion

## 🎯 **Goal**: Add 1000+ local, county, state & national parks to all database environments

## 📊 **Data Source Analysis & Recommendations**

### **🏛️ Tier 1: Official Government APIs (Highest Quality)**

#### 1. **Minnesota DNR Gazetteer API** ⭐⭐⭐⭐⭐
- **URL**: `http://services.dnr.state.mn.us/api/gazetteer/v1`
- **Coverage**: 64 state parks, 9 recreation areas, 9 waysides, 43 forest campgrounds
- **Data Quality**: Official, authoritative, regularly updated
- **Estimated POIs**: ~125 high-quality state-level destinations
- **Access**: Free, no API key required

#### 2. **National Park Service API** ⭐⭐⭐⭐⭐
- **URL**: `https://www.nps.gov/subjects/digital/nps-data-api.htm`
- **Coverage**: National Parks, Monuments, Recreation Areas, Forests
- **Minnesota Sites**: Voyageurs National Park, Mississippi National River & Recreation Area, Pipestone National Monument
- **Data Quality**: Federal government standard, comprehensive metadata
- **Estimated POIs**: ~20 national-level destinations
- **Access**: Free API key required

#### 3. **Recreation.gov RIDB API** ⭐⭐⭐⭐
- **URL**: `https://ridb.recreation.gov/`
- **Coverage**: Federal recreation facilities, campgrounds, day-use areas
- **Data Quality**: Official federal recreation database
- **Estimated POIs**: ~50 federal recreation facilities
- **Access**: Free API with registration

### **🏘️ Tier 2: Regional & County Data (Good Quality)**

#### 4. **Minnesota Geospatial Commons CKAN API** ⭐⭐⭐⭐
- **URL**: `https://gisdata.mn.gov/api`
- **Coverage**: Metro Collaborative Parks (7 counties: Anoka, Carver, Dakota, Hennepin, Ramsey, Scott, Washington)
- **Data Sources**: Metro Parks Collaborative, Regional Parks System
- **Estimated POIs**: ~200 metro area parks and trails
- **Data Quality**: Professional GIS data, standardized across 7 counties
- **Access**: Free CKAN REST API

#### 5. **Individual County APIs** ⭐⭐⭐
- **Counties**: Hennepin, Ramsey, Dakota, Anoka, Scott, Carver, Washington
- **Coverage**: County parks, nature centers, recreation areas
- **Estimated POIs**: ~300 county-level destinations
- **Data Quality**: Varies by county, generally good
- **Access**: Mixed (some have APIs, others require web scraping)

### **🌍 Tier 3: OpenStreetMap (Massive Coverage)** 

#### 6. **OpenStreetMap Overpass API** ⭐⭐⭐⭐
- **URL**: `https://overpass-api.de/api/interpreter`
- **Coverage**: Community-maintained data for ALL Minnesota parks
- **Tags**: `leisure=park`, `park:type=*`, `ownership=*` (municipal, county, state, national)
- **Estimated POIs**: ~2000+ parks of all sizes and types
- **Data Quality**: Variable but comprehensive, excellent geographic coverage
- **Access**: Free, no registration required

**Overpass Query Example**:
```overpass
[out:json][timeout:25];
(area["name"="Minnesota"]["admin_level"="4"];)->.searchArea;
(
  nwr["leisure"="park"](area.searchArea);
  nwr["leisure"="nature_reserve"](area.searchArea);
  nwr["boundary"="national_park"](area.searchArea);
  nwr["park:type"~"state_park|county_park|city_park|municipal"](area.searchArea);
);
out geom;
```

### **📊 Combined Strategy for 1000+ POI Target**

| Data Source | Estimated POIs | Quality | Priority |
|-------------|---------------|---------|----------|
| Minnesota DNR API | 125 | Excellent | 1 |
| NPS API | 20 | Excellent | 1 |
| Recreation.gov API | 50 | Excellent | 1 |
| Metro GIS Commons | 200 | Very Good | 2 |
| County APIs | 300 | Good | 2 |
| OpenStreetMap | 500+ | Variable | 3 |
| **TOTAL** | **1,195+** | **Mixed** | **All Tiers** |

## 🚀 **Recommended Implementation Strategy**

### **Phase 1: High-Quality Foundation (195 POIs)**
1. **Minnesota DNR API**: State parks, forests, recreation areas
2. **National Park Service API**: National parks and monuments  
3. **Recreation.gov API**: Federal recreation facilities

### **Phase 2: Metro Area Expansion (395 POIs)**
4. **Minnesota Geospatial Commons**: Metro collaborative parks
5. **County APIs**: Individual county park systems

### **Phase 3: Comprehensive Coverage (895+ POIs)**
6. **OpenStreetMap Overpass**: Fill gaps with municipal and local parks

## 🔧 **Technical Implementation Requirements**

### **Data Pipeline Architecture**:
```javascript
// 1. API Connectors
class DNRConnector { /* Minnesota DNR API */ }
class NPSConnector { /* National Park Service API */ }  
class RIDBConnector { /* Recreation.gov API */ }
class CKANConnector { /* Minnesota GIS Commons */ }
class OSMConnector { /* OpenStreetMap Overpass */ }

// 2. Data Normalizer
class POIDataNormalizer {
  // Standardize all sources to common schema
  normalizeToSchema(rawData, sourceType) { /* ... */ }
}

// 3. Database Synchronizer  
class MultiEnvironmentSync {
  // Sync to all branches: development → preview → production
  syncToAllBranches(normalizedData) { /* ... */ }
}
```

### **Schema Standardization**:
```sql
CREATE TABLE poi_locations_expanded (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    
    -- Classification
    park_type VARCHAR(100), -- 'State Park', 'County Park', 'City Park', etc.
    park_level VARCHAR(50), -- 'national', 'state', 'county', 'municipal'
    ownership VARCHAR(100), -- 'Minnesota DNR', 'NPS', 'Hennepin County', etc.
    operator VARCHAR(255),
    
    -- Metadata
    description TEXT,
    data_source VARCHAR(50), -- 'dnr_api', 'nps_api', 'osm', etc.
    source_id VARCHAR(100), -- Original ID from source system
    place_rank INTEGER DEFAULT 50,
    
    -- Additional fields
    phone VARCHAR(20),
    website VARCHAR(255),
    amenities TEXT[], -- Array of amenity tags
    activities TEXT[], -- Array of activity types
    
    -- Standard fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📋 **Next Steps**

1. **Start with Minnesota DNR API** - Most reliable, high-quality state data
2. **Add NPS API integration** - Federal parks and monuments
3. **Implement data pipeline** for automated updates
4. **Test on development branch** before rolling to preview/production
5. **Scale to full 1000+ dataset** with OpenStreetMap integration

## 🎯 **Success Metrics**

- **Quantity**: 1000+ unique POI locations across Minnesota
- **Quality**: Authoritative government sources prioritized
- **Coverage**: All levels (national, state, county, municipal)
- **Distribution**: Statewide geographic coverage
- **Business Impact**: Comprehensive outdoor recreation discovery platform

This multi-tiered approach ensures we get high-quality, authoritative data first, then scale to comprehensive coverage with community-maintained sources.