# **Testing Checklist: Dana Bersama**
**Checklist Testing untuk Backend & Frontend Developer**

---

## 1. Backend Developer Testing Checklist

### 1.1 Authentication & Authorization
**File yang harus ditest:** `auth.controller.js`, `auth.service.js`, `auth.middleware.js`

#### Unit Tests Required:
- [ ] **Register User**
  - [ ] Valid registration data creates user successfully
  - [ ] Invalid email format rejected
  - [ ] Weak password rejected (< 8 characters)
  - [ ] Duplicate email registration rejected
  - [ ] Password is hashed before storing
  - [ ] JWT token generated correctly

- [ ] **Login User**
  - [ ] Valid credentials return user and token
  - [ ] Invalid email rejected
  - [ ] Wrong password rejected
  - [ ] Non-existent user rejected
  - [ ] Rate limiting works after multiple failed attempts

- [ ] **JWT Middleware**
  - [ ] Valid JWT allows access
  - [ ] Invalid JWT rejected
  - [ ] Expired JWT rejected
  - [ ] Missing JWT rejected
  - [ ] User data extracted correctly from JWT

#### Integration Tests Required:
- [ ] **API Endpoints**
  - [ ] `POST /api/auth/register` - Full registration flow
  - [ ] `POST /api/auth/login` - Full login flow
  - [ ] `GET /api/auth/me` - Get user profile with JWT
  - [ ] `POST /api/auth/logout` - Logout functionality
  - [ ] `POST /api/auth/refresh` - Token refresh

#### Security Tests Required:
- [ ] SQL injection prevention in login
- [ ] XSS prevention in user input
- [ ] CSRF protection
- [ ] Rate limiting on auth endpoints
- [ ] Password complexity validation

### 1.2 Expense Management
**File yang harus ditest:** `expense.controller.js`, `expense.service.js`

#### Unit Tests Required:
- [ ] **Create Expense**
  - [ ] Equal split calculation (50/50)
  - [ ] Percentage split calculation
  - [ ] Custom split calculation
  - [ ] Amount validation (positive numbers only)
  - [ ] Split validation (percentages sum to 100%)
  - [ ] Category validation
  - [ ] Date validation

- [ ] **Update Expense**
  - [ ] Title update
  - [ ] Amount update with recalculation
  - [ ] Split type change with recalculation
  - [ ] Category update
  - [ ] Authorization check (only couple members can update)

- [ ] **Delete Expense**
  - [ ] Successful deletion
  - [ ] Authorization check
  - [ ] Non-existent expense handling

- [ ] **Get Expenses**
  - [ ] Get all expenses for couple
  - [ ] Pagination
  - [ ] Filtering by category
  - [ ] Filtering by date range
  - [ ] Sorting by date/amount

#### Integration Tests Required:
- [ ] **API Endpoints**
  - [ ] `POST /api/expenses` - Create expense
  - [ ] `GET /api/expenses` - Get expenses with filters
  - [ ] `GET /api/expenses/:id` - Get single expense
  - [ ] `PUT /api/expenses/:id` - Update expense
  - [ ] `DELETE /api/expenses/:id` - Delete expense

#### Business Logic Tests Required:
- [ ] Split calculation accuracy for different amounts
- [ ] Currency formatting and precision
- [ ] Expense categorization
- [ ] Date handling across timezones

### 1.3 Goal Management
**File yang harus ditest:** `goal.controller.js`, `goal.service.js`

#### Unit Tests Required:
- [ ] **Create Goal**
  - [ ] Valid goal creation
  - [ ] Target amount validation
  - [ ] Target date validation (future date)
  - [ ] Title validation
  - [ ] Initial current amount is 0

- [ ] **Add Contribution**
  - [ ] Valid contribution added
  - [ ] Current amount updated correctly
  - [ ] Progress percentage calculated
  - [ ] Goal completion detection
  - [ ] Negative contribution rejected

- [ ] **Update Goal**
  - [ ] Target amount update
  - [ ] Target date update
  - [ ] Title update
  - [ ] Status update (active/paused/completed)

