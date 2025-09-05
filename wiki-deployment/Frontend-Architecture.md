# Frontend Architecture - Nearest Nice Weather

> **For GitHub Wiki**: Complete React frontend documentation for rapid developer onboarding

## 🏗️ Architecture Overview

**Technology Stack**:
- **Framework**: React 18.3.1 LTS with TypeScript
- **Build Tool**: Vite (fast development, optimized production builds)
- **UI Library**: Material-UI (MUI) v7 for component system
- **State Management**: React Query + React Context + Local Storage
- **Maps**: Leaflet with react-leaflet for interactive outdoor recreation discovery
- **PWA**: Vite PWA plugin for mobile-first experience

## 📁 Project Structure

```
apps/web/src/
├── components/           # Reusable UI components
│   ├── ads/             # Ad management components
│   ├── ui/              # Basic UI primitives (Button, etc.)
│   └── __tests__/       # Component tests
├── hooks/               # Custom React hooks
├── services/            # Business logic services
├── utils/               # Pure utility functions
├── types/               # TypeScript type definitions
├── providers/           # React context providers
└── styles/              # CSS and styling
```

## 🧩 Core Components

### 1. App Component (`App.tsx`)
**Purpose**: Main application shell with route-less SPA architecture

```typescript
// Key responsibilities:
// - User location management
// - POI data fetching and caching
// - Weather filtering coordination
// - Map state management

export default function App() {
  const [userLocation, setUserLocation] = useLocalStorageState<[number, number] | null>('userLocation', null);
  const [weatherFilters, setWeatherFilters] = useWeatherFiltersStorage();

  // Primary data fetching hook
  const {
    data: poisWithWeather,
    loading,
    error,
    refetch
  } = usePOILocations({
    userLocation,
    filters: weatherFilters,
    autoRefresh: true
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <EnhancedLocationManager
          userLocation={userLocation}
          onLocationUpdate={setUserLocation}
        />

        <MapContainer
          pois={poisWithWeather}
          userLocation={userLocation}
          onLocationSelect={setUserLocation}
        />

        <FabFilterSystem
          filters={weatherFilters}
          onFiltersChange={setWeatherFilters}
          resultCount={poisWithWeather?.length || 0}
        />

        <UnifiedStickyFooter />
      </Box>
    </QueryClientProvider>
  );
}
```

### 2. EnhancedLocationManager (`EnhancedLocationManager.tsx`)
**Purpose**: User location detection and management

```typescript
interface LocationManagerProps {
  userLocation: [number, number] | null;
  onLocationUpdate: (location: [number, number] | null) => void;
}

export default function EnhancedLocationManager({ userLocation, onLocationUpdate }: LocationManagerProps) {
  const locationEstimator = new UserLocationEstimator();

  const handleGeolocationRequest = async () => {
    try {
      // High-accuracy geolocation with fallbacks
      const location = await locationEstimator.getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      });

      onLocationUpdate([location.lat, location.lng]);
    } catch (error) {
      // Fallback to IP-based location
      const ipLocation = await locationEstimator.getIPLocation();
      onLocationUpdate([ipLocation.lat, ipLocation.lng]);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 2, m: 1 }}>
      <Typography variant="h6">Find Outdoor Activities Near You</Typography>

      {!userLocation ? (
        <Button
          variant="contained"
          onClick={handleGeolocationRequest}
          startIcon={<LocationOnIcon />}
        >
          Get My Location
        </Button>
      ) : (
        <Chip
          label={`Location: ${userLocation[0].toFixed(3)}, ${userLocation[1].toFixed(3)}`}
          onDelete={() => onLocationUpdate(null)}
          deleteIcon={<ClearIcon />}
        />
      )}
    </Paper>
  );
}
```

### 3. MapContainer (`MapContainer.tsx`)
**Purpose**: Interactive Leaflet map with POI markers

