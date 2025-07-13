# Database Environment Management Guide

**Created**: July 13, 2025  
**Purpose**: Prevent environment variable chaos that caused 2+ hour debugging session

## 🎯 Core Principle

**ONE DATABASE, ONE VARIABLE, ONE SOURCE OF TRUTH**

Never mix local and cloud database connections. Never use multiple conflicting environment variables.

## 📊 Current Environment Setup

### **Production Configuration** ✅
```bash
# Vercel Environment Variables
WEATHERDB_URL="postgresql://neondb_owner:npg_XkT6pUoGn1WS@ep-green-wave-addgnozu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Database Schema
Database: weather (Neon)
Tables: locations (30 records), weather_conditions (30 records), tourism_operators (5 records)
Driver: @neondatabase/serverless
```

### **API Function Pattern** ✅
```javascript
import { neon } from '@neondatabase/serverless'

// Single, consistent variable name
const sql = neon(process.env.WEATHERDB_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL)

// Neon serverless query syntax
const result = await sql`SELECT * FROM locations LIMIT ${limit}`
```

## 🚫 Anti-Patterns That Cause Issues

### **Multiple Database Variables**
```bash
# ❌ WRONG - Creates confusion about which database to use
DATABASE_URL="postgresql://localhost:5432/weather_intelligence"
POSTGRES_URL="postgresql://neon_host/nearestniceweather" 
WEATHERDB_URL="postgresql://neon_host/weather"
DATABASE_URL_ALT="postgresql://neon_host/feedback-db"
```

### **Mixed Local/Cloud Configuration**
```bash
# ❌ WRONG - Local env pointing to localhost while production uses cloud
# .env (local)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/weather_intelligence"

# Vercel (production) 
POSTGRES_URL="postgresql://neon_host/cloud_db"
```

### **Wrong Database Driver**
```javascript
// ❌ WRONG - pg driver doesn't work properly in Vercel serverless
import { Pool } from 'pg'
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000
})
```

## ✅ Correct Patterns

### **Single Variable Strategy**
```bash
# Use ONE primary variable name across all environments
WEATHERDB_URL="[connection string for weather database]"

# API functions check this first, with fallbacks for legacy compatibility
const sql = neon(process.env.WEATHERDB_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL)
```

### **Environment-Specific Configuration**
```bash
# Local Development (.env)
WEATHERDB_URL="postgresql://neon_connection_to_weather_db"

# Vercel Production (Environment Variables)
WEATHERDB_URL="postgresql://neon_connection_to_weather_db"

# Both point to SAME database with SAME schema
```

### **Serverless-Compatible Driver**
```javascript
// ✅ CORRECT - Neon serverless driver for Vercel functions
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.WEATHERDB_URL)

// Template literal syntax with automatic SQL injection protection
const locations = await sql`
  SELECT name, lat, lng, temperature 
  FROM locations l
  LEFT JOIN weather_conditions w ON l.id = w.location_id
  WHERE l.lat BETWEEN ${lat - 0.5} AND ${lat + 0.5}
  LIMIT ${parseInt(limit)}
`
```

## 🔧 Migration Procedures

### **When Adding New Database**
1. **Create database in Neon console**
2. **Run schema setup script** (see database-rebuild.sql)
3. **Add single environment variable** with descriptive name
4. **Update API functions** to check new variable first
5. **Test with simple endpoint** before complex queries
6. **Document in this guide**

### **When Changing Database Connection**
1. **Verify target database has required schema**
2. **Update environment variable** in Vercel dashboard
3. **Redeploy application** to pick up new variable
4. **Test all API endpoints** for compatibility
5. **Run persona workflow validation**

### **When Debugging Connection Issues**
1. **Check health endpoint debug info** for environment variable status
2. **Verify variable exists** in correct Vercel project
3. **Test database connection** via Neon console
4. **Confirm table schema** matches API expectations
5. **Use test-db endpoint** to isolate connection vs query issues

## 📋 Environment Variable Audit Checklist

### **Before Making Changes**
- [ ] Document current working configuration
- [ ] Identify which database contains required data
- [ ] Verify API functions work with existing setup
- [ ] Note any legacy variable names being used

### **During Migration**
- [ ] Set single, consistent environment variable
- [ ] Update API functions to use new variable
- [ ] Test database connection before deploying
- [ ] Verify schema matches API expectations

### **After Migration**
- [ ] Test all API endpoints
- [ ] Validate persona workflows
- [ ] Update documentation
- [ ] Remove unused environment variables

## 🎯 Success Metrics

**Environment is correctly configured when**:
- ✅ Single primary database variable (`WEATHERDB_URL`)
- ✅ All environments point to same database
- ✅ Neon serverless driver used consistently
- ✅ Health endpoint shows correct variable status
- ✅ All persona workflows functional

## 🚨 Red Flags

**Stop and fix immediately if you see**:
- Multiple database URLs pointing to different databases
- Mix of local and cloud connections in same environment  
- `pg` driver used in Vercel functions
- Environment variables not showing up in health debug
- APIs working locally but failing in production

---

**Remember**: Environment variable chaos is the #1 cause of deployment issues. Keep it simple: one database, one variable, one source of truth.