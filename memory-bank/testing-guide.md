# 🧪 **Testing Guide - Dana Bersama**

**Update Terakhir:** 19 Desember 2024  
**Status:** ✅ Backend Testing Complete | 🚧 Frontend Testing Ready  
**Coverage:** Backend 95%+ | Frontend TBD

---

## 🎯 **Testing Overview**

Panduan komprehensif untuk testing aplikasi Dana Bersama, mencakup backend API testing dan persiapan frontend mobile testing.

---

## 🔧 **Backend Testing (Complete)**

### **Test Structure**
```
tests/
├── controllers/           # ✅ Controller unit tests
│   ├── authController.test.js
│   ├── expenseController.test.js
│   ├── goalController.test.js
│   ├── reportController.test.js
│   └── userController.test.js
├── models/               # ✅ Model tests
│   ├── User.test.js
│   ├── Couple.test.js
│   ├── Expense.test.js
│   ├── Goal.test.js
│   └── Transaction.test.js
├── integration/          # ✅ API integration tests
│   ├── auth.test.js
│   ├── expenses.test.js
│   ├── goals.test.js
│   ├── reports.test.js
│   └── users.test.js
└── utils/               # ✅ Test helpers
    ├── testSetup.js
    ├── testData.js
    └── testHelpers.js
```

### **Running Backend Tests**
```bash
# Navigate to backend directory
cd src/backend

# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:controllers   # Controller tests only
npm run test:models        # Model tests only

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- controllers/expenseController.test.js
```

### **Test Coverage Report**
```
✅ Controllers: 98% coverage
✅ Models: 95% coverage
✅ Routes: 100% coverage
✅ Middleware: 92% coverage
✅ Utils: 90% coverage

Overall: 95%+ coverage
```

---

## 📱 **Frontend Testing (Ready for Implementation)**

### **Recommended Test Structure**
```
__tests__/
├── components/           # Component unit tests
│   ├── ui/
│   │   ├── Button.test.tsx
│   │   ├── Input.test.tsx
│   │   └── Card.test.tsx
│   ├── forms/
│   │   ├── ExpenseForm.test.tsx
│   │   └── GoalForm.test.tsx
│   └── charts/
│       ├── ExpenseChart.test.tsx
│       └── GoalProgress.test.tsx
├── screens/              # Screen integration tests
│   ├── auth/
│   │   ├── LoginScreen.test.tsx
│   │   └── RegisterScreen.test.tsx
│   ├── Dashboard.test.tsx
│   ├── ExpensesScreen.test.tsx
│   ├── GoalsScreen.test.tsx
│   └── ProfileScreen.test.tsx
├── services/             # API service tests
│   ├── api.test.ts
│   ├── auth.test.ts
│   ├── expenses.test.ts
│   └── goals.test.ts
├── stores/               # State management tests
│   ├── authStore.test.ts
│   ├── expenseStore.test.ts
│   └── goalStore.test.ts
├── hooks/                # Custom hooks tests
│   ├── useAuth.test.ts
│   └── useApi.test.ts
├── utils/                # Utility function tests
│   ├── formatters.test.ts
│   └── validators.test.ts
└── e2e/                  # End-to-end tests
    ├── auth.e2e.ts
    ├── expenses.e2e.ts
    ├── goals.e2e.ts
    └── reports.e2e.ts
```

### **Frontend Testing Setup**
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react-native
npm install --save-dev @testing-library/jest-native
npm install --save-dev react-test-renderer
npm install --save-dev detox # For E2E testing

# Setup test configuration
# jest.config.js already configured in setup guide
```

---

## 🔍 **API Testing Manual**

### **Authentication Endpoints**

#### **POST /api/auth/register**
```bash
# Test Case 1: Successful Registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'

# Expected: 201 Created with user data and token

# Test Case 2: Duplicate Email
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User 2"
  }'

# Expected: 400 Bad Request with validation error
```

#### **POST /api/auth/login**
```bash
# Test Case 1: Successful Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Expected: 200 OK with user data and token

# Test Case 2: Invalid Credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }'

# Expected: 401 Unauthorized
```

### **Expense Endpoints**

#### **GET /api/expenses**
```bash
# Test Case 1: Get All Expenses (with auth)
curl -X GET http://localhost:3000/api/expenses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with expenses array

# Test Case 2: Get Expenses with Filters
curl -X GET "http://localhost:3000/api/expenses?category=food&start_date=2024-01-01&end_date=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with filtered expenses

# Test Case 3: Unauthorized Access
curl -X GET http://localhost:3000/api/expenses

# Expected: 401 Unauthorized
```

#### **POST /api/expenses**
```bash
# Test Case 1: Create Expense
curl -X POST http://localhost:3000/api/expenses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Lunch at Restaurant",
    "amount": 50000,
    "category": "food",
    "description": "Team lunch",
    "expense_date": "2024-12-19",
    "is_shared": false
  }'

# Expected: 201 Created with expense data

# Test Case 2: Invalid Data
curl -X POST http://localhost:3000/api/expenses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "",
    "amount": -1000
  }'

# Expected: 400 Bad Request with validation errors
```

### **Goal Endpoints**

#### **GET /api/goals**
```bash
# Test Case 1: Get All Goals
curl -X GET http://localhost:3000/api/goals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with goals array

# Test Case 2: Get Goals with Filters
curl -X GET "http://localhost:3000/api/goals?status=active&priority=high" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with filtered goals
```

#### **POST /api/goals**
```bash
# Test Case 1: Create Goal
curl -X POST http://localhost:3000/api/goals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Emergency Fund",
    "target_amount": 10000000,
    "category": "savings",
    "description": "6 months emergency fund",
    "target_date": "2025-06-01",
    "priority": "high",
    "is_shared": false
  }'