#### Integration Tests Required:
- [ ] **API Endpoints**
  - [ ] `POST /api/goals` - Create goal
  - [ ] `GET /api/goals` - Get goals for couple
  - [ ] `PUT /api/goals/:id` - Update goal
  - [ ] `POST /api/goals/:id/contribute` - Add contribution
  - [ ] `DELETE /api/goals/:id` - Delete goal

### 1.4 Couple Management
**File yang harus ditest:** `couple.controller.js`, `couple.service.js`

#### Unit Tests Required:
- [ ] **Create Couple Relationship**
  - [ ] Valid couple creation
  - [ ] Duplicate relationship prevention
  - [ ] Self-pairing prevention
  - [ ] Invitation system

- [ ] **Couple Status Management**
  - [ ] Accept invitation
  - [ ] Reject invitation
  - [ ] Leave couple
  - [ ] Status transitions

#### Integration Tests Required:
- [ ] **API Endpoints**
  - [ ] `POST /api/couples/invite` - Send invitation
  - [ ] `POST /api/couples/accept` - Accept invitation
  - [ ] `POST /api/couples/reject` - Reject invitation
  - [ ] `GET /api/couples/me` - Get current couple info

### 1.5 Database Tests
**File yang harus ditest:** Database models and migrations

#### Database Integrity Tests:
- [ ] **Foreign Key Constraints**
  - [ ] Expense references valid couple
  - [ ] Goal references valid couple
  - [ ] Transaction references valid goal and user
  - [ ] Couple references valid users

- [ ] **Data Validation**
  - [ ] Email uniqueness
  - [ ] UUID format validation
  - [ ] Decimal precision for amounts
  - [ ] Date format validation

- [ ] **Migration Tests**
  - [ ] All migrations run successfully
  - [ ] Rollback functionality works
  - [ ] Data integrity maintained during migrations

---

## 2. Frontend Developer Testing Checklist

### 2.1 Authentication Screens
**File yang harus ditest:** `LoginScreen.tsx`, `RegisterScreen.tsx`, `AuthService.ts`

#### Component Tests Required:
- [ ] **Login Screen**
  - [ ] All form fields render correctly
  - [ ] Email validation (format)
  - [ ] Password validation (required)
  - [ ] Form submission with valid data
  - [ ] Error display for invalid credentials
  - [ ] Loading state during login
  - [ ] Navigation to register screen
  - [ ] "Forgot Password" link functionality

- [ ] **Register Screen**
  - [ ] All form fields render correctly
  - [ ] Email format validation
  - [ ] Password strength validation
  - [ ] Confirm password matching
  - [ ] Form submission with valid data
  - [ ] Error display for registration failures
  - [ ] Loading state during registration
  - [ ] Navigation to login screen

#### Integration Tests Required:
- [ ] **Authentication Flow**
  - [ ] Successful login navigates to dashboard
  - [ ] Failed login shows error message
  - [ ] Registration success navigates to verification
  - [ ] Token storage in AsyncStorage
  - [ ] Auto-login on app restart with valid token

### 2.2 Expense Management Screens
**File yang harus ditest:** `ExpenseListScreen.tsx`, `AddExpenseScreen.tsx`, `ExpenseDetailScreen.tsx`

#### Component Tests Required:
- [ ] **Expense List Screen**
  - [ ] Expense list renders correctly
  - [ ] Empty state display
  - [ ] Loading state display
  - [ ] Error state display
  - [ ] Pull-to-refresh functionality
  - [ ] Infinite scroll/pagination
  - [ ] Filter by category
  - [ ] Search functionality

- [ ] **Add Expense Screen**
  - [ ] Form fields render correctly
  - [ ] Title validation (required)
  - [ ] Amount validation (positive number)
  - [ ] Category selection
  - [ ] Split type selection (equal/percentage/custom)
  - [ ] Split calculation display
  - [ ] Date picker functionality
  - [ ] Form submission
  - [ ] Loading state during submission

- [ ] **Expense Detail Screen**
  - [ ] Expense details display correctly
  - [ ] Split breakdown display
  - [ ] Edit button functionality
  - [ ] Delete button functionality
  - [ ] Confirmation dialog for delete

#### Business Logic Tests Required:
- [ ] **Split Calculations**
  - [ ] Equal split calculation (50/50)
  - [ ] Percentage split calculation
  - [ ] Custom split validation
  - [ ] Split total validation (must equal expense amount)
  - [ ] Currency formatting

