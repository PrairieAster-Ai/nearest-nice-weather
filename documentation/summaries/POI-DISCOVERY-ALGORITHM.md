# POI Discovery Algorithm - Minnesota Outdoor Recreation Platform

## **Business Objective**
Enable users to discover outdoor recreation locations (parks, trails, nature areas) based on their weather preferences, starting from their location and expanding outward as needed.

## **Core User Experience Flow**

### **1. Initial Discovery**
- **User Action**: Opens app, allows location access
- **System Response**: 
  - Detect user location (GPS → IP → fallback)
  - Fetch POI locations within 50-mile radius
  - Apply weather filters (temperature, precipitation, wind preferences)
  - Display 3-10 best matches on map with weather data
  - Show user avatar marker (draggable for location adjustment)

### **2. POI Navigation**
- **User Action**: Clicks marker popup, uses "Closer" or "Farther" buttons
- **System Response**:
  - **"Closer"**: Navigate to next POI closer to user avatar
  - **"Farther"**: Navigate to next POI farther from user avatar
  - **End of results**: Show completion indicator (thumbs up)
  - **Smooth animation**: Pan to marker, open popup automatically

### **3. Radius Expansion (+30m Button)**
- **User Action**: Clicks "+30m More Options" in any marker popup
- **System Response**:
  - **Keep existing markers visible** on map
  - **Expand search radius** by ~30 miles (approximately 30 minutes driving time)
  - **Fetch additional POI locations** within expanded radius
  - **Apply same weather filters** to expanded dataset
  - **Add new qualifying markers** to map
  - **Enable navigation** through all visible markers (original + expanded)

## **Technical Requirements**

### **Data Management**
```
Base Search: 50 miles → ~20-50 POI locations
+30m Expansion 1: 80 miles → ~60-80 total POI locations  
+30m Expansion 2: 110 miles → ~90-120 total POI locations
+30m Expansion 3: 140 miles → ~120-150 total POI locations
```

### **State Management**
- **apiLocations**: Combined array of base + all expanded locations
- **filteredLocations**: Subset meeting weather criteria
- **markersRef**: Map marker references corresponding to filteredLocations
- **expansionCount**: Track number of +30m expansions performed
- **isRadiusExpansion**: Flag to preserve markers during expansion

### **Marker Lifecycle**
1. **Location Change**: Clear all markers, reload from scratch
2. **Filter Change**: Clear markers, recreate from filtered dataset
3. **Radius Expansion**: Preserve existing markers, add new ones only

### **Navigation Logic**
- **Distance Calculation**: Euclidean distance from user avatar to each POI
- **Closer Navigation**: Find next POI with shorter distance than current
- **Farther Navigation**: Find next POI with longer distance than current
- **Boundary Handling**: Show completion indicator when no more results

## **Drive Time Considerations**

### **30-Mile ≈ 30-Minute Rule**
- **Highway driving**: ~60 mph average = 30 miles in 30 minutes
- **Rural Minnesota**: Mix of highways and local roads
- **User expectation**: "Show me options within reasonable driving distance"
- **Progressive discovery**: Start close, expand outward as needed

### **Expansion Strategy**
```
Base: 50 miles (≈45-60 minutes drive)
+30m: 80 miles (≈70-90 minutes drive)  
+30m: 110 miles (≈100-120 minutes drive)
+30m: 140 miles (≈130-150 minutes drive)
```

## **Weather Filtering Strategy**

### **Initial Search (Base Radius)**
- **Restrictive filtering**: Show best weather matches
- **Temperature**: Middle 60% of available range
- **Precipitation**: Lowest 30% (driest conditions)
- **Wind**: Lowest 30% (calmest conditions)

### **Expanded Search (+30m)**  
- **Inclusive filtering**: Show more variety as radius grows
- **Temperature**: Middle 80% of available range
- **Precipitation**: Lowest 50% (moderate conditions)
- **Wind**: Lowest 50% (reasonable conditions)

## **Success Criteria**

### **User Experience**
1. **Immediate Results**: 3-10 relevant POI options within 50 miles
2. **Progressive Discovery**: Each +30m expansion shows 5-15 additional options
3. **Marker Persistence**: Previous discoveries remain visible during expansion
4. **Smooth Navigation**: Closer/Farther buttons work through all visible markers
5. **Natural Boundaries**: Clear indication when reaching end of results

### **Technical Performance**
1. **Fast Initial Load**: <2 seconds to show first results
2. **Smooth Expansion**: <1 second to add new markers
3. **Responsive Navigation**: <0.5 seconds between marker transitions
4. **Memory Efficiency**: Handle 100+ markers without performance degradation

## **Edge Cases & Error Handling**

### **No Results Scenarios**
- **Initial search**: Relax filters progressively until results found
- **Expansion**: Show message if no new locations found
- **Navigation**: Thumbs up indicator when reaching boundaries

### **Data Quality Issues**
- **Missing weather data**: Show POI with weather disclaimer
- **Invalid coordinates**: Skip and log for investigation
- **API timeouts**: Show cached results with refresh option

## **Implementation Priority**

### **Phase 1: Core Functionality**
1. ✅ Base POI search with weather filtering
2. ✅ User location detection and marker display
3. ✅ Basic marker popups with weather data

### **Phase 2: Navigation System**
1. 🔄 **CURRENT WORK**: Distance-based marker navigation
2. 🔄 **CURRENT WORK**: Radius expansion with marker preservation
3. ⏳ Smooth animations and user feedback

### **Phase 3: Polish & Optimization**
1. ⏳ Advanced filtering options
2. ⏳ Performance optimization for large datasets
3. ⏳ Mobile responsiveness and touch optimization

---

**This document serves as the single source of truth for POI discovery behavior.**