# Security Policy

## 🔒 Security Overview

NearestNiceWeather is committed to maintaining the security of our outdoor recreation platform and protecting user data. This document outlines our security practices and vulnerability reporting process.

## 🛡️ Supported Versions

We actively maintain security updates for the following versions:

| Version | Supported          | Environment |
| ------- | ------------------ | ----------- |
| Latest Production | ✅ Yes | https://www.nearestniceweather.com |
| Preview Branch | ✅ Yes | https://p.nearestniceweather.com |
| Development | ⚠️ Limited | localhost only |

## 🚨 Reporting Security Vulnerabilities

### Immediate Response Required (Critical/High Severity)
- **Direct Contact**: Email `security@nearestniceweather.com`
- **Response Time**: Within 24 hours
- **Examples**: SQL injection, credential exposure, authentication bypass

### Standard Reporting Process (Medium/Low Severity)
- **GitHub Security Advisories**: [Create a security advisory](https://github.com/PrairieAster-Ai/nearest-nice-weather/security/advisories/new)
- **Response Time**: Within 72 hours
- **Examples**: XSS, information disclosure, dependency vulnerabilities

### What to Include in Your Report
1. **Description**: Clear description of the vulnerability
2. **Impact**: Potential impact and attack scenarios
3. **Steps to Reproduce**: Detailed reproduction steps
4. **Environment**: Which version/environment is affected
5. **Proof of Concept**: Screenshots or code samples (if applicable)

## 🔍 Our Security Measures

### Automated Security Scanning
- **CodeQL Analysis**: JavaScript/TypeScript static analysis on every PR
- **Secret Scanning**: TruffleHog OSS prevents credential commits
- **Dependency Monitoring**: Dependabot with security-focused grouping
- **Continuous Monitoring**: Security pipeline runs on all branches

### Infrastructure Security
- **Serverless Architecture**: Vercel Edge Functions with automatic security updates
- **Database Security**: Neon PostgreSQL with SSL-only connections
- **Environment Isolation**: Separate preview/production environments
- **HTTPS Enforcement**: TLS 1.2+ required for all connections

### Development Security
- **Pre-commit Hooks**: Credential scanning and validation
- **Security-First CI/CD**: Multi-stage security validation pipeline
- **Access Controls**: Protected production environment with manual approval
- **SBOM Generation**: Software Bill of Materials for production deployments

## 🎯 Scope

### In Scope
- **Application**: Web application and APIs
- **Infrastructure**: Vercel deployment and Neon database
- **Dependencies**: npm packages and GitHub Actions
- **User Data**: Location preferences and feedback submissions

### Out of Scope
- **Third-party Services**: OpenWeather API, Google Maps (report to vendors)
- **User Devices**: Client-side security (browser/mobile)
- **Physical Security**: Office or data center security
- **Social Engineering**: Phishing or social attacks

## ⚡ Response Process

### 1. Acknowledgment (24-72 hours)
- Confirm receipt of vulnerability report
- Assign internal tracking ID
- Provide initial assessment timeline

### 2. Investigation (1-7 days)
- Reproduce and validate the vulnerability
- Assess impact and severity
- Develop remediation plan

### 3. Resolution (1-14 days)
- Implement security fix
- Test fix in preview environment
- Deploy to production (if applicable)

### 4. Disclosure (After resolution)
- Coordinate with reporter on disclosure timeline
- Publish security advisory (if applicable)
- Credit security researcher (if desired)

## 🏆 Security Recognition

We appreciate security researchers who help improve our platform security:

### Hall of Fame
*No reported vulnerabilities yet - be the first responsible security researcher!*

### Recognition Options
- **Public Credit**: GitHub security advisory acknowledgment
- **Swag**: NearestNiceWeather stickers and merchandise
- **Reference**: LinkedIn recommendation for security researchers

## 📞 Security Contacts

- **Security Email**: `security@nearestniceweather.com`
- **Response Team**: @rhspeer (Primary), @PrairieAster-Ai (Organization)
- **Business Hours**: Monday-Friday, 9 AM - 5 PM Central Time
- **Emergency Contact**: For critical vulnerabilities, email with "URGENT SECURITY" subject

## 🔄 Security Policy Updates

This security policy is reviewed quarterly and updated as needed. Last updated: **2025-01-14**

**Version**: 1.0.0
**Next Review**: 2025-04-14

---

**🚀 [Report a Security Vulnerability](https://github.com/PrairieAster-Ai/nearest-nice-weather/security/advisories/new)**

For general questions about our security practices, please open a [GitHub Discussion](https://github.com/PrairieAster-Ai/nearest-nice-weather/discussions).