```typescript
interface MapContainerProps {
  pois: POIWithWeather[];
  userLocation: [number, number] | null;
  onLocationSelect: (location: [number, number]) => void;
}

export default function MapContainer({ pois, userLocation, onLocationSelect }: MapContainerProps) {
  const mapRef = useRef<L.Map>(null);
  const [mapCenter, setMapCenter] = useMapViewStorage();

  // Auto-center map when user location changes
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView(userLocation, 10);
      setMapCenter({ center: userLocation, zoom: 10 });
    }
  }, [userLocation]);

  return (
    <Box sx={{ flexGrow: 1, position: 'relative' }}>
      <MapContainer
        center={mapCenter.center}
        zoom={mapCenter.zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {/* POI markers with weather info */}
        {pois.map(poi => (
          <Marker
            key={poi.id}
            position={[poi.lat, poi.lng]}
            icon={createPOIIcon(poi.park_type, poi.temperature)}
          >
            <Popup>
              <POIPopupContent poi={poi} />
            </Popup>
          </Marker>
        ))}

        {/* Click handler for manual location selection */}
        <MapClickHandler onLocationSelect={onLocationSelect} />
      </MapContainer>
    </Box>
  );
}
```

### 4. FabFilterSystem (`FabFilterSystem.tsx`)
**Purpose**: Floating action button with weather filtering

```typescript
interface FabFilterSystemProps {
  filters: WeatherFilters;
  onFiltersChange: (filters: WeatherFilters) => void;
  resultCount: number;
}

export default function FabFilterSystem({ filters, onFiltersChange, resultCount }: FabFilterSystemProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Main filter FAB */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 16 }}
        onClick={() => setOpen(true)}
      >
        <FilterIcon />
        {resultCount > 0 && (
          <Badge badgeContent={resultCount} color="secondary" />
        )}
      </Fab>

      {/* Filter dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Weather Preferences</DialogTitle>
        <DialogContent>
          <FilterForm
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Apply Filters</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Weather filter form component
function FilterForm({ filters, onFiltersChange }: FilterFormProps) {
  return (
    <Stack spacing={3}>
      <FormControl fullWidth>
        <InputLabel>Temperature Preference</InputLabel>
        <Select
          value={filters.temperature}
          onChange={(e) => onFiltersChange({ ...filters, temperature: e.target.value })}
        >
          <MenuItem value="">Any Temperature</MenuItem>
          <MenuItem value="cold">Cold Weather (❄️)</MenuItem>
          <MenuItem value="mild">Mild Weather (🌤️)</MenuItem>
          <MenuItem value="hot">Hot Weather (🔥)</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Precipitation</InputLabel>
        <Select
          value={filters.precipitation}
          onChange={(e) => onFiltersChange({ ...filters, precipitation: e.target.value })}
        >
          <MenuItem value="">Any Conditions</MenuItem>
          <MenuItem value="none">No Rain (☀️)</MenuItem>
          <MenuItem value="light">Light Rain OK (🌦️)</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Wind Conditions</InputLabel>
        <Select
          value={filters.wind}
          onChange={(e) => onFiltersChange({ ...filters, wind: e.target.value })}
        >
          <MenuItem value="">Any Wind</MenuItem>
          <MenuItem value="calm">Calm (🌬️)</MenuItem>
          <MenuItem value="light">Light Breeze</MenuItem>
          <MenuItem value="breezy">Breezy</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}
```

## 🪝 Custom Hooks

### 1. usePOILocations Hook
**Purpose**: Primary data fetching with weather integration

```typescript
interface UsePOILocationsOptions {
  userLocation: [number, number] | null;
  filters: WeatherFilters;
  autoRefresh?: boolean;
}

export function usePOILocations({ userLocation, filters, autoRefresh = false }: UsePOILocationsOptions) {
  return useQuery({
    queryKey: ['poi-locations', userLocation, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (userLocation) {
        params.append('lat', userLocation[0].toString());
        params.append('lng', userLocation[1].toString());
      }

      // Add weather filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(`filters[${key}]`, value);
      });

      const response = await fetch(`/api/poi-locations-with-weather?${params}`);
      if (!response.ok) throw new Error('Failed to fetch POI locations');

      const data = await response.json();
      return data.data as POIWithWeather[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: autoRefresh ? 10 * 60 * 1000 : false, // 10 minutes if auto-refresh
    enabled: true // Always fetch, even without user location
  });
}
```

### 2. useLocalStorageState Hook
**Purpose**: Persistent state management across sessions

```typescript
export function useLocalStorageState<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return defaultValue;

      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);

      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setValue];
}

// Typed storage hooks for specific data
export const useWeatherFiltersStorage = () =>
  useLocalStorageState<WeatherFilters>('weatherFilters', {
    temperature: 'mild',
    precipitation: 'none',
    wind: 'calm'
  });

export const useMapViewStorage = () =>
  useLocalStorageState<MapViewSettings>('mapView', {
    center: [46.7296, -94.6859], // Minnesota center
    zoom: 7
  });
```

