# Developer Quick Start Guide - Nearest Nice Weather

> **For GitHub Wiki**: Complete onboarding guide for new developers

## 🎯 Welcome to Nearest Nice Weather!

**What You're Building**: B2C outdoor recreation discovery platform helping Minnesota residents find parks, trails, and nature centers with perfect weather conditions.

**Tech Stack**: React + TypeScript + Material-UI frontend, Node.js/Vercel serverless backend, Neon PostgreSQL database

**Business Context**: 138 Minnesota outdoor POIs, targeting 10,000+ casual outdoor enthusiasts, ad-supported free platform

## ⚡ 5-Minute Setup

### Prerequisites
```bash
# Required versions
node --version    # v20.18.0+ (LTS)
npm --version     # v10.8.0+
git --version     # v2.0+
```

### 1. Clone and Install
```bash
git clone https://github.com/PrairieAster-Ai/nearest-nice-weather.git
cd nearest-nice-weather
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# DATABASE_URL=postgresql://username:password@hostname/database
# OPENWEATHER_API_KEY=your_api_key_here (optional for development)
```

### 3. Start Development Environment
```bash
# One command starts everything:
npm start

# This automatically:
# ✅ Starts API server (port 4000)
# ✅ Starts frontend (port 3003) 
# ✅ Runs health checks
# ✅ Provides real-time monitoring
```

### 4. Verify Setup
```bash
# Validate environment health
./scripts/environment-validation.sh localhost

# Check API endpoints
curl http://localhost:4000/api/health
curl "http://localhost:4000/api/poi-locations?limit=5"

# Open frontend
open http://localhost:3003
```

**Expected Result**: Interactive map showing Minnesota outdoor recreation locations with weather data.

## 🗺️ Codebase Navigation

### Key Files for New Developers
```
📁 Project Root
├── 🔧 dev-api-server.js           # Main API (localhost development)
├── 📋 CLAUDE.md                   # Project context and rules
├── 📖 README.md                   # Business overview
└── 🚀 package.json               # Dependencies and scripts

📁 apps/web/                       # Frontend React application
├── 📁 api/                        # Production API (Vercel functions)
│   ├── poi-locations-with-weather.js  # Primary POI+weather endpoint
│   ├── feedback.js                     # User feedback collection
│   └── health.js                       # System health monitoring
├── 📁 src/
│   ├── 🎯 App.tsx                 # Main application component
│   ├── 📁 components/             # Reusable UI components
│   │   ├── EnhancedLocationManager.tsx  # User location detection
│   │   ├── MapContainer.tsx             # Interactive Leaflet map
│   │   ├── FabFilterSystem.tsx          # Weather filtering UI
│   │   └── UnifiedStickyFooter.tsx      # App footer with feedback
│   ├── 📁 hooks/                  # Custom React hooks
│   │   ├── usePOILocations.ts           # Primary data fetching
│   │   ├── useLocalStorageState.ts      # Persistent state management
│   │   └── useFeedbackSubmission.ts     # User feedback submission
│   ├── 📁 services/               # Business logic
│   │   ├── UserLocationEstimator.ts     # Location detection algorithms
│   │   ├── WeatherFilteringService.ts   # Weather-based POI filtering
│   │   └── weatherApi.ts                # Weather API integration
│   └── 📁 utils/                  # Pure utility functions
│       ├── poiNavigationUtils.ts        # Distance/navigation calculations
│       ├── locationEstimationUtils.ts   # Location scoring algorithms
│       └── weatherFilteringUtils.ts     # Weather filtering logic

📁 documentation/                  # Technical documentation (migrated to wiki)
📁 scripts/                       # Development automation tools
└── 📁 tests/                     # Test suites and fixtures
```

### Essential Directories
- **`apps/web/src/components/`** - React UI components (Material-UI based)
- **`apps/web/src/hooks/`** - Custom hooks for data and state management
- **`apps/web/api/`** - Production serverless functions (Vercel)
- **`apps/web/src/services/`** - Business logic and external integrations

## 🔧 Development Workflow

