# **QA Testing Guide: Dana Bersama**
**Panduan Lengkap untuk QA Tester dalam Menjalankan dan Memvalidasi Testing**

---

## 1. Overview Peran QA Tester

### 1.1 Tanggung Jawab Utama
- **Gatekeeper Kualitas**: Memastikan tidak ada kode yang masuk ke main branch tanpa testing yang memadai
- **Testing Framework Setup**: Menyiapkan dan memelihara testing infrastructure
- **Test Validation**: Memvalidasi bahwa semua test cases berjalan dengan benar
- **Quality Assurance**: Memastikan aplikasi memenuhi standar kualitas yang ditetapkan
- **Bug Reporting**: Mendokumentasikan dan melaporkan bug dengan detail yang jelas

### 1.2 Workflow QA Tester
```
1. Setup Testing Framework
   ↓
2. Validate Developer Tests
   ↓
3. Run Comprehensive Testing
   ↓
4. Report Results
   ↓
5. Approve/Reject for Merge
```

---

## 2. Testing Framework Setup

### 2.1 Backend Testing Setup

#### Step 1: Install Dependencies
```bash
cd src/backend
npm install --save-dev jest supertest @types/jest @types/supertest artillery faker
```

#### Step 2: Setup Jest Configuration
**File**: `src/backend/jest.config.js`
```javascript
// Copy from test-templates.md - Backend Jest Configuration
```

#### Step 3: Setup Test Database
```bash
# Create test database
psql -U postgres -c "CREATE DATABASE dana_bersama_test;"

# Set environment variables
export TEST_DB_NAME=dana_bersama_test
export TEST_DB_USER=postgres
export TEST_DB_PASSWORD=postgres
export NODE_ENV=test
```

#### Step 4: Setup Test Utilities
**File**: `src/backend/tests/setup.js`
```javascript
// Copy from test-templates.md - Test Setup File
```

**File**: `src/backend/tests/utils/testHelpers.js`
```javascript
// Copy from test-templates.md - Test Utilities
```

#### Step 5: Validate Backend Setup
```bash
# Run test to validate setup
npm run test -- --testNamePattern="setup"

# Expected output:
# ✓ Test database connection works
# ✓ Test utilities are functional
# ✓ Migrations run successfully
```

### 2.2 Frontend Testing Setup

#### Step 1: Install Dependencies
```bash
cd src/mobile
npm install --save-dev @testing-library/react-native @testing-library/jest-native detox react-test-renderer
```

#### Step 2: Setup Jest Configuration
**File**: `src/mobile/jest.config.js`
```javascript
// Copy from test-templates.md - Frontend Jest Configuration
```

#### Step 3: Setup Test Environment
**File**: `src/mobile/tests/setup.js`
```javascript
// Copy from test-templates.md - Frontend Test Setup
```

#### Step 4: Setup Test Wrapper
**File**: `src/mobile/tests/utils/TestWrapper.tsx`
```typescript
// Copy from test-templates.md - Test Wrapper Utility
```

#### Step 5: Validate Frontend Setup
```bash
# Run test to validate setup
npm run test -- --testNamePattern="setup"

# Expected output:
# ✓ React Native testing environment works
# ✓ Navigation mocks are functional
# ✓ API mocks are working
```

### 2.3 E2E Testing Setup

#### Step 1: Install Detox
```bash
# Install Detox CLI globally
npm install -g detox-cli

# Install Detox in project
cd src/mobile
npm install --save-dev detox
```

#### Step 2: Setup Detox Configuration
**File**: `src/mobile/.detoxrc.js`
```javascript
// Copy from test-templates.md - Detox Configuration
```

#### Step 3: Build App for Testing
```bash
# iOS
detox build --configuration ios.sim.debug

# Android
detox build --configuration android.emu.debug
```

#### Step 4: Validate E2E Setup
```bash
# Run basic E2E test
detox test --configuration ios.sim.debug --testNamePattern="basic"

# Expected output:
# ✓ App launches successfully
# ✓ Basic navigation works
# ✓ Test environment is ready
```

---

## 3. Test Validation Process

### 3.1 Backend Test Validation

#### Step 1: Validate Unit Tests
```bash
cd src/backend

# Run all unit tests
npm run test:unit

# Check coverage
npm run test:coverage

# Validate specific modules
npm test -- auth.controller.test.js
npm test -- expense.service.test.js
npm test -- goal.service.test.js
```