### 3. useFeedbackSubmission Hook
**Purpose**: React Query mutation for user feedback

```typescript
export function useFeedbackSubmission(options?: {
  onSuccess?: (data: FeedbackSubmissionResponse) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedback: FeedbackFormData): Promise<FeedbackSubmissionResponse> => {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });

      if (!response.ok) {
        throw new Error(`Feedback submission failed: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate feedback-related queries
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
    retry: (failureCount, error) => {
      // Don't retry client errors (400-499)
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status;
        return status >= 500 && failureCount < 2;
      }
      return failureCount < 2;
    }
  });
}
```

## 🛠️ Services Layer

### 1. UserLocationEstimator
**Purpose**: Intelligent location detection with fallbacks

```typescript
export class UserLocationEstimator {
  private confidenceThresholds = {
    high: { accuracy: 100, age: 300000 },    // 100m, 5 minutes
    medium: { accuracy: 1000, age: 900000 }, // 1km, 15 minutes
    low: { accuracy: 5000, age: 1800000 }    // 5km, 30 minutes
  };

  async getCurrentLocation(options: GeolocationOptions = {}): Promise<LocationEstimate> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const estimate: LocationEstimate = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
            method: 'geolocation',
            confidence: this.calculateConfidence(position.coords.accuracy, 0)
          };
          resolve(estimate);
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
          ...options
        }
      );
    });
  }

  async getIPLocation(): Promise<LocationEstimate> {
    // Fallback IP-based location estimation
    // Implementation would call IP geolocation service
    return {
      lat: 44.9537, // Minneapolis default
      lng: -93.0900,
      accuracy: 10000, // 10km accuracy for IP location
      timestamp: Date.now(),
      method: 'ip',
      confidence: 'low'
    };
  }

  private calculateConfidence(accuracy: number, age: number): 'high' | 'medium' | 'low' {
    if (accuracy <= this.confidenceThresholds.high.accuracy && age <= this.confidenceThresholds.high.age) {
      return 'high';
    } else if (accuracy <= this.confidenceThresholds.medium.accuracy && age <= this.confidenceThresholds.medium.age) {
      return 'medium';
    }
    return 'low';
  }
}
```

### 2. WeatherFilteringService
**Purpose**: Advanced weather-based POI filtering

```typescript
export class WeatherFilteringService {
  filterByWeather(locations: POIWithWeather[], filters: WeatherFilters): POIWithWeather[] {
    if (!filters || this.isEmptyFilters(filters)) return locations;

    let filtered = [...locations];

    // Temperature filtering with percentile-based thresholds
    if (filters.temperature) {
      filtered = this.filterByTemperature(filtered, filters.temperature);
    }

    // Precipitation filtering
    if (filters.precipitation) {
      filtered = this.filterByPrecipitation(filtered, filters.precipitation);
    }

    // Wind filtering
    if (filters.wind) {
      filtered = this.filterByWind(filtered, filters.wind);
    }

    return filtered;
  }

  private filterByTemperature(locations: POIWithWeather[], preference: string): POIWithWeather[] {
    const temps = locations.map(loc => loc.temperature).sort((a, b) => a - b);
    const tempCount = temps.length;

    switch (preference) {
      case 'cold':
        const coldThreshold = temps[Math.floor(tempCount * 0.4)];
        return locations.filter(loc => loc.temperature <= coldThreshold);

      case 'hot':
        const hotThreshold = temps[Math.floor(tempCount * 0.6)];
        return locations.filter(loc => loc.temperature >= hotThreshold);

      case 'mild':
        const minThreshold = temps[Math.floor(tempCount * 0.1)];
        const maxThreshold = temps[Math.floor(tempCount * 0.9)];
        return locations.filter(loc =>
          loc.temperature >= minThreshold && loc.temperature <= maxThreshold
        );

      default:
        return locations;
    }
  }

  private filterByPrecipitation(locations: POIWithWeather[], preference: string): POIWithWeather[] {
    switch (preference) {
      case 'none':
        return locations.filter(loc => loc.precipitation === 0);
      case 'light':
        return locations.filter(loc => loc.precipitation <= 5); // 5mm or less
      default:
        return locations;
    }
  }

