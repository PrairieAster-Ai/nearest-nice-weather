# POI Database Specification - Free & Low-Cost Activities
## Weather Intelligence Platform - Point of Interest Data Structure

**Created**: 2025-07-19
**Purpose**: Define comprehensive POI database for free/low-cost outdoor activities
**Focus**: Mass market users seeking accessible outdoor recreation

---

## **🎯 POI Database Philosophy**

### **Core Principles**

**Accessibility-First**:
- **Free activities**: No admission fees or minimal costs (<$10)
- **Public access**: Publicly accessible locations without membership requirements
- **Transportation accessible**: Reachable by car with parking available
- **Inclusive**: Suitable for various fitness levels and abilities

**Weather-Activity Optimization**:
- **Activity-specific weather needs**: Different activities have different weather requirements
- **Seasonal adaptability**: POIs available across different seasons
- **Weather backup options**: Indoor alternatives when outdoor weather is poor
- **Real-time conditions**: Current weather suitability for each activity type

---

## **🏞️ Primary POI Categories**

### **1. Free Outdoor Recreation**

#### **Local Parks & Green Spaces**
```json
{
  "category": "Local Park",
  "examples": [
    "City parks with walking paths",
    "Neighborhood green spaces",
    "Community gardens",
    "Playground areas with trails",
    "Urban forests and nature areas"
  ],
  "typical_amenities": ["Parking", "Restrooms", "Picnic areas", "Walking paths"],
  "weather_activities": {
    "sunny": ["Walking", "Picnicking", "Photography", "Reading"],
    "cloudy": ["Hiking", "Jogging", "Dog walking", "Nature observation"],
    "light_rain": ["Covered pavilion activities", "Car-based activities"]
  },
  "cost": "Free",
  "accessibility": "High - paved paths common"
}
```

#### **County & Regional Parks**
```json
{
  "category": "County Park",
  "examples": [
    "Regional trail systems",
    "County beaches and lakeshores",
    "Multi-use recreational areas",
    "Historic county sites",
    "Wildlife observation areas"
  ],
  "typical_amenities": ["Parking", "Restrooms", "Trails", "Picnic areas", "Visitor centers"],
  "weather_activities": {
    "sunny": ["Hiking", "Swimming", "Kayaking", "Photography", "Biking"],
    "cloudy": ["Trail hiking", "Wildlife watching", "Geocaching"],
    "rainy": ["Visitor center activities", "Covered shelter use"]
  },
  "cost": "Free to $8 daily parking",
  "accessibility": "Medium - some paved options"
}
```

#### **State Parks & Natural Areas**
```json
{
  "category": "State Park",
  "examples": [
    "State park hiking trails",
    "Natural swimming areas",
    "Scenic overlooks and viewpoints",
    "State forests and preserves",
    "Geological formations"
  ],
  "typical_amenities": ["Parking", "Restrooms", "Trail maps", "Interpretive signs"],
  "weather_activities": {
    "sunny": ["Hiking", "Rock climbing", "Photography", "Swimming"],
    "cloudy": ["Forest hiking", "Bird watching", "Geocaching"],
    "light_rain": ["Waterfall viewing", "Forest exploration"]
  },
  "cost": "$5-8 daily vehicle pass",
  "accessibility": "Low to Medium - natural terrain"
}
```

#### **National Parks & Forests (Free Areas)**
```json
{
  "category": "National Forest/Park",
  "examples": [
    "Visitor centers (free admission)",
    "Scenic drive viewpoints",
    "Free day-use areas",
    "Interpretive trails",
    "National forest recreation areas"
  ],
  "typical_amenities": ["Parking", "Restrooms", "Interpretive materials", "Scenic views"],
  "weather_activities": {
    "sunny": ["Scenic driving", "Photography", "Visitor center tours"],
    "cloudy": ["Nature walks", "Interpretive programs", "Wildlife viewing"],
    "any": ["Indoor visitor center exhibits"]
  },
  "cost": "Free (some areas)",
  "accessibility": "High - visitor centers accessible"
}
```

### **2. Free Cultural & Educational Activities**

#### **Public Libraries**
```json
{
  "category": "Public Library",
  "examples": [
    "Main library branches",
    "Community library locations",
    "Outdoor reading gardens",
    "Library event spaces",
    "Maker spaces and computer labs"
  ],
  "typical_amenities": ["WiFi", "Restrooms", "Parking", "Climate control", "Seating"],
  "weather_activities": {
    "any": ["Reading", "Computer use", "Studying", "Programs"],
    "hot": ["Air conditioning refuge", "Cool indoor activities"],
    "cold": ["Warm indoor activities", "Heated study spaces"],
    "rainy": ["Indoor activities", "Event programs"]
  },
  "cost": "Free",
  "accessibility": "High - ADA compliant"
}
```

