# 🚀 **Deployment Guide - Dana Bersama**

**Update Terakhir:** 19 Desember 2024  
**Status:** 📋 Ready for Implementation  
**Backend:** ✅ Production Ready | **Mobile:** 🚧 Pending Development

---

## 🎯 **Deployment Overview**

Panduan lengkap untuk deployment aplikasi Dana Bersama ke production environment, mencakup backend API dan mobile application.

---

## 🔧 **Backend Deployment**

### **Production Requirements**
- **Node.js**: v18+ LTS
- **Database**: PostgreSQL 14+
- **Memory**: Minimum 1GB RAM
- **Storage**: Minimum 10GB SSD
- **SSL Certificate**: Required for HTTPS

### **Environment Variables**
```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=dana_bersama_prod
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_SSL=true

# JWT
JWT_SECRET=your-super-secure-jwt-secret-64-chars-minimum
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=https://your-domain.com,https://api.your-domain.com

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret
```

### **Docker Deployment**

#### **Dockerfile**
```dockerfile
# Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY database/ ./database/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### **docker-compose.yml**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - db
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - dana-bersama-network

  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: dana_bersama_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    networks:
      - dana-bersama-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - dana-bersama-network

volumes:
  postgres_data:

networks:
  dana-bersama-network:
    driver: bridge
```

### **Nginx Configuration**
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name api.dana-bersama.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.dana-bersama.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # API Routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health Check
        location /health {
            proxy_pass http://backend/health;
            access_log off;
        }
    }
}
```

### **Cloud Platform Deployment**

#### **Heroku Deployment**
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create dana-bersama-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set BCRYPT_ROUNDS=12

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate
```

#### **Railway Deployment**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add PostgreSQL service
railway add postgresql

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-jwt-secret

# Deploy
railway up
```

#### **DigitalOcean App Platform**
```yaml
# .do/app.yaml
name: dana-bersama-api
services:
- name: api
  source_dir: /
  github:
    repo: your-username/dana-bersama
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    value: your-jwt-secret
    type: SECRET
databases:
- name: db
  engine: PG
  version: "14"
```

---

## 📱 **Mobile App Deployment**

### **React Native/Expo Deployment**

#### **Build Configuration**
```json
// app.json
{
  "expo": {
    "name": "Dana Bersama",
    "slug": "dana-bersama",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.danabersama.app",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.danabersama.app",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

#### **EAS Build Configuration**
```json
// eas.json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "API_URL": "https://api.dana-bersama.com"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

#### **Build Commands**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for development
eas build --platform all --profile development

# Build for preview
eas build --platform all --profile preview

# Build for production
eas build --platform all --profile production

# Submit to app stores
eas submit --platform all
```

### **App Store Deployment**

#### **iOS App Store**
```bash
# Prerequisites:
# - Apple Developer Account ($99/year)
# - App Store Connect app created
# - Certificates and provisioning profiles

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios

# Or manual upload via Xcode/Transporter
```

#### **Google Play Store**
```bash
# Prerequisites:
# - Google Play Console account ($25 one-time)
# - App created in Play Console
# - Service account key for API access

# Build for Android
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android

# Or manual upload via Play Console
```

---

## 🔒 **Security Considerations**

### **Backend Security**
- **HTTPS Only**: Force SSL/TLS encryption
- **JWT Security**: Strong secret, reasonable expiry
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Sanitize all inputs
- **SQL Injection**: Use parameterized queries
- **CORS**: Restrict origins
- **Security Headers**: Implement security headers
- **Environment Variables**: Never commit secrets

### **Mobile Security**
- **API Keys**: Store in secure storage
- **Certificate Pinning**: Prevent MITM attacks
- **Code Obfuscation**: Protect source code
- **Root/Jailbreak Detection**: Optional security
- **Biometric Authentication**: Enhanced security
- **Secure Storage**: Use platform secure storage

---

## 📊 **Monitoring & Logging**

### **Backend Monitoring**
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

### **Logging Setup**
```javascript
// Winston logger configuration
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### **Monitoring Tools**
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Application Monitoring**: New Relic, DataDog
- **Error Tracking**: Sentry, Bugsnag
- **Performance**: Google Analytics, Mixpanel
- **Logs**: ELK Stack, Splunk

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm test
    - run: npm run test:coverage

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to Heroku
      uses: akhileshns/heroku-deploy@v3.12.12
      with:
        heroku_api_key: ${{secrets.HEROKU_API_KEY}}
        heroku_app_name: "dana-bersama-api"
        heroku_email: "your-email@example.com"

  deploy-mobile:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm install -g eas-cli
    - run: eas build --platform all --profile production --non-interactive
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## 📋 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit done
- [ ] Performance testing completed
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Monitoring setup
- [ ] Backup strategy in place

### **Backend Deployment**
- [ ] Production database setup
- [ ] Environment variables configured
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] Logging setup
- [ ] Health checks working
- [ ] Monitoring alerts configured
- [ ] Backup automated

### **Mobile Deployment**
- [ ] App store accounts ready
- [ ] App metadata prepared
- [ ] Screenshots and descriptions
- [ ] Privacy policy published
- [ ] Terms of service ready
- [ ] App icons and assets
- [ ] Testing on real devices
- [ ] Performance optimization

### **Post-Deployment**
- [ ] Smoke tests passed
- [ ] Monitoring alerts working
- [ ] Performance metrics normal
- [ ] User feedback monitoring
- [ ] Error tracking active
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback plan ready

---

## 🚨 **Rollback Strategy**

### **Backend Rollback**
```bash
# Heroku rollback
heroku rollback v123

# Docker rollback
docker-compose down
docker-compose up -d --scale app=0
docker tag dana-bersama:v1.0.0 dana-bersama:latest
docker-compose up -d

# Database rollback (if needed)
npm run migrate:rollback
```

### **Mobile Rollback**
```bash
# Remove from app stores (emergency)
# Users will keep current version
# Push hotfix update ASAP

# Expo rollback (if using OTA updates)
eas update --branch production --message "Rollback to stable version"
```

---

## 📈 **Scaling Considerations**

### **Backend Scaling**
- **Horizontal Scaling**: Multiple app instances
- **Database Scaling**: Read replicas, connection pooling
- **Caching**: Redis for session/data caching
- **CDN**: Static asset delivery
- **Load Balancing**: Distribute traffic

### **Mobile Scaling**
- **API Optimization**: Efficient data fetching
- **Caching**: Local data caching
- **Image Optimization**: Compressed assets
- **Bundle Splitting**: Code splitting
- **Performance Monitoring**: Track app performance

---

**🚀 Ready for production deployment!**  
**Backend tested and documented - Mobile ready for build and deploy! 📱**