### Daily Development
```bash
# Start your day
npm start                          # Starts frontend + API
./scripts/environment-validation.sh localhost  # Health check

# Make changes to components, hooks, or API
# Hot reload works for frontend, restart needed for API changes

# Test your changes
npm test                          # Run test suite
npm run type-check               # TypeScript validation
curl http://localhost:4000/api/health  # API health check
```

### Common Tasks

#### Adding a New React Component
```bash
# 1. Create component directory
mkdir apps/web/src/components/NewComponent

# 2. Create component file
cat > apps/web/src/components/NewComponent/index.tsx << 'EOF'
import React from 'react';
import { Box, Typography } from '@mui/material';

interface NewComponentProps {
  title: string;
}

export default function NewComponent({ title }: NewComponentProps) {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">{title}</Typography>
    </Box>
  );
}
EOF

# 3. Create test file
cat > apps/web/src/components/NewComponent/__tests__/NewComponent.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react';
import NewComponent from '../index';

describe('NewComponent', () => {
  it('should render with title', () => {
    render(<NewComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
EOF

# 4. Import and use in App.tsx
# Add: import NewComponent from './components/NewComponent';
```

#### Adding a New API Endpoint
```bash
# 1. Add to development server (dev-api-server.js)
# Add route: app.get('/api/new-endpoint', async (req, res) => { ... });

# 2. Create production function
cat > apps/web/api/new-endpoint.js << 'EOF'
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    const result = await sql`SELECT 'Hello World' as message`;
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
EOF

# 3. Test both environments
curl http://localhost:4000/api/new-endpoint
npm run deploy:preview  # Test on Vercel
```

#### Adding a Custom Hook
```bash
# 1. Create hook file
cat > apps/web/src/hooks/useNewHook.ts << 'EOF'
import { useState, useEffect } from 'react';

export function useNewHook(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    // Side effects here
    console.log('Value changed:', value);
  }, [value]);
  
  return { value, setValue };
}
EOF

# 2. Create test file
cat > apps/web/src/hooks/__tests__/useNewHook.test.ts << 'EOF'
import { renderHook, act } from '@testing-library/react';
import { useNewHook } from '../useNewHook';

describe('useNewHook', () => {
  it('should initialize with provided value', () => {
    const { result } = renderHook(() => useNewHook('initial'));
    expect(result.current.value).toBe('initial');
  });
});
EOF
```

## 🗃️ Database Interaction

### Querying POI Data
```javascript
// Development (pg pool in dev-api-server.js)
const result = await pool.query(`
  SELECT id, name, lat, lng, park_type, description,
         (3959 * acos(cos(radians($1)) * cos(radians(lat)) * 
          cos(radians(lng) - radians($2)) + sin(radians($1)) * 
          sin(radians(lat)))) as distance_miles
  FROM poi_locations 
  WHERE park_type IS NOT NULL
  ORDER BY distance_miles ASC
  LIMIT $3
`, [userLat, userLng, limit]);

// Production (Neon serverless in apps/web/api/*.js)
const locations = await sql`
  SELECT id, name, lat, lng, park_type, description,
         (3959 * acos(cos(radians(${userLat})) * cos(radians(lat)) * 
          cos(radians(lng) - radians(${userLng})) + sin(radians(${userLat})) * 
          sin(radians(lat)))) as distance_miles
  FROM poi_locations 
  WHERE park_type IS NOT NULL
  ORDER BY distance_miles ASC
  LIMIT ${limit}
`;
```

### Sample POI Data Structure
```javascript
{
  id: 1,
  name: "Gooseberry Falls State Park",
  lat: 47.1389,
  lng: -91.4706,
  park_type: "State Park",
  description: "Spectacular waterfalls and Lake Superior hiking",
  place_rank: 15,
  distance_miles: 45.2
}
```

## 🧪 Testing

### Running Tests
```bash
# All tests
npm test

# Specific test file
npm test src/hooks/__tests__/usePOILocations.test.ts

# Test with coverage
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

### Writing Tests
```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from '../MyComponent';

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