### 2.3 Goal Management Screens
**File yang harus ditest:** `GoalListScreen.tsx`, `AddGoalScreen.tsx`, `GoalDetailScreen.tsx`

#### Component Tests Required:
- [ ] **Goal List Screen**
  - [ ] Goal list renders correctly
  - [ ] Progress bars display correctly
  - [ ] Empty state display
  - [ ] Goal completion status
  - [ ] Navigation to goal details

- [ ] **Add Goal Screen**
  - [ ] Form fields render correctly
  - [ ] Title validation
  - [ ] Target amount validation
  - [ ] Target date validation (future date)
  - [ ] Form submission
  - [ ] Loading state

- [ ] **Goal Detail Screen**
  - [ ] Goal information display
  - [ ] Progress visualization
  - [ ] Contribution history
  - [ ] Add contribution functionality
  - [ ] Edit goal functionality

#### Progress Calculation Tests:
- [ ] **Progress Logic**
  - [ ] Progress percentage calculation
  - [ ] Progress bar visual representation
  - [ ] Goal completion detection
  - [ ] Contribution tracking

### 2.4 Dashboard Screen
**File yang harus ditest:** `DashboardScreen.tsx`

#### Component Tests Required:
- [ ] **Dashboard Components**
  - [ ] Recent expenses display
  - [ ] Goal progress summary
  - [ ] Quick action buttons
  - [ ] Balance summary
  - [ ] Loading states for all sections
  - [ ] Error states for failed data loads
  - [ ] Refresh functionality

#### Data Integration Tests:
- [ ] **API Integration**
  - [ ] Expense data loading
  - [ ] Goal data loading
  - [ ] Real-time data updates
  - [ ] Offline state handling

### 2.5 Navigation Tests
**File yang harus ditest:** Navigation configuration and flows

#### Navigation Tests Required:
- [ ] **Screen Navigation**
  - [ ] Tab navigation between main screens
  - [ ] Stack navigation for detail screens
  - [ ] Back button functionality
  - [ ] Deep linking support
  - [ ] Authentication-based navigation

- [ ] **Navigation State**
  - [ ] Navigation state persistence
  - [ ] Proper screen transitions
  - [ ] Navigation params passing

### 2.6 Form Components
**File yang harus ditest:** Reusable form components

#### Form Component Tests:
- [ ] **Input Components**
  - [ ] Text input validation
  - [ ] Number input formatting
  - [ ] Date picker functionality
  - [ ] Dropdown/picker components
  - [ ] Error state display
  - [ ] Accessibility support

- [ ] **Form Validation**
  - [ ] Real-time validation
  - [ ] Form submission validation
  - [ ] Error message display
  - [ ] Field focus management

---

## 3. Integration Testing Checklist

### 3.1 API Integration Tests
**File yang harus ditest:** Full API integration

#### End-to-End API Tests:
- [ ] **Authentication Flow**
  - [ ] Register → Login → Access Protected Route
  - [ ] Token refresh flow
  - [ ] Logout and token invalidation

- [ ] **Expense Management Flow**
  - [ ] Create expense → View in list → Edit → Delete
  - [ ] Split calculation accuracy across API
  - [ ] Expense filtering and pagination

- [ ] **Goal Management Flow**
  - [ ] Create goal → Add contributions → Track progress → Complete goal
  - [ ] Goal editing and deletion

### 3.2 Database Integration Tests
**File yang harus ditest:** Database operations

#### Database Integration:
- [ ] **Data Consistency**
  - [ ] Concurrent expense creation
  - [ ] Transaction rollback on errors
  - [ ] Foreign key constraint enforcement
  - [ ] Data integrity during updates

- [ ] **Performance Tests**
  - [ ] Large dataset handling
  - [ ] Query optimization
  - [ ] Index effectiveness

---

## 4. E2E Testing Checklist

### 4.1 Critical User Flows
**File yang harus ditest:** Complete user journeys

#### E2E Test Scenarios:
- [ ] **New User Onboarding**
  - [ ] App download → Registration → Email verification → First login → Dashboard
  - [ ] Partner invitation → Accept invitation → Couple setup

