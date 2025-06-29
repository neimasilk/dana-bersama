# **Testing Strategy: Dana Bersama**
**Strategi Pengujian Komprehensif untuk Aplikasi Keuangan Pasangan**

---

## 1. Overview Testing Strategy

### 1.1 Filosofi Testing
- **Quality First**: Tidak ada kode yang masuk ke main branch tanpa testing yang memadai
- **Test-Driven Development**: Testing framework harus siap sebelum development dimulai
- **Automated Testing**: Prioritas pada automated testing untuk efisiensi
- **Security Focus**: Testing keamanan data finansial sebagai prioritas utama

### 1.2 Testing Pyramid
```
        ┌─────────────────┐
        │   E2E Tests     │  ← 10% (Critical user flows)
        │   (Detox/E2E)   │
        └─────────────────┘
      ┌───────────────────────┐
      │  Integration Tests    │  ← 20% (API endpoints, DB)
      │  (Jest + Supertest)   │
      └───────────────────────┘
    ┌─────────────────────────────┐
    │      Unit Tests             │  ← 70% (Business logic)
    │   (Jest + React Testing)    │
    └─────────────────────────────┘
```

---

## 2. Backend Testing Strategy

### 2.1 Unit Testing (Jest)

#### 2.1.1 Controllers Testing
**File**: `src/backend/tests/controllers/`

```javascript
// auth.controller.test.js
describe('Auth Controller', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Test successful login
    });
    
    it('should reject invalid email format', async () => {
      // Test email validation
    });
    
    it('should reject wrong password', async () => {
      // Test password validation
    });
    
    it('should handle rate limiting', async () => {
      // Test rate limiting
    });
  });
});
```

#### 2.1.2 Services Testing
**File**: `src/backend/tests/services/`

```javascript
// expense.service.test.js
describe('Expense Service', () => {
  describe('createExpense', () => {
    it('should create expense with equal split', async () => {
      // Test equal split calculation
    });
    
    it('should create expense with percentage split', async () => {
      // Test percentage split calculation
    });
    
    it('should validate expense amount', async () => {
      // Test amount validation
    });
  });
});
```

#### 2.1.3 Models Testing
**File**: `src/backend/tests/models/`

```javascript
// User.model.test.js
describe('User Model', () => {
  it('should hash password before saving', async () => {
    // Test password hashing
  });
  
  it('should validate email format', async () => {
    // Test email validation
  });
});
```

### 2.2 Integration Testing

#### 2.2.1 API Endpoints Testing
**File**: `src/backend/tests/integration/`

```javascript
// api.integration.test.js
describe('API Integration Tests', () => {
  beforeEach(async () => {
    // Setup test database
    await setupTestDB();
  });
  
  describe('Expense Management Flow', () => {
    it('should complete full expense creation flow', async () => {
      // 1. Create users
      // 2. Create couple relationship
      // 3. Create expense
      // 4. Verify split calculation
      // 5. Verify database state
    });
  });
});
```

#### 2.2.2 Database Testing
**File**: `src/backend/tests/database/`

```javascript
// database.integration.test.js
describe('Database Integration', () => {
  it('should handle concurrent expense creation', async () => {
    // Test database concurrency
  });
  
  it('should maintain data integrity', async () => {
    // Test foreign key constraints
  });
});
```

### 2.3 Security Testing

#### 2.3.1 Authentication & Authorization
**File**: `src/backend/tests/security/`

```javascript
// security.test.js
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject requests without valid JWT', async () => {
      // Test JWT validation
    });
    
    it('should prevent access to other couples data', async () => {
      // Test authorization
    });
  });
  
  describe('Input Validation', () => {
    it('should sanitize SQL injection attempts', async () => {
      // Test SQL injection prevention
    });
    
    it('should validate input data types', async () => {
      // Test input validation
    });
  });
});
```

---

## 3. Frontend Testing Strategy

### 3.1 Component Testing (React Testing Library)

#### 3.1.1 UI Components
**File**: `src/mobile/tests/components/`

```javascript
// ExpenseForm.test.tsx
describe('ExpenseForm Component', () => {
  it('should render all form fields', () => {
    // Test component rendering
  });
  
  it('should validate required fields', async () => {
    // Test form validation
  });
  
  it('should calculate split amounts correctly', () => {
    // Test split calculation logic
  });
  
  it('should handle form submission', async () => {
    // Test form submission
  });
});
```

#### 3.1.2 Screen Components
**File**: `src/mobile/tests/screens/`

```javascript
// DashboardScreen.test.tsx
describe('Dashboard Screen', () => {
  it('should display expense summary', async () => {
    // Test data display
  });
  
  it('should handle loading states', () => {
    // Test loading indicators
  });
  
  it('should handle error states', () => {
    // Test error handling
  });
});
```

### 3.2 Service Testing

#### 3.2.1 API Services
**File**: `src/mobile/tests/services/`