# Expected: 201 Created with goal data
```

### **Report Endpoints**

#### **GET /api/reports/summary**
```bash
# Test Case 1: Monthly Summary
curl -X GET "http://localhost:3000/api/reports/summary?period=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with financial summary

# Test Case 2: Yearly Summary
curl -X GET "http://localhost:3000/api/reports/summary?period=year" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: 200 OK with yearly financial summary
```

---

## 🎯 **Test Scenarios**

### **Critical User Flows**

#### **1. User Registration & Login Flow**
```
1. Register new user
2. Verify email validation
3. Login with credentials
4. Verify token generation
5. Access protected endpoints
6. Token expiry handling
```

#### **2. Expense Management Flow**
```
1. Create new expense
2. View expense list
3. Filter expenses by category/date
4. Update expense details
5. Delete expense
6. Verify data persistence
```

#### **3. Goal Tracking Flow**
```
1. Create new goal
2. Add contribution to goal
3. View goal progress
4. Update goal details
5. Complete goal
6. View goal history
```

#### **4. Couple Management Flow**
```
1. Send couple invitation
2. Accept invitation
3. Share expenses
4. View shared data
5. Manage permissions
6. Leave couple
```

#### **5. Reporting Flow**
```
1. Generate monthly report
2. View expense breakdown
3. Check goal progress
4. Export data (future)
5. Compare periods
```

---

## 🔧 **Testing Tools & Commands**

### **Backend Testing Commands**
```bash
# Quick test all
npm test

# Test with coverage
npm run test:coverage

# Test specific controller
npm test -- --testPathPattern=controllers/expenseController

# Test specific endpoint
npm test -- --testNamePattern="should create expense"

# Run integration tests only
npm run test:integration

# Debug tests
npm test -- --detectOpenHandles --forceExit
```

### **API Testing Tools**
- **Postman**: Collection available (import from `tests/postman/`)
- **Insomnia**: REST client alternative
- **curl**: Command line testing (examples above)
- **HTTPie**: User-friendly HTTP client

### **Frontend Testing Commands (Future)**
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Component tests
npm run test:components

# Test coverage
npm run test:coverage

# Visual regression tests
npm run test:visual
```

---

## 📊 **Test Data & Fixtures**

### **Sample Test Users**
```json
{
  "testUser1": {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123",
    "full_name": "John Doe"
  },
  "testUser2": {
    "username": "jane_doe",
    "email": "jane@example.com",
    "password": "password123",
    "full_name": "Jane Doe"
  }
}
```

### **Sample Test Expenses**
```json
[
  {
    "title": "Grocery Shopping",
    "amount": 150000,
    "category": "food",
    "expense_date": "2024-12-19",
    "is_shared": true
  },
  {
    "title": "Gas Station",
    "amount": 100000,
    "category": "transportation",
    "expense_date": "2024-12-18",
    "is_shared": false
  }
]
```

### **Sample Test Goals**
```json
[
  {
    "title": "Vacation Fund",
    "target_amount": 5000000,
    "category": "travel",
    "target_date": "2025-07-01",
    "priority": "medium",
    "is_shared": true
  },
  {
    "title": "New Laptop",
    "target_amount": 15000000,
    "category": "electronics",
    "target_date": "2025-03-01",
    "priority": "high",
    "is_shared": false
  }
]
```

---

## 🚨 **Common Issues & Solutions**

### **Backend Testing Issues**

#### **Database Connection Issues**
```bash
# Solution: Reset test database
npm run db:test:reset

# Or manually
node database/migrate.js --env=test
node database/seed.js --env=test
```

#### **Port Already in Use**
```bash
# Solution: Kill process on port 3000
npx kill-port 3000

# Or use different port for testing
PORT=3001 npm test
```

#### **JWT Token Issues**
```bash
# Solution: Check JWT_SECRET in .env.test
echo $JWT_SECRET

# Generate new secret if needed
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **API Testing Issues**

#### **CORS Issues**
```javascript
// Solution: Update CORS configuration in app.js
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:19006'],
  credentials: true
}));
```

#### **Request Timeout**
```bash
# Solution: Increase timeout in axios config
const api = axios.create({
  timeout: 30000 // 30 seconds
});
```

---

## ✅ **Testing Checklist**

### **Backend API Testing (Complete)**
- [x] Authentication endpoints
- [x] User management
- [x] Expense CRUD operations
- [x] Goal CRUD operations
- [x] Report generation
- [x] Couple management
- [x] Input validation
- [x] Error handling
- [x] Authorization checks
- [x] Database constraints
- [x] Edge cases
- [x] Performance testing

### **Frontend Testing (Ready for Implementation)**
- [ ] Component unit tests
- [ ] Screen integration tests
- [ ] Navigation testing
- [ ] Form validation
- [ ] API integration
- [ ] State management
- [ ] Error handling
- [ ] Offline scenarios
- [ ] Performance testing
- [ ] Accessibility testing
- [ ] Device compatibility
- [ ] E2E user flows

---

## 🎯 **Quality Metrics**

### **Current Status**
- **Backend Code Coverage**: 95%+
- **API Endpoint Coverage**: 100%
- **Critical Path Testing**: ✅ Complete
- **Error Scenario Coverage**: ✅ Complete
- **Performance Testing**: ✅ Basic load testing done

### **Target Metrics**
- **Overall Code Coverage**: >90%
- **Critical Bug Rate**: <1%
- **API Response Time**: <200ms average
- **Mobile App Performance**: 60fps, <3s load time
- **Test Automation**: >80% automated

---

**🧪 Backend testing complete - Frontend testing ready to implement!**  
**All API endpoints tested and documented - ready for mobile integration! 🚀**