#### **Museums (Free Days & Areas)**
```json
{
  "category": "Museum",
  "examples": [
    "Free admission museums",
    "Museum free days",
    "Outdoor sculpture gardens",
    "Historic house exteriors",
    "Art installations in public spaces"
  ],
  "typical_amenities": ["Parking", "Restrooms", "Gift shops", "Educational materials"],
  "weather_activities": {
    "sunny": ["Outdoor sculpture viewing", "Garden tours", "Architectural photography"],
    "any": ["Indoor exhibits", "Educational programs", "Guided tours"],
    "rainy": ["Indoor museum exploration", "Educational activities"]
  },
  "cost": "Free to $10 special exhibits",
  "accessibility": "High - most museums ADA compliant"
}
```

#### **Historical Sites & Markers**
```json
{
  "category": "Historical Site",
  "examples": [
    "Historical markers and monuments",
    "Heritage trail sites",
    "Historic districts for walking",
    "Interpretive centers",
    "Archaeological sites"
  ],
  "typical_amenities": ["Parking", "Interpretive signs", "Walking paths"],
  "weather_activities": {
    "sunny": ["Walking tours", "Photography", "Reading interpretive signs"],
    "cloudy": ["Historical exploration", "Self-guided tours"],
    "light_rain": ["Covered interpretive areas", "Brief visits"]
  },
  "cost": "Free",
  "accessibility": "Medium - varies by site"
}
```

### **3. Cultural Shopping & Browsing (Free to Low-Cost)**

#### **Antique & Vintage Stores**
```json
{
  "category": "Antique Store",
  "examples": [
    "Local antique shops and malls",
    "Vintage clothing and accessories stores",
    "Estate sale locations",
    "Consignment shops with vintage items",
    "Architectural salvage stores"
  ],
  "typical_amenities": ["Climate control", "Parking", "Restrooms (varies)", "Wide aisles"],
  "weather_activities": {
    "any": ["Browsing", "Treasure hunting", "Photography", "Historical exploration"],
    "hot": ["Air-conditioned refuge", "Cool indoor browsing"],
    "cold": ["Warm indoor activities", "Extended browsing time"],
    "rainy": ["Perfect indoor activity", "Extended shopping time"]
  },
  "cost": "Free browsing, purchases vary",
  "accessibility": "Medium - older buildings may have accessibility challenges"
}
```

#### **Bookstores (Independent & Used)**
```json
{
  "category": "Bookstore",
  "examples": [
    "Independent bookstores",
    "Used book shops",
    "Specialty book stores (travel, outdoor, etc.)",
    "Book exchanges and community libraries",
    "Comic book and graphic novel stores"
  ],
  "typical_amenities": ["Climate control", "Reading areas", "Coffee/cafe (some)", "Parking"],
  "weather_activities": {
    "any": ["Reading", "Browsing", "Literary exploration", "Research"],
    "rainy": ["Perfect cozy indoor activity", "Extended reading time"],
    "hot": ["Cool, quiet retreat", "Extended browsing"],
    "cold": ["Warm indoor sanctuary", "Comfortable reading environment"]
  },
  "cost": "Free browsing, purchases $5-25 typical",
  "accessibility": "Medium to High - varies by location"
}
```

#### **Music Stores (Records, Instruments, Audio)**
```json
{
  "category": "Music Store",
  "examples": [
    "Record shops (vinyl, CD, cassette)",
    "Musical instrument stores",
    "Audio equipment stores",
    "Music memorabilia shops",
    "Local music venue merchandise"
  ],
  "typical_amenities": ["Climate control", "Listening stations", "Parking", "Sound-isolated areas"],
  "weather_activities": {
    "any": ["Music discovery", "Listening", "Instrument browsing", "Cultural exploration"],
    "rainy": ["Perfect listening environment", "Extended browsing time"],
    "any_temperature": ["Climate-controlled comfort", "Acoustic experience"]
  },
  "cost": "Free browsing, purchases vary widely",
  "accessibility": "Medium - varies by store layout"
}
```