describe('MyComponent', () => {
  it('should handle user interaction', async () => {
    render(<MyComponent />, { wrapper: createWrapper() });
    
    fireEvent.click(screen.getByText('Click Me'));
    
    expect(await screen.findByText('Clicked!')).toBeInTheDocument();
  });
});
```

## 🚀 Deployment

### Preview Deployment
```bash
# Deploy to preview environment for testing
npm run deploy:preview

# Verify deployment
./scripts/environment-validation.sh preview
open https://p.nearestniceweather.com
```

### Production Deployment
```bash
# Deploy to production (requires confirmation)
npm run deploy:production

# Monitor deployment
./scripts/environment-validation.sh production
open https://nearestniceweather.com
```

## 🐛 Debugging

### Common Issues and Solutions

#### 1. "Database connection failed"
```bash
# Check environment variables
echo $DATABASE_URL

# Test database connectivity
node -e "const {Pool} = require('pg'); new Pool({connectionString: process.env.DATABASE_URL}).query('SELECT 1').then(console.log)"

# Verify Neon database is running
curl https://console.neon.tech/api/v2/projects
```

#### 2. "API endpoint not found"
```bash
# Check if API server is running
curl http://localhost:4000/api/health

# Restart API server
npm run api:restart

# Check for syntax errors
node --check dev-api-server.js
```

#### 3. "Frontend won't load"
```bash
# Check if frontend server is running
curl http://localhost:3003

# Clear cache and restart
rm -rf node_modules/.cache
npm start

# Check for TypeScript errors
npm run type-check
```

#### 4. "Tests failing"
```bash
# Update test environment
npm test -- --update-snapshot

# Clear test cache
npm test -- --clear-cache

# Run tests with verbose output
npm test -- --verbose
```

### Debug Mode
```bash
# Run with debug logging
DEBUG=* npm start

# API debug mode
NODE_ENV=development DEBUG=api:* node dev-api-server.js

# Frontend debug mode
VITE_DEBUG=true npm run dev
```

## 📚 Key Concepts

### Business Model Understanding
- **Target Users**: Casual outdoor enthusiasts in Minnesota
- **Primary Use Case**: "Find parks with nice weather for weekend activities"
- **Data Model**: 138 outdoor recreation POIs (NOT cities or weather stations)
- **Revenue**: Ad-supported free platform (NO premium features)

### Technical Architecture
- **Dual API**: Express.js (development) + Vercel Functions (production)
- **Database**: Neon PostgreSQL with poi_locations table
- **Frontend**: React SPA with Material-UI and Leaflet maps
- **State Management**: React Query + localStorage for persistence

### Weather Integration
- **Current**: Mock weather data for development/testing
- **Future**: Real OpenWeather API integration planned
- **Filtering**: Percentile-based relative weather preferences

## 🆘 Getting Help

### Internal Resources
- **Project Context**: Read `/CLAUDE.md` for complete business context
- **API Documentation**: See `WIKI-API-REFERENCE.md`
- **Frontend Guide**: See `WIKI-FRONTEND-ARCHITECTURE.md`
- **Database Schema**: See `WIKI-DATABASE-SCHEMA.md`

### Development Commands
```bash
# Health check everything
./scripts/environment-validation.sh localhost

# View logs
npm run logs

# Debug build issues
npm run build -- --debug

# Performance analysis
npm run analyze
```

### Emergency Procedures
```bash
# Rollback to last known good state
git checkout ui-working-baseline

# Emergency database backup
pg_dump $DATABASE_URL > emergency_backup.sql

# Quick environment reset
npm run reset:environment
```

## 🎯 Next Steps

1. **Explore the codebase**: Start with `App.tsx` and follow the data flow
2. **Run the test suite**: `npm test` to understand test patterns
3. **Make a small change**: Update a component and see it hot reload
4. **Deploy to preview**: `npm run deploy:preview` to test full deployment
5. **Read business context**: Review `/CLAUDE.md` for project goals and constraints

**Welcome to the team! 🎉** You're now ready to contribute to Minnesota's premier outdoor recreation discovery platform.