**Validation Checklist:**
- [ ] All unit tests pass
- [ ] Code coverage ≥ 80%
- [ ] No test timeouts
- [ ] No memory leaks in tests
- [ ] All edge cases covered

#### Step 2: Validate Integration Tests
```bash
# Run integration tests
npm run test:integration

# Test specific API endpoints
npm test -- --testNamePattern="API Integration"
```

**Validation Checklist:**
- [ ] All API endpoints tested
- [ ] Database operations work correctly
- [ ] Authentication flow complete
- [ ] Error handling tested
- [ ] Response format validation

#### Step 3: Validate Security Tests
```bash
# Run security tests
npm run test:security

# Test specific security aspects
npm test -- --testNamePattern="Security"
```

**Validation Checklist:**
- [ ] SQL injection prevention tested
- [ ] XSS prevention tested
- [ ] Authentication security validated
- [ ] Authorization checks working
- [ ] Rate limiting functional

### 3.2 Frontend Test Validation

#### Step 1: Validate Component Tests
```bash
cd src/mobile

# Run component tests
npm run test:unit

# Test specific components
npm test -- ExpenseForm.test.tsx
npm test -- DashboardScreen.test.tsx
```

**Validation Checklist:**
- [ ] All components render correctly
- [ ] Form validation works
- [ ] User interactions tested
- [ ] Error states handled
- [ ] Loading states tested

#### Step 2: Validate Screen Tests
```bash
# Run screen tests
npm test -- --testNamePattern="Screen"

# Test navigation
npm test -- --testNamePattern="Navigation"
```

**Validation Checklist:**
- [ ] Screen navigation works
- [ ] Data loading tested
- [ ] API integration tested
- [ ] State management validated
- [ ] User flows complete

#### Step 3: Validate E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run specific flows
detox test --configuration ios.sim.debug e2e/auth-flow.e2e.test.js
detox test --configuration android.emu.debug e2e/expense-flow.e2e.test.js
```

**Validation Checklist:**
- [ ] Critical user flows work end-to-end
- [ ] Cross-platform compatibility
- [ ] Real device testing
- [ ] Performance acceptable
- [ ] No crashes or freezes

---

## 4. Quality Gates & Approval Process

### 4.1 Quality Gates Checklist

#### Backend Quality Gates:
- [ ] **Unit Test Coverage**: ≥ 80%
- [ ] **Integration Test Coverage**: 100% API endpoints
- [ ] **Security Tests**: All pass
- [ ] **Performance Tests**: Response time < 200ms
- [ ] **Code Quality**: No critical issues
- [ ] **Documentation**: API docs updated

#### Frontend Quality Gates:
- [ ] **Component Test Coverage**: ≥ 70%
- [ ] **Screen Test Coverage**: 100% main screens
- [ ] **E2E Test Coverage**: 100% critical flows
- [ ] **Performance**: App startup < 3 seconds
- [ ] **Accessibility**: Basic accessibility requirements met
- [ ] **Cross-platform**: Works on iOS and Android

### 4.2 Approval Process

#### Step 1: Automated Validation
```bash
# Run full test suite
./scripts/run-all-tests.sh

# Check all quality gates
./scripts/quality-check.sh
```

#### Step 2: Manual Validation
- [ ] Review test results
- [ ] Validate test quality
- [ ] Check edge cases coverage
- [ ] Verify error handling
- [ ] Test user experience

#### Step 3: Approval Decision
**✅ APPROVE** if:
- All automated tests pass
- Quality gates met
- No critical bugs found
- Test coverage adequate
- Documentation complete

**❌ REJECT** if:
- Any critical test fails
- Quality gates not met
- Critical bugs found
- Insufficient test coverage
- Missing documentation

---

## 5. Bug Reporting & Management

### 5.1 Bug Detection Process

#### Automated Bug Detection:
```bash
# Run tests with verbose output
npm test -- --verbose

# Check for test failures
npm test -- --bail

# Generate test report
npm run test:report
```

#### Manual Bug Detection:
- [ ] Exploratory testing
- [ ] Edge case testing
- [ ] User experience testing
- [ ] Performance testing
- [ ] Security testing

### 5.2 Bug Reporting Template

```markdown
# Bug Report: [BUG-001] [Brief Description]

