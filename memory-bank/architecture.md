# **Arsitektur Sistem: Dana Bersama**
**Desain Teknis Aplikasi Keuangan Pasangan**

---

## 1. Gambaran Arsitektur Umum

### 1.1 Arsitektur High-Level
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile Apps   │    │   Web Dashboard │    │  Admin Panel    │
│  (iOS/Android)  │    │   (Optional)    │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      API Gateway          │
                    │   (Load Balancer +        │
                    │    Rate Limiting)         │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │    Backend Services       │
                    │   (Node.js/Express)       │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────┴────────┐    ┌──────────┴──────────┐    ┌─────────┴─────────┐
│   PostgreSQL   │    │      Redis          │    │   File Storage    │
│  (Primary DB)  │    │   (Cache/Session)   │    │   (AWS S3/GCS)    │
└────────────────┘    └─────────────────────┘    └───────────────────┘
```

### 1.2 Prinsip Arsitektur
- **Microservices-Ready**: Modular design untuk future scaling
- **API-First**: RESTful API sebagai backbone komunikasi
- **Cloud-Native**: Designed untuk deployment di cloud
- **Security-First**: End-to-end encryption dan secure authentication
- **Mobile-First**: Optimized untuk mobile experience

## 2. Komponen Utama

### 2.1 Frontend Layer

#### Mobile Application (React Native)
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Button, Input, Modal, etc.
│   ├── expense/         # Expense-related components
│   ├── goals/           # Goal tracking components
│   └── chat/            # Communication components
├── screens/             # Screen components
│   ├── auth/           # Login, Register, ForgotPassword
│   ├── dashboard/      # Main dashboard
│   ├── expenses/       # Expense management
│   ├── goals/          # Goal tracking
│   ├── reports/        # Analytics and reports
│   └── settings/       # User settings
├── services/           # API calls and business logic
│   ├── api/           # HTTP client configuration
│   ├── auth/          # Authentication service
│   ├── expenses/      # Expense management
│   └── goals/         # Goal management
├── store/             # State management (Redux/Zustand)
├── utils/             # Helper functions
└── navigation/        # Navigation configuration
```

#### Key Frontend Technologies
- **React Native**: Cross-platform mobile development
- **TypeScript**: Type safety dan better developer experience
- **React Navigation**: Navigation management
- **Redux Toolkit/Zustand**: State management
- **React Hook Form**: Form handling
- **React Query**: Server state management
- **Expo**: Development tooling (optional)

### 2.2 Backend Layer

#### API Server (Node.js + Express/NestJS)
```
src/
├── controllers/         # Request handlers
│   ├── auth.controller.js
│   ├── users.controller.js
│   ├── expenses.controller.js
│   ├── goals.controller.js
│   └── reports.controller.js
├── services/           # Business logic
│   ├── auth.service.js
│   ├── expense.service.js
│   ├── goal.service.js
│   └── notification.service.js
├── models/            # Database models (Sequelize/Prisma)
│   ├── User.js
│   ├── Couple.js
│   ├── Expense.js
│   ├── Goal.js
│   └── Transaction.js
├── middleware/        # Custom middleware
│   ├── auth.middleware.js
│   ├── validation.middleware.js
│   └── rateLimit.middleware.js
├── routes/           # API routes
├── utils/           # Helper functions
└── config/          # Configuration files
```

#### Key Backend Technologies
- **Node.js**: Runtime environment
- **Express.js/NestJS**: Web framework
- **TypeScript**: Type safety
- **Prisma/Sequelize**: ORM untuk database
- **JWT**: Authentication tokens
- **bcrypt**: Password hashing
- **Joi/Yup**: Input validation
- **Winston**: Logging
- **Jest**: Testing framework

### 2.3 Database Layer