#### **Art Galleries & Studios**
```json
{
  "category": "Art Gallery",
  "examples": [
    "Local art galleries",
    "Artist studios with open viewing",
    "Cooperative art spaces",
    "Community art centers",
    "Pop-up art exhibitions"
  ],
  "typical_amenities": ["Climate control", "Good lighting", "Parking", "Artist interaction"],
  "weather_activities": {
    "any": ["Art appreciation", "Cultural exploration", "Photography (if allowed)", "Artist meetings"],
    "good_light": ["Optimal art viewing conditions"],
    "rainy": ["Perfect indoor cultural activity", "Extended viewing time"]
  },
  "cost": "Free viewing, art purchases vary",
  "accessibility": "High - most galleries ADA compliant"
}
```

#### **Thrift Stores & Consignment Shops**
```json
{
  "category": "Thrift Store",
  "examples": [
    "Goodwill and Salvation Army stores",
    "Local thrift shops",
    "Consignment clothing stores",
    "Furniture consignment stores",
    "Specialty resale shops (sporting goods, books, etc.)"
  ],
  "typical_amenities": ["Climate control", "Parking", "Restrooms", "Fitting rooms"],
  "weather_activities": {
    "any": ["Treasure hunting", "Browsing", "Shopping", "Finding unique items"],
    "hot": ["Air-conditioned shopping", "Cool indoor activity"],
    "cold": ["Warm indoor browsing", "Extended shopping time"],
    "rainy": ["Perfect indoor shopping activity", "No weather constraints"]
  },
  "cost": "Free browsing, very low-cost purchases ($1-20 typical)",
  "accessibility": "Medium to High - varies by location"
}
```

#### **Specialty & Hobby Stores**
```json
{
  "category": "Specialty Store",
  "examples": [
    "Comic book and gaming stores",
    "Craft and hobby shops",
    "Model and collectible stores",
    "Yarn and fabric stores",
    "Vintage toy and game stores"
  ],
  "typical_amenities": ["Climate control", "Specialized displays", "Parking", "Expert staff"],
  "weather_activities": {
    "any": ["Hobby exploration", "Learning", "Browsing collections", "Community interaction"],
    "rainy": ["Perfect indoor hobby time", "Extended browsing"],
    "any_temperature": ["Climate-controlled comfort", "Focus on interests"]
  },
  "cost": "Free browsing, purchases vary by hobby",
  "accessibility": "Medium - varies by store layout and age"
}
```

### **4. Low-Cost Recreation (<$10)**

#### **Municipal Facilities**
```json
{
  "category": "Municipal Facility",
  "examples": [
    "Public swimming pools",
    "Municipal golf courses",
    "Public tennis/basketball courts",
    "Community center activities",
    "Public boat ramps"
  ],
  "typical_amenities": ["Parking", "Restrooms", "Equipment rental", "Concessions"],
  "weather_activities": {
    "hot": ["Swimming", "Aquatic activities", "Shaded court sports"],
    "mild": ["Golf", "Tennis", "Basketball", "Walking tracks"],
    "cool": ["Indoor community center activities"]
  },
  "cost": "$3-8 admission/use fees",
  "accessibility": "High - public facilities ADA compliant"
}
```

#### **Educational & Nature Centers**
```json
{
  "category": "Nature Center",
  "examples": [
    "Environmental education centers",
    "Observatory and planetarium",
    "Science centers with outdoor components",
    "Botanical gardens (low-cost days)",
    "Wildlife rehabilitation centers"
  ],
  "typical_amenities": ["Parking", "Restrooms", "Educational programs", "Gift shop"],
  "weather_activities": {
    "sunny": ["Outdoor nature trails", "Garden exploration", "Wildlife viewing"],
    "any": ["Indoor exhibits", "Educational programs", "Planetarium shows"],
    "rainy": ["Indoor educational activities", "Interactive exhibits"]
  },
  "cost": "$5-10 admission",
  "accessibility": "High - educational facilities typically accessible"
}
```

---

## **📊 POI Data Structure**

### **Core POI Record Format**