  private filterByWind(locations: POIWithWeather[], preference: string): POIWithWeather[] {
    switch (preference) {
      case 'calm':
        return locations.filter(loc => parseInt(loc.wind_speed) <= 5); // 5 mph or less
      case 'light':
        return locations.filter(loc => parseInt(loc.wind_speed) <= 10);
      case 'breezy':
        return locations.filter(loc => parseInt(loc.wind_speed) <= 20);
      default:
        return locations;
    }
  }
}
```

## 🎨 Styling and Theming

### Material-UI Theme Configuration
```typescript
// theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3', // Blue for outdoor/water activities
    },
    secondary: {
      main: '#4caf50', // Green for nature/parks
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiFab: {
      styleOverrides: {
        root: {
          position: 'fixed',
          bottom: 16,
          right: 16,
        },
      },
    },
  },
});
```

### Custom CSS for Map Popups
```css
/* poi-popup.css */
.poi-popup-content {
  min-width: 250px;
  max-width: 300px;
}

.poi-popup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.poi-weather-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
}

.poi-temperature {
  font-size: 1.2em;
  font-weight: bold;
  color: #1976d2;
}

.poi-distance {
  color: #666;
  font-size: 0.9em;
}
```

## 🧪 Testing Patterns

### Component Testing with React Testing Library
```typescript
// Example: EnhancedLocationManager.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EnhancedLocationManager from '../EnhancedLocationManager';

describe('EnhancedLocationManager', () => {
  let mockOnLocationUpdate: jest.Mock;
  let queryClient: QueryClient;

  beforeEach(() => {
    mockOnLocationUpdate = jest.fn();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });
  });

  it('should display location request button when no location provided', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <EnhancedLocationManager
          userLocation={null}
          onLocationUpdate={mockOnLocationUpdate}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Get My Location')).toBeInTheDocument();
  });

  it('should display current location when provided', () => {
    const location: [number, number] = [44.9537, -93.0900];

    render(
      <QueryClientProvider client={queryClient}>
        <EnhancedLocationManager
          userLocation={location}
          onLocationUpdate={mockOnLocationUpdate}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Location: 44\.954, -93\.090/)).toBeInTheDocument();
  });
});
```

### Hook Testing Pattern
```typescript
// Example: usePOILocations.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePOILocations } from '../usePOILocations';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePOILocations', () => {
  it('should fetch POI locations with weather data', async () => {
    const { result } = renderHook(
      () => usePOILocations({
        userLocation: [44.9537, -93.0900],
        filters: { temperature: 'mild', precipitation: 'none', wind: 'calm' }
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});
```

## 🚀 Performance Optimizations

### React Query Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('404')) {
          return false; // Don't retry 404s
        }
        return failureCount < 3;
      }
    }
  }
});
```

### Memoization for Expensive Calculations
```typescript
// Distance calculations are memoized
const MemoizedMapContainer = memo(MapContainer, (prevProps, nextProps) => {
  return (
    prevProps.pois.length === nextProps.pois.length &&
    prevProps.userLocation?.[0] === nextProps.userLocation?.[0] &&
    prevProps.userLocation?.[1] === nextProps.userLocation?.[1]
  );
});
```

### Bundle Optimization
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          maps: ['leaflet', 'react-leaflet'],
          query: ['@tanstack/react-query']
        }
      }
    }
  }
});
```

## 🔧 Development Workflow

### Local Development Setup
```bash
# Install dependencies
npm install

# Start development server (includes API)
npm start

# Frontend only (if API running separately)
cd apps/web && npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Build for production
npm run build
```

### Common Development Tasks
```bash
# Add new component
mkdir apps/web/src/components/NewComponent
touch apps/web/src/components/NewComponent/index.tsx
touch apps/web/src/components/NewComponent/__tests__/NewComponent.test.tsx

# Add new hook
touch apps/web/src/hooks/useNewHook.ts
touch apps/web/src/hooks/__tests__/useNewHook.test.ts

# Update API integration
# 1. Modify dev-api-server.js
# 2. Update corresponding apps/web/api/*.js
# 3. Test with: ./scripts/environment-validation.sh localhost
```

This frontend architecture provides a solid foundation for rapid development while maintaining type safety, testability, and performance optimizations for the outdoor recreation discovery platform.
