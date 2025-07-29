# Environment Setup Documentation Links

## 🔗 CLAUDE.md Environment Configuration Links

### **For Database Issues (#155, #158, #159, #160)**

#### **Database Environment Management**
- **[CLAUDE.md#environment-variables](../CLAUDE.md#environment-variables)** - Database connection strings and Neon configuration
- **[CLAUDE.md#database-schema-validation](../CLAUDE.md#database-schema-validation)** - Validation procedures and deployment checklist
- **[CLAUDE.md#neon-database-branching](../CLAUDE.md#neon-database-branching)** - Multi-environment database strategy
- **Purpose**: Configuration management for database connections across localhost/preview/production

#### **Development Environment Setup**
- **[CLAUDE.md#development-commands](../CLAUDE.md#development-commands)** - Environment validation and startup procedures
- **[CLAUDE.md#environment-setup](../CLAUDE.md#environment-setup)** - Complete development environment configuration
- **Purpose**: Unified development experience and environment consistency

### **For Weather API Issues (#180)**

#### **API Configuration**
- **[CLAUDE.md#environment-configuration](../CLAUDE.md#environment-configuration)** - OpenWeather API keys and environment variables
- **[CLAUDE.md#environment-validation](../CLAUDE.md#environment-validation)** - API endpoint testing and validation procedures
- **Purpose**: Weather API integration and testing configuration

### **For Revenue & Analytics Issues (#166, #167, #168, #182)**

#### **Analytics & Revenue Environment**
- **[CLAUDE.md#environment-variables](../CLAUDE.md#environment-variables)** - GA4 tracking IDs and AdSense configuration
- **[CLAUDE.md#vercel-deployment-checklist](../CLAUDE.md#vercel-deployment-checklist)** - Production environment variable management
- **Purpose**: Analytics and revenue system configuration across environments

## 📋 Quick Reference Commands

From CLAUDE.md for environment validation:

```bash
# Comprehensive environment validation
./scripts/environment-validation.sh [localhost|preview|production]

# Unified development startup
npm start

# Environment health checking
npm run health:visual
```

## ⚙️ Key Environment Variables

Reference these sections in CLAUDE.md for environment configuration:

- **DATABASE_URL / POSTGRES_URL**: Neon database connections
- **OPENWEATHER_API_KEY**: Weather API integration  
- **GA4_MEASUREMENT_ID**: Google Analytics tracking
- **ADSENSE_CLIENT_ID**: AdSense revenue integration

## 🎯 Usage

Add these CLAUDE.md environment links to GitHub issues requiring configuration management, API setup, or deployment procedures.