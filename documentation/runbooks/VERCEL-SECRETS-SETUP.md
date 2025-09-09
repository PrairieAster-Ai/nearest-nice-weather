# Vercel Secrets Setup for GitHub Actions

## 🔑 Required GitHub Secrets

To enable the GitHub Actions CI/CD pipeline deployment stages, add these secrets:

### **Navigate to GitHub Secrets**:
1. Go to: https://github.com/PrairieAster-Ai/nearest-nice-weather/settings/secrets/actions
2. Click **"New repository secret"** for each secret below

### **Required Secrets**:

#### `VERCEL_ORG_ID`
```
team_9ZgyNIGcegz32LNgxbsVdyXd
```

#### `VERCEL_PROJECT_ID`
```
prj_Xojh52KHaZJFy5YZPxNG9yZDgAep
```

#### `VERCEL_TOKEN`
**You need to generate this token**:
1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name: `GitHub Actions CI/CD`
4. Expiration: **No Expiration** (for CI/CD reliability)
5. Scope: **Full Account**
6. Copy the token and add it as `VERCEL_TOKEN` secret

## ✅ Verification

After adding secrets, the GitHub Actions will:
- ✅ Deploy preview environments on pull requests
- ✅ Deploy production on main branch pushes
- ✅ Comment preview URLs on PRs
- ✅ Create deployment notifications

## 🚀 Expected Behavior

**Pull Request Flow**:
1. Quality checks (lint, type-check, build)
2. Security scanning (audit, dependency check)
3. **Vercel preview deployment** ← Will work after secrets added
4. Performance checks (placeholder)

**Production Flow (main branch)**:
1. Same quality/security checks
2. **Vercel production deployment** ← Will work after secrets added
3. Deployment success notification

## 🛡️ Security Notes

- Tokens are encrypted and only accessible to GitHub Actions
- Vercel tokens can be regenerated if compromised
- Organization and project IDs are not sensitive (already in .vercel/project.json)

## 📍 Current Status
- ✅ Organization ID: Available (`team_9ZgyNIGcegz32LNgxbsVdyXd`)
- ✅ Project ID: Available (`prj_Xojh52KHaZJFy5YZPxNG9yZDgAep`)
- ⚠️ **Action Required**: Generate and add `VERCEL_TOKEN` secret

Once the `VERCEL_TOKEN` is added, your CI/CD pipeline will have full deployment capabilities!
