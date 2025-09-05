# 🚀 Production Deployment Guide - VercelMCP First Strategy

## **🎯 PRIMARY: Conversation-Based Deployment (RECOMMENDED)**

**Deploy in 30 seconds with zero context switching:**

```
"Deploy current code to production with safety validation"
```

**What happens**: Safety checks → deployment → endpoint validation → monitoring

## **🛠️ BACKUP: Traditional Deployment Methods**

Use only when VercelMCP unavailable.

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **VercelMCP Integration** - 88% ready, use conversations for optimal experience
3. **Database** - Neon PostgreSQL (cloud-hosted, no local setup)
4. **Node.js 20.x LTS** - All environments standardized
5. **API Keys** - Weather and map service credentials

## Environment Variables Setup

### Required Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Database - Use your production PostgreSQL URL
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Redis - Use your production Redis URL  
REDIS_URL="redis://user:pass@host:6379"

# Security - Generate secure random strings
JWT_SECRET="your-32-character-secret-key"
NEXTAUTH_SECRET="your-32-character-secret-key"

# Weather APIs
OPENWEATHER_API_KEY="your-openweather-key"
WEATHER_API_KEY="your-weather-api-key"
VISUAL_CROSSING_API_KEY="your-visual-crossing-key"

# Map Services
GOOGLE_MAPS_API_KEY="your-google-maps-key"
MAPBOX_ACCESS_TOKEN="your-mapbox-token"

# Email (for notifications)
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

## Vercel Deployment

### 1. Deploy API Functions

```bash
# Deploy serverless functions
cd apps/api
vercel --prod
```

### 2. Set Environment Variables in Vercel

In your Vercel dashboard:
1. Go to Project Settings > Environment Variables
2. Add all variables from `.env.production`
3. Make sure to select "Production" environment

### 3. Configure Database

Your PostgreSQL database should have:
- PostGIS extension enabled
- Tables created from `application/database/init-db.sql`
- Proper network access configured

### 4. Test Deployment

```bash
# Test API endpoints
curl https://your-api-domain.vercel.app/api/test-db
curl https://your-api-domain.vercel.app/api/analytics
```

## Database Setup

### Initial Schema

```sql
-- Run this on your production database
\i application/database/init-db.sql
```

### Database Providers

**Recommended:**
- **Neon** - PostgreSQL with PostGIS support
- **Supabase** - PostgreSQL with built-in PostGIS
- **PlanetScale** - MySQL alternative (requires schema changes)

## Redis Setup

**Recommended:**
- **Upstash** - Serverless Redis
- **Redis Cloud** - Managed Redis
- **Railway** - Redis hosting

## Security Checklist

- [ ] All API keys are set in Vercel environment variables
- [ ] Database has proper access controls
- [ ] JWT secrets are cryptographically secure
- [ ] CORS origins are restricted to your domain
- [ ] Rate limiting is configured
- [ ] Email credentials are secure

## Monitoring

- [ ] Vercel Analytics enabled
- [ ] Database monitoring configured
- [ ] Error tracking (Sentry recommended)
- [ ] Performance monitoring

## Domain Configuration

1. **Add Domain in Vercel**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Configure DNS records

2. **Update Environment Variables**
   - Set `NEXTAUTH_URL` to your domain
   - Update `CORS_ORIGIN` to your domain

## Backup Strategy

1. **Database Backups**
   - Daily automated backups
   - Point-in-time recovery
   
2. **Environment Variables**
   - Securely store in password manager
   - Document all required variables

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify network access
   - Ensure PostGIS extension is enabled

2. **API Key Issues**
   - Verify all keys are set in Vercel
   - Check key permissions/quotas
   - Test keys locally first

3. **CORS Errors**
   - Update CORS_ORIGIN in environment
   - Check domain configuration

### Debug Commands

```bash
# Check Vercel logs
vercel logs

# Test database locally
node apps/api/test-local.js

# Verify environment variables
vercel env ls
```

## Support

For deployment issues:
1. Check Vercel documentation
2. Review application logs
3. Test components locally first
4. Verify all environment variables are set