```javascript
// api.service.test.ts
describe('API Service', () => {
  it('should handle network errors gracefully', async () => {
    // Test error handling
  });
  
  it('should retry failed requests', async () => {
    // Test retry logic
  });
  
  it('should cache responses appropriately', async () => {
    // Test caching
  });
});
```

### 3.3 Navigation Testing

```javascript
// navigation.test.tsx
describe('Navigation', () => {
  it('should navigate between screens correctly', () => {
    // Test navigation flow
  });
  
  it('should handle deep linking', () => {
    // Test deep links
  });
});
```

---

## 4. End-to-End Testing Strategy

### 4.1 Critical User Flows
**Tool**: Detox (React Native) atau Appium
**File**: `e2e/tests/`

#### 4.1.1 Authentication Flow
```javascript
// auth.e2e.test.js
describe('Authentication Flow', () => {
  it('should complete full registration and login flow', async () => {
    // 1. Open app
    // 2. Navigate to registration
    // 3. Fill registration form
    // 4. Verify email (mock)
    // 5. Login with credentials
    // 6. Verify dashboard access
  });
});
```

#### 4.1.2 Expense Management Flow
```javascript
// expense.e2e.test.js
describe('Expense Management', () => {
  it('should create and split expense between couple', async () => {
    // 1. Login as user 1
    // 2. Create expense
    // 3. Set split configuration
    // 4. Submit expense
    // 5. Verify expense appears in list
    // 6. Login as user 2
    // 7. Verify expense appears for partner
  });
});
```

#### 4.1.3 Goal Tracking Flow
```javascript
// goals.e2e.test.js
describe('Goal Tracking', () => {
  it('should create goal and track contributions', async () => {
    // 1. Create savings goal
    // 2. Add contribution
    // 3. Verify progress update
    // 4. Check goal completion
  });
});
```

---

## 5. Performance Testing

### 5.1 Load Testing
**Tool**: Artillery atau k6
**File**: `tests/performance/`

```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/expenses"
          headers:
            Authorization: "Bearer {{ token }}"
```

### 5.2 Mobile Performance
```javascript
// performance.test.js
describe('Mobile Performance', () => {
  it('should load dashboard within 2 seconds', async () => {
    // Test app startup time
  });
  
  it('should handle large expense lists efficiently', async () => {
    // Test list performance
  });
});
```

---

## 6. Testing Environment Setup

### 6.1 Test Database Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### 6.2 Test Data Management
```javascript
// tests/fixtures/testData.js
export const testUsers = {
  user1: {
    email: 'user1@test.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe'
  },
  user2: {
    email: 'user2@test.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Doe'
  }
};

export const testExpenses = {
  groceries: {
    title: 'Groceries',
    amount: 150000,
    category: 'Food',
    splitType: 'equal'
  }
};
```

---

## 7. Continuous Integration Testing

### 7.1 GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

---

## 8. Testing Checklist untuk Developer

### 8.1 Backend Developer Checklist
- [ ] Unit tests untuk semua business logic functions
- [ ] Integration tests untuk API endpoints
- [ ] Database migration tests
- [ ] Security tests untuk authentication/authorization
- [ ] Input validation tests
- [ ] Error handling tests
- [ ] Performance tests untuk critical endpoints

### 8.2 Frontend Developer Checklist
- [ ] Component unit tests
- [ ] Screen integration tests
- [ ] Navigation tests
- [ ] Form validation tests
- [ ] API service tests
- [ ] State management tests
- [ ] Accessibility tests

### 8.3 QA Tester Checklist
- [ ] E2E tests untuk critical user flows
- [ ] Cross-platform testing (iOS/Android)
- [ ] Performance testing
- [ ] Security testing
- [ ] Usability testing
- [ ] Regression testing
- [ ] Load testing

---

## 9. Testing Tools & Dependencies

### 9.1 Backend Testing Stack
```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "@types/jest": "^29.0.0",
    "@types/supertest": "^2.0.12",
    "artillery": "^2.0.0",
    "faker": "^6.6.6"
  }
}
```

### 9.2 Frontend Testing Stack
```json
{
  "devDependencies": {
    "@testing-library/react-native": "^11.0.0",
    "@testing-library/jest-native": "^5.0.0",
    "detox": "^20.0.0",
    "jest": "^29.0.0",
    "react-test-renderer": "^18.0.0"
  }
}
```

---

## 10. Success Metrics

### 10.1 Coverage Targets
- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: 100% API endpoint coverage
- **E2E Tests**: 100% critical user flow coverage

### 10.2 Performance Targets
- **API Response Time**: < 200ms for 95% of requests
- **App Startup Time**: < 3 seconds
- **Test Suite Execution**: < 10 minutes total

### 10.3 Quality Gates
- All tests must pass before merge to main
- No critical security vulnerabilities
- Performance benchmarks must be met
- Code coverage thresholds must be maintained

---

**Dokumen ini akan diupdate seiring dengan evolusi proyek dan kebutuhan testing.**