# Vercel Preview Authentication for Claude Code

This document explains how to configure Vercel preview deployments for Claude Code access while maintaining security.

## 🔐 **Authentication Architecture**

### **Security Model**
- ✅ **Preview environments**: Claude Code can authenticate and access
- 🚫 **Production environment**: No bypass available (security)
- 🔑 **Token-based access**: Secure authentication using environment variables
- 🌐 **API endpoint**: `/claude-code-auth` for authentication validation

### **Components**
1. **Auth Bypass API** (`/api/auth-bypass.js`) - Validates Claude Code access tokens
2. **Authentication Script** (`scripts/claude-code-vercel-auth.js`) - Handles auth and testing
3. **Vercel Configuration** (`vercel.json`) - Routes and function configuration

## 🚀 **Setup Instructions**

### **1. Configure Vercel Environment Variables**

Add these environment variables to your Vercel project:

```bash
# Vercel Dashboard → Settings → Environment Variables
CLAUDE_CODE_ACCESS_TOKEN=your-secure-random-token-here

# Example secure token generation:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important**: Only set this for **Preview** environments, NOT production.

### **2. Deploy the Authentication System**

The authentication system is automatically included in deployments:

```bash
# Deploy to preview with authentication
npm run deploy:preview --workspace=@nearest-nice-weather/web

# The auth endpoint will be available at:
# https://your-preview-deployment.vercel.app/claude-code-auth
```

### **3. Test Authentication**

```bash
# Set your access token locally
export CLAUDE_CODE_ACCESS_TOKEN="your-secure-token"

# Test authentication with preview deployment
npm run preview:auth https://your-preview-deployment.vercel.app

# Run full validation suite
npm run preview:validate https://your-preview-deployment.vercel.app

# Take screenshot of preview deployment
npm run preview:screenshot https://your-preview-deployment.vercel.app
```

## 🔧 **Available Commands**

### **Authentication & Validation**
```bash
# Authenticate with preview deployment
npm run preview:auth <deployment-url>

# Full validation suite (health + screenshot + logs)
npm run preview:validate <deployment-url>

# Capture screenshot only
npm run preview:screenshot <deployment-url>
```

### **Direct Script Usage**
```bash
# Authenticate
node scripts/claude-code-vercel-auth.js auth https://preview.vercel.app

# Monitor console logs for 30 seconds
node scripts/claude-code-vercel-auth.js monitor https://preview.vercel.app

# Health check
node scripts/claude-code-vercel-auth.js validate https://preview.vercel.app

# Complete validation
node scripts/claude-code-vercel-auth.js full https://preview.vercel.app
```

## 📊 **Authentication Flow**

### **1. Token Validation**
```
Claude Code → /claude-code-auth → Validate Token → Grant Access
```

### **2. Available Features After Authentication**
- ✅ **Screenshot Capture**: Visual validation of preview deployments
- ✅ **Console Log Monitoring**: Real-time error detection
- ✅ **Health Checks**: Deployment status validation
- ✅ **Performance Monitoring**: Core Web Vitals tracking

### **3. Integration with BrowserToolsMCP**
```bash
# Authentication enables BrowserToolsMCP to capture screenshots
curl -X POST http://localhost:3025/mcp/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://authenticated-preview.vercel.app", "filename": "preview.png"}'
```

## 🔒 **Security Features**

### **Environment Isolation**
- **Production**: No authentication bypass available
- **Preview**: Token-based access only
- **Development**: Full local access

### **Token Security**
- 🔐 **Cryptographically secure**: 256-bit random tokens
- ⏰ **Session-based**: Temporary access per deployment
- 🚫 **Production-blocked**: Cannot be used in production
- 🔄 **Rotatable**: Can be updated in Vercel dashboard

### **Access Logging**
```json
{
  "status": "authenticated",
  "environment": "preview",
  "deployment": "https://preview-abc123.vercel.app",
  "timestamp": "2025-07-15T23:39:46.784Z",
  "features": ["screenshot_access", "console_monitoring"]
}
```

## 📈 **Usage Examples**

### **Automated Testing Integration**
```bash
# In CI/CD pipeline after preview deployment
DEPLOYMENT_URL=$(vercel --json | jq -r '.url')
npm run preview:validate $DEPLOYMENT_URL
```

### **Development Workflow**
```bash
# 1. Deploy to preview
npm run deploy:preview

# 2. Authenticate and validate
npm run preview:validate https://your-preview-abc123.vercel.app

# 3. Monitor during testing
npm run preview:screenshot https://your-preview-abc123.vercel.app
```

### **Screenshot Validation**
```bash
# Capture before/after screenshots
npm run preview:screenshot https://preview-before.vercel.app
# Make changes...
npm run preview:screenshot https://preview-after.vercel.app
```

## 🚨 **Troubleshooting**

### **Authentication Failed**
```bash
❌ Authentication failed: Invalid token
```
**Solution**: Check `CLAUDE_CODE_ACCESS_TOKEN` environment variable in Vercel dashboard.

### **Production Access Denied**
```bash
❌ Auth bypass not available in production
```
**Solution**: This is expected security behavior. Use preview deployments for Claude Code access.

### **BrowserToolsMCP Connection Issues**
```bash
❌ Screenshot failed: Connection refused
```
**Solution**: Ensure BrowserToolsMCP server is running on localhost:3025.

## 🎯 **Integration Benefits**

### **Automated Quality Assurance**
- **Visual Regression Testing**: Screenshots of every preview deployment
- **Performance Monitoring**: Automated Core Web Vitals tracking
- **Console Error Detection**: Real-time monitoring of JavaScript errors
- **Health Validation**: Deployment status verification

### **Development Productivity**
- **No Manual Authentication**: Automated access to preview deployments
- **Integrated Testing**: Screenshots and logs captured automatically
- **Performance Insights**: Bundle analysis and Core Web Vitals
- **Continuous Validation**: Every change is visually verified

### **Security Compliance**
- **Production Protection**: No bypass mechanisms in production
- **Token-based Security**: Cryptographically secure access tokens
- **Environment Isolation**: Preview-only authentication
- **Audit Logging**: Complete access and activity logging

## 📋 **Next Steps**

1. **Set Environment Variable**: Add `CLAUDE_CODE_ACCESS_TOKEN` to Vercel preview environments
2. **Test Authentication**: Use `npm run preview:auth` with your next preview deployment
3. **Integrate with CI/CD**: Add preview validation to GitHub Actions workflow
4. **Monitor Usage**: Review authentication logs and adjust as needed

The Vercel preview authentication system provides secure, automated access for Claude Code while maintaining production security.