- [ ] **Daily Usage Flow**
  - [ ] Login → Add expense → Split with partner → View dashboard → Logout
  - [ ] Create savings goal → Add contribution → Track progress

- [ ] **Expense Management**
  - [ ] Create expense → Edit details → Change split → Delete expense
  - [ ] Bulk expense operations
  - [ ] Expense filtering and search

- [ ] **Goal Achievement**
  - [ ] Create goal → Multiple contributions → Goal completion → Celebration

### 4.2 Cross-Platform Tests
**File yang harus ditest:** Platform-specific functionality

#### Platform Tests:
- [ ] **iOS Specific**
  - [ ] iOS navigation patterns
  - [ ] iOS-specific UI components
  - [ ] iOS permissions (notifications, etc.)

- [ ] **Android Specific**
  - [ ] Android navigation patterns
  - [ ] Android-specific UI components
  - [ ] Android permissions

---

## 5. Performance Testing Checklist

### 5.1 Backend Performance
**File yang harus ditest:** API performance

#### Performance Tests:
- [ ] **Load Testing**
  - [ ] 100 concurrent users
  - [ ] 500 concurrent users
  - [ ] 1000 concurrent users
  - [ ] Response time < 200ms for 95% of requests

- [ ] **Stress Testing**
  - [ ] Database connection limits
  - [ ] Memory usage under load
  - [ ] CPU usage optimization

### 5.2 Frontend Performance
**File yang harus ditest:** Mobile app performance

#### Mobile Performance Tests:
- [ ] **App Performance**
  - [ ] App startup time < 3 seconds
  - [ ] Screen transition smoothness
  - [ ] Memory usage optimization
  - [ ] Battery usage optimization

- [ ] **Data Loading**
  - [ ] Large expense list performance
  - [ ] Image loading optimization
  - [ ] Offline data caching

---

## 6. Security Testing Checklist

### 6.1 Authentication Security
**File yang harus ditest:** Security measures

#### Security Tests:
- [ ] **Input Validation**
  - [ ] SQL injection prevention
  - [ ] XSS prevention
  - [ ] CSRF protection
  - [ ] Input sanitization

- [ ] **Authentication Security**
  - [ ] JWT token security
  - [ ] Password hashing verification
  - [ ] Session management
  - [ ] Rate limiting effectiveness

### 6.2 Data Security
**File yang harus ditest:** Data protection

#### Data Security Tests:
- [ ] **Data Access Control**
  - [ ] User can only access own data
  - [ ] Couple data isolation
  - [ ] Admin access controls

- [ ] **Data Encryption**
  - [ ] Sensitive data encryption at rest
  - [ ] Data transmission encryption
  - [ ] API key protection

---

## 7. Testing Execution Guidelines

### 7.1 Test Execution Order
1. **Unit Tests** - Run first, fastest feedback
2. **Integration Tests** - Run after unit tests pass
3. **E2E Tests** - Run before deployment
4. **Performance Tests** - Run periodically
5. **Security Tests** - Run before each release

### 7.2 Coverage Requirements
- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: 100% API endpoint coverage
- **E2E Tests**: 100% critical user flow coverage

### 7.3 Test Data Management
- Use test database for all testing
- Clean test data between test runs
- Use factories for consistent test data
- Mock external services

### 7.4 CI/CD Integration
- All tests must pass before merge
- Automated test execution on PR
- Performance regression detection
- Security vulnerability scanning

---

## 8. Bug Reporting Template

### 8.1 Bug Report Format
```markdown
## Bug Report

**Title**: [Brief description of the bug]

**Environment**:
- Platform: [iOS/Android/Backend]
- Version: [App/API version]
- Device: [Device model if mobile]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots/Logs**:
[Attach relevant screenshots or logs]

**Severity**: [Critical/High/Medium/Low]

**Test Case**: [Link to failed test case if applicable]
```

### 8.2 Bug Severity Levels
- **Critical**: App crashes, data loss, security vulnerabilities
- **High**: Major feature not working, incorrect calculations
- **Medium**: Minor feature issues, UI problems
- **Low**: Cosmetic issues, minor UX improvements

---

**Checklist ini harus diikuti oleh setiap developer sebelum menandai task sebagai complete. QA Tester akan memverifikasi bahwa semua test cases telah diimplementasi dan berjalan dengan baik.**