## Environment
- **Platform**: [Backend/iOS/Android]
- **Version**: [v1.0.0]
- **Environment**: [Development/Staging/Production]
- **Device**: [iPhone 14/Pixel 6/etc.]

## Bug Details
**Severity**: [Critical/High/Medium/Low]
**Priority**: [P1/P2/P3/P4]
**Component**: [Auth/Expense/Goal/etc.]

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happened]

## Test Case Reference
**Failed Test**: [Link to test case]
**Test File**: [path/to/test/file.test.js]

## Evidence
- [ ] Screenshots attached
- [ ] Logs attached
- [ ] Video recording (if applicable)
- [ ] Test output attached

## Impact Assessment
**User Impact**: [How many users affected]
**Business Impact**: [Revenue/feature impact]
**Technical Impact**: [System stability impact]

## Suggested Fix
[If you have suggestions for fixing]

## Related Issues
[Links to related bugs or features]
```

### 5.3 Bug Severity Guidelines

#### Critical (P1)
- App crashes
- Data loss
- Security vulnerabilities
- Payment/financial calculation errors
- Complete feature breakdown

#### High (P2)
- Major feature not working
- Incorrect calculations (non-financial)
- Performance issues
- API failures
- Authentication issues

#### Medium (P3)
- Minor feature issues
- UI/UX problems
- Non-critical performance issues
- Cosmetic bugs
- Edge case failures

#### Low (P4)
- Typos
- Minor UI inconsistencies
- Enhancement requests
- Documentation issues

---

## 6. Performance Testing Guide

### 6.1 Backend Performance Testing

#### Load Testing with Artillery
```bash
# Install Artillery
npm install -g artillery

# Run load tests
artillery run tests/performance/load-test.yml

# Generate report
artillery report --output report.html
```

**Performance Targets:**
- Response time: < 200ms (95th percentile)
- Throughput: > 1000 requests/second
- Error rate: < 1%
- CPU usage: < 70%
- Memory usage: < 80%

#### Database Performance Testing
```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM expenses WHERE couple_id = 'uuid';

-- Test index effectiveness
EXPLAIN ANALYZE SELECT * FROM expenses WHERE created_at > '2024-01-01';

-- Test concurrent operations
-- Run multiple expense creation operations simultaneously
```

### 6.2 Frontend Performance Testing

#### Mobile App Performance
```bash
# Test app startup time
detox test --configuration ios.sim.debug performance/startup.e2e.test.js

# Test memory usage
# Use Xcode Instruments or Android Profiler

# Test battery usage
# Use device testing with battery monitoring
```

**Performance Targets:**
- App startup: < 3 seconds
- Screen transitions: < 500ms
- Memory usage: < 100MB
- Battery drain: Minimal impact

---

## 7. Security Testing Guide

### 7.1 Authentication Security Testing

#### JWT Security Tests
```bash
# Test JWT validation
curl -H "Authorization: Bearer invalid-token" http://localhost:3000/api/auth/me

# Test token expiration
# Use expired token and verify rejection

# Test token tampering
# Modify token payload and verify rejection
```

#### Password Security Tests
```bash
# Test password hashing
# Verify passwords are never stored in plain text

# Test password strength requirements
# Try weak passwords and verify rejection

# Test rate limiting
# Multiple failed login attempts
```

### 7.2 Input Validation Testing

#### SQL Injection Tests
```bash
# Test SQL injection in login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com; DROP TABLE users;", "password":"password"}'

# Verify database is not affected
```

#### XSS Prevention Tests
```bash
# Test XSS in expense title
curl -X POST http://localhost:3000/api/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"<script>alert('XSS')</script>", "amount":100}'

# Verify script is sanitized
```

---

## 8. Continuous Integration Testing

### 8.1 CI Pipeline Setup

#### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
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
        run: |
          cd src/backend
          npm ci
          
      - name: Run tests
        run: |
          cd src/backend
          npm run test:ci
          
      - name: Upload coverage
        uses: codecov/codecov-action@v1

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd src/mobile
          npm ci
          
      - name: Run tests
        run: |
          cd src/mobile
          npm run test:ci
```

### 8.2 Quality Gates in CI

#### Automated Quality Checks
```bash
# Code coverage check
if [ "$COVERAGE" -lt "80" ]; then
  echo "Coverage below 80%: $COVERAGE%"
  exit 1
fi

# Security vulnerability check
npm audit --audit-level high

# Performance regression check
if [ "$RESPONSE_TIME" -gt "200" ]; then
  echo "Performance regression detected"
  exit 1
fi
```