#### PostgreSQL Schema Design
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Couples table (relationship between two users)
CREATE TABLE couples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID REFERENCES users(id),
    user2_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, inactive
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id),
    created_by UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    expense_date DATE NOT NULL,
    split_type VARCHAR(20) DEFAULT 'equal', -- equal, percentage, custom
    split_data JSONB, -- stores split details
    receipt_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Goals table
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    couple_id UUID REFERENCES couples(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0,
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, paused
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table (for goal contributions)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES goals(id),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- contribution, withdrawal
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Redis Usage
- **Session Storage**: User sessions dan authentication tokens
- **Caching**: Frequently accessed data (user profiles, recent expenses)
- **Real-time Features**: Chat messages, notifications
- **Rate Limiting**: API rate limiting data

## 3. API Design

### 3.1 RESTful API Endpoints

#### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

#### User Management
```
GET    /api/users/profile
PUT    /api/users/profile
POST   /api/users/invite-partner
POST   /api/users/accept-invitation
```

#### Expense Management
```
GET    /api/expenses              # Get all expenses for couple
POST   /api/expenses              # Create new expense
GET    /api/expenses/:id          # Get specific expense
PUT    /api/expenses/:id          # Update expense
DELETE /api/expenses/:id          # Delete expense
GET    /api/expenses/categories   # Get expense categories
```

#### Goal Management
```
GET    /api/goals                 # Get all goals for couple
POST   /api/goals                 # Create new goal
GET    /api/goals/:id             # Get specific goal
PUT    /api/goals/:id             # Update goal
DELETE /api/goals/:id             # Delete goal
POST   /api/goals/:id/contribute  # Add contribution to goal
```

#### Reports & Analytics
```
GET    /api/reports/summary       # Get financial summary
GET    /api/reports/expenses      # Get expense analytics
GET    /api/reports/goals         # Get goal progress
GET    /api/reports/trends        # Get spending trends
```

### 3.2 Real-time Features (WebSocket)
```
/ws/chat/:coupleId            # Real-time chat
/ws/notifications/:userId     # Real-time notifications
/ws/expense-updates/:coupleId # Real-time expense updates
```

## 4. Security Architecture

### 4.1 Authentication & Authorization
- **JWT Tokens**: Access tokens (15 min) + Refresh tokens (7 days)
- **Role-based Access**: User dapat akses data couple mereka saja
- **API Rate Limiting**: Prevent abuse dan DDoS
- **Input Validation**: Comprehensive validation di semua endpoints

### 4.2 Data Protection
- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: HTTPS/TLS untuk semua komunikasi
- **Sensitive Data**: PII data di-hash/encrypt
- **GDPR Compliance**: Data deletion dan export capabilities

### 4.3 Security Headers
```javascript
// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 5. Deployment Architecture

### 5.1 Cloud Infrastructure (AWS/GCP)
```
┌─────────────────┐
│   CloudFront    │  # CDN untuk static assets
│   (CDN)         │
└─────────┬───────┘
          │
┌─────────┴───────┐
│  Load Balancer  │  # Application Load Balancer
│   (ALB/GLB)     │
└─────────┬───────┘
          │
┌─────────┴───────┐
│   ECS/GKE       │  # Container orchestration
│  (API Servers)  │  # Auto-scaling group
└─────────┬───────┘
          │
┌─────────┴───────┐
│   RDS/Cloud     │  # Managed PostgreSQL
│     SQL         │  # Multi-AZ deployment
└─────────────────┘
```

### 5.2 CI/CD Pipeline
```
GitHub/GitLab → GitHub Actions/GitLab CI → Docker Build → 
Security Scan → Unit Tests → Integration Tests → 
Staging Deployment → Production Deployment
```

### 5.3 Monitoring & Observability
- **Application Monitoring**: New Relic/DataDog
- **Error Tracking**: Sentry
- **Logging**: CloudWatch/Stackdriver
- **Uptime Monitoring**: Pingdom/UptimeRobot
- **Performance**: Lighthouse CI untuk mobile performance

## 6. Scalability Considerations

### 6.1 Horizontal Scaling
- **Stateless API**: Semua state di database/cache
- **Database Sharding**: Partition by couple_id untuk future scaling
- **Microservices Migration**: Gradual migration ke microservices
- **CDN**: Static assets dan image optimization

### 6.2 Performance Optimization
- **Database Indexing**: Proper indexing untuk query performance
- **Caching Strategy**: Multi-level caching (Redis, CDN, Application)
- **Image Optimization**: Automatic image compression dan resizing
- **API Pagination**: Limit data transfer untuk large datasets

## 7. Integration Architecture

### 7.1 Third-party Integrations
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Bank APIs     │    │   E-wallet APIs │    │  Notification   │
│  (BCA, BRI,     │    │ (GoPay, OVO,    │    │   Services      │
│   Mandiri)      │    │  DANA, etc.)    │    │  (FCM, SMS)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │   Integration Layer       │
                    │   (API Gateway +          │
                    │    Webhook Handlers)      │
                    └───────────────────────────┘
```

### 7.2 Payment Integration
- **Midtrans**: Primary payment gateway untuk Indonesia
- **Xendit**: Backup payment processor
- **Bank Transfer**: Manual verification untuk free users

## 8. Development Guidelines

### 8.1 Code Standards
- **TypeScript**: Mandatory untuk type safety
- **ESLint + Prettier**: Code formatting dan linting
- **Conventional Commits**: Standardized commit messages
- **API Documentation**: OpenAPI/Swagger documentation

### 8.2 Testing Strategy
- **Unit Tests**: 80%+ coverage untuk business logic
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Critical user flows (Detox/Appium)
- **Performance Tests**: Load testing untuk API endpoints

---

**Dokumen ini akan diupdate seiring evolusi arsitektur dan kebutuhan teknis.**