```json
{
  "poi_id": "unique_identifier",
  "name": "Minnehaha Falls Regional Park",
  "category": "County Park",
  "subcategory": "Waterfall/Hiking",

  "location": {
    "address": "4801 S Minnehaha Dr, Minneapolis, MN 55417",
    "latitude": 44.9153,
    "longitude": -93.2111,
    "city": "Minneapolis",
    "county": "Hennepin",
    "state": "Minnesota"
  },

  "access_info": {
    "cost": "Free",
    "hours": "6:00 AM - 10:00 PM daily",
    "parking": "Free parking available",
    "accessibility": "Paved paths to main viewpoints",
    "pet_policy": "Dogs allowed on leash"
  },

  "amenities": [
    "Restrooms",
    "Parking",
    "Picnic areas",
    "Paved trails",
    "Dirt trails",
    "Scenic overlooks",
    "Historical interpretation"
  ],

  "activities": {
    "primary": ["Hiking", "Photography", "Picnicking"],
    "secondary": ["Running", "Nature walking", "Sightseeing"],
    "seasonal": ["Winter hiking", "Fall colors", "Spring wildflowers"]
  },

  "weather_suitability": {
    "hiking": {
      "excellent": ["Sunny", "Partly cloudy", "Cool and clear"],
      "good": ["Overcast", "Light breeze"],
      "fair": ["Light rain", "Very warm"],
      "poor": ["Heavy rain", "Thunderstorms", "Ice"]
    },
    "photography": {
      "excellent": ["Golden hour", "Dramatic clouds", "After rain"],
      "good": ["Overcast for even lighting"],
      "fair": ["Bright sun with harsh shadows"],
      "poor": ["Heavy rain", "Fog"]
    }
  },

  "seasonal_info": {
    "spring": "Waterfall peak flow, wildflowers blooming",
    "summer": "Full trail access, busy weekends",
    "fall": "Excellent fall colors, popular for photography",
    "winter": "Frozen waterfall views, icy trails"
  },

  "crowd_levels": {
    "low": ["Weekday mornings", "Winter months"],
    "medium": ["Weekday afternoons", "Spring/Fall weekdays"],
    "high": ["Summer weekends", "Fall color peak", "Holiday weekends"]
  },

  "nearby_services": {
    "restaurants": ["Sea Salt Eatery (on-site)", "Longfellow Grill (1 mile)"],
    "gas_stations": ["Holiday Station (2 miles)", "BP (1.5 miles)"],
    "gear_shops": ["REI (4 miles)", "Midwest Mountaineering (6 miles)"]
  }
}
```

### **Weather-Activity Matching Algorithm**

**Activity-Specific Weather Requirements**:

```json
{
  "weather_requirements": {
    "hiking": {
      "temperature_range": {"min": 20, "max": 85, "optimal": [50, 75]},
      "precipitation_max": 0.1,
      "wind_max": 20,
      "visibility_min": 2,
      "conditions_avoid": ["thunderstorms", "ice", "heavy_rain"]
    },
    "photography": {
      "temperature_range": {"min": 10, "max": 95, "optimal": [45, 80]},
      "precipitation_max": 0.05,
      "wind_max": 25,
      "visibility_min": 5,
      "conditions_prefer": ["golden_hour", "dramatic_clouds", "clear"]
    },
    "picnicking": {
      "temperature_range": {"min": 45, "max": 85, "optimal": [60, 78]},
      "precipitation_max": 0,
      "wind_max": 15,
      "conditions_avoid": ["rain", "high_wind", "extreme_heat"]
    },
    "water_activities": {
      "temperature_range": {"min": 65, "max": 95, "optimal": [70, 85]},
      "precipitation_max": 0,
      "wind_max": 10,
      "conditions_require": ["sunny", "warm"]
    },
    "cultural_browsing": {
      "temperature_range": {"min": -20, "max": 110, "optimal": [32, 95]},
      "precipitation_max": 999,
      "wind_max": 999,
      "visibility_min": 0,
      "conditions_prefer": ["rainy", "hot", "cold", "any"],
      "weather_bonus": {
        "rainy": "Perfect indoor activity - extended browsing time",
        "extreme_hot": "Cool air-conditioned refuge",
        "extreme_cold": "Warm indoor sanctuary",
        "perfect_outdoor": "Great alternative if outdoor spots are crowded"
      }
    },
    "antique_hunting": {
      "temperature_range": {"min": -20, "max": 110, "optimal": [32, 95]},
      "precipitation_max": 999,
      "wind_max": 999,
      "conditions_prefer": ["any"],
      "special_notes": "Weather-independent activity, perfect backup plan"
    },
    "book_browsing": {
      "temperature_range": {"min": -20, "max": 110, "optimal": [32, 95]},
      "precipitation_max": 999,
      "wind_max": 999,
      "conditions_prefer": ["rainy", "cozy"],
      "weather_bonus": {
        "rainy": "Perfect cozy reading weather",
        "cold": "Warm indoor reading environment"
      }
    },
    "art_appreciation": {
      "temperature_range": {"min": -20, "max": 110, "optimal": [32, 95]},
      "precipitation_max": 999,
      "wind_max": 999,
      "conditions_prefer": ["any"],
      "lighting_preference": "Overcast can provide even lighting for art viewing"
    },
    "thrift_shopping": {
      "temperature_range": {"min": -20, "max": 110, "optimal": [32, 95]},
      "precipitation_max": 999,
      "wind_max": 999,
      "conditions_prefer": ["any"],
      "weather_bonus": {
        "poor_outdoor": "Great treasure hunting when outdoor activities aren't viable"
      }
    },
    "music_discovery": {
      "temperature_range": {"min": -20, "max": 110, "optimal": [32, 95]},
      "precipitation_max": 999,
      "wind_max": 999,
      "conditions_prefer": ["any"],
      "special_features": "Sound-isolated environment perfect for music exploration"
    }
  }
}
```