---

## 9. Testing Metrics & Reporting

### 9.1 Test Metrics to Track

#### Coverage Metrics
- **Line Coverage**: % of code lines executed
- **Branch Coverage**: % of code branches executed
- **Function Coverage**: % of functions called
- **Statement Coverage**: % of statements executed

#### Quality Metrics
- **Test Pass Rate**: % of tests passing
- **Bug Detection Rate**: Bugs found per feature
- **Test Execution Time**: Time to run full suite
- **Flaky Test Rate**: % of tests that fail intermittently

#### Performance Metrics
- **Response Time**: API response times
- **Throughput**: Requests per second
- **Error Rate**: % of failed requests
- **Resource Usage**: CPU, memory, disk usage

### 9.2 Test Reporting

#### Daily Test Report Template
```markdown
# Daily Test Report - [Date]

## Test Execution Summary
- **Total Tests**: 1,234
- **Passed**: 1,200 (97.2%)
- **Failed**: 34 (2.8%)
- **Skipped**: 0
- **Execution Time**: 15 minutes

## Coverage Report
- **Line Coverage**: 85%
- **Branch Coverage**: 82%
- **Function Coverage**: 90%

## Failed Tests
1. **auth.controller.test.js**: Login rate limiting test
2. **expense.service.test.js**: Split calculation edge case
3. **goal.e2e.test.js**: Goal completion flow

## Performance Metrics
- **Average Response Time**: 150ms
- **95th Percentile**: 280ms
- **Error Rate**: 0.5%

## Security Scan Results
- **High Vulnerabilities**: 0
- **Medium Vulnerabilities**: 2
- **Low Vulnerabilities**: 5

## Action Items
- [ ] Fix failing rate limiting test
- [ ] Address split calculation edge case
- [ ] Investigate goal completion E2E failure
- [ ] Update dependencies with medium vulnerabilities

## Quality Gate Status
✅ **PASSED** - All quality gates met
```

---

## 10. Best Practices & Tips

### 10.1 Testing Best Practices

#### Test Writing Guidelines
- **Descriptive Test Names**: Use clear, descriptive test names
- **Single Responsibility**: Each test should test one thing
- **Independent Tests**: Tests should not depend on each other
- **Fast Execution**: Keep tests fast and efficient
- **Reliable Tests**: Avoid flaky tests

#### Test Data Management
- **Use Factories**: Create test data using factories
- **Clean State**: Start each test with clean state
- **Realistic Data**: Use realistic test data
- **Edge Cases**: Test edge cases and boundary conditions

### 10.2 Common Pitfalls to Avoid

#### Testing Antipatterns
- **Testing Implementation Details**: Focus on behavior, not implementation
- **Overly Complex Tests**: Keep tests simple and focused
- **Insufficient Assertions**: Make meaningful assertions
- **Ignoring Edge Cases**: Test boundary conditions
- **Not Testing Error Paths**: Test error handling

#### Performance Pitfalls
- **Slow Tests**: Optimize test execution time
- **Resource Leaks**: Clean up resources after tests
- **Database Pollution**: Clean test database between runs
- **Network Dependencies**: Mock external services

---

## 11. Troubleshooting Guide

### 11.1 Common Test Issues

#### Backend Test Issues
```bash
# Database connection issues
psql -U postgres -d dana_bersama_test -c "SELECT 1;"

# Migration issues
npm run migrate:test

# Port conflicts
lsof -i :3000
kill -9 <PID>

# Memory issues
node --max-old-space-size=4096 node_modules/.bin/jest
```

#### Frontend Test Issues
```bash
# Metro bundler issues
npx react-native start --reset-cache

# Simulator issues
xcrun simctl erase all

# Android emulator issues
adb kill-server && adb start-server

# Node modules issues
rm -rf node_modules && npm install
```

### 11.2 Debug Commands

#### Test Debugging
```bash
# Run single test with debug
npm test -- --testNamePattern="specific test" --verbose

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Run tests with coverage
npm test -- --coverage --coverageReporters=text-lcov

# Run tests in watch mode
npm test -- --watch
```

---

**Panduan ini harus diikuti oleh QA Tester untuk memastikan kualitas testing yang konsisten dan komprehensif dalam proyek Dana Bersama.**