---

## **🗺️ POI Discovery & Data Sources**

### **Primary Data Sources**

**Government Sources**:
- **National Park Service**: Official POI data for national parks/forests
- **State Park Systems**: Official state park information and amenities
- **County Park Departments**: Regional park data and facilities
- **Municipal Recreation Departments**: City park and facility information

**Crowdsourced Data**:
- **OpenStreetMap**: Community-maintained POI database
- **Google Places API**: Business and location information
- **User Contributions**: Community-added POI suggestions and updates
- **Local Knowledge**: Community input on lesser-known locations

**Quality Assurance**:
- **Verification Process**: All POIs verified for accuracy and current information
- **Regular Updates**: Quarterly updates for hours, amenities, and access
- **User Feedback**: Community reporting of changes or issues
- **Seasonal Monitoring**: Updates for seasonal closures or accessibility

### **POI Prioritization Algorithm**

**Ranking Factors**:
1. **Weather Suitability** (40%): How well current weather matches activity requirements
2. **Distance/Time** (25%): Travel time from user location
3. **Cost** (15%): Free activities prioritized over paid
4. **Amenities** (10%): Restrooms, parking, accessibility features
5. **User Ratings** (10%): Community feedback and ratings

**Example Ranking Calculation**:
```
POI Score = (Weather Match × 0.4) +
           (Distance Score × 0.25) +
           (Cost Score × 0.15) +
           (Amenity Score × 0.1) +
           (User Rating × 0.1)

Where:
- Weather Match: 0-100 based on activity requirements
- Distance Score: 100 - (drive_minutes × 2)
- Cost Score: Free=100, <$5=80, <$10=60
- Amenity Score: Points for each amenity present
- User Rating: 0-100 based on community feedback
```

---

## **📱 Mobile POI Display Optimization**

### **POI Marker Design**

**Map Marker Information Hierarchy**:
```
🌲        <- Category icon (park, museum, etc.)
🟢        <- Weather quality (green/yellow/orange/red)
FREE      <- Cost indicator (FREE, $5, $8, etc.)
25min     <- Drive time from current location
```

**POI Popup Card Design**:
```
┌─────────────────────────────────────────┐
│ 🌲 Minnehaha Falls Regional Park       │
│ ☀️ Excellent hiking weather (74°F)     │
│ 🚗 25 minutes • 💰 FREE admission      │
│                                        │
│ 🥾 Paved & dirt trails available       │
│ 📸 Stunning waterfall photography      │
│ 🚻 Restrooms & parking on-site         │
│ 👥 Medium crowds expected today        │
│                                        │
│ [🏪 REI Gear - 5 min from park]        │
│                                        │
│ [📍 Directions] [ℹ️ More Info]          │
└─────────────────────────────────────────┘
```

### **Context-Aware POI Filtering**

**Smart Filtering Logic**:
- **Weather-based**: Hide outdoor POIs during severe weather, show indoor alternatives
- **Time-based**: Filter by current hours of operation
- **Seasonal**: Show/hide seasonal activities based on time of year
- **Activity-based**: Only show POIs suitable for selected activities
- **Accessibility**: Filter based on user accessibility needs

**Dynamic POI Updates**:
- **Real-time weather**: Update weather suitability as conditions change
- **Crowd levels**: Estimate current crowd levels based on historical data
- **Special events**: Show temporary events or closures
- **Seasonal changes**: Update seasonal activity availability

This POI database specification ensures comprehensive coverage of free and low-cost activities while providing the weather intelligence needed to optimize outdoor experiences for mass market mobile users.
