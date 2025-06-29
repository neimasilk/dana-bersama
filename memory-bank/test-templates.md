# **Test Templates: Dana Bersama**
**Template dan Setup Files untuk Testing Implementation**

---

## 1. Backend Test Templates

### 1.1 Jest Configuration
**File**: `src/backend/jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/config/**',
    '!src/migrations/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000,
  verbose: true
};
```

### 1.2 Test Setup File
**File**: `src/backend/tests/setup.js`

```javascript
const { Pool } = require('pg');
const { migrate } = require('postgres-migrations');

// Test database configuration
const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'dana_bersama_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres'
};

let testDb;

// Setup before all tests
beforeAll(async () => {
  // Create test database connection
  testDb = new Pool(testDbConfig);
  
  // Run migrations
  await migrate(testDbConfig, 'src/backend/migrations');
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
});

// Cleanup after each test
afterEach(async () => {
  // Clear all tables but keep structure
  const tables = [
    'transactions',
    'goals', 
    'expenses',
    'couples',
    'users'
  ];
  
  for (const table of tables) {
    await testDb.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
  }
});

// Cleanup after all tests
afterAll(async () => {
  await testDb.end();
});

// Export test utilities
global.testDb = testDb;
global.testDbConfig = testDbConfig;
```

### 1.3 Test Utilities
**File**: `src/backend/tests/utils/testHelpers.js`

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Test data factories
class TestDataFactory {
  static async createUser(overrides = {}) {
    const userData = {
      id: uuidv4(),
      email: `test${Date.now()}@example.com`,
      password_hash: await bcrypt.hash('password123', 10),
      first_name: 'Test',
      last_name: 'User',
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides
    };

    const result = await global.testDb.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userData.id, userData.email, userData.password_hash, 
       userData.first_name, userData.last_name, userData.created_at, userData.updated_at]
    );

    return result.rows[0];
  }

  static async createCouple(user1Id, user2Id, overrides = {}) {
    const coupleData = {
      id: uuidv4(),
      user1_id: user1Id,
      user2_id: user2Id,
      status: 'active',
      created_at: new Date(),
      ...overrides
    };

    const result = await global.testDb.query(
      `INSERT INTO couples (id, user1_id, user2_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [coupleData.id, coupleData.user1_id, coupleData.user2_id, 
       coupleData.status, coupleData.created_at]
    );

    return result.rows[0];
  }

  static async createExpense(coupleId, createdBy, overrides = {}) {
    const expenseData = {
      id: uuidv4(),
      couple_id: coupleId,
      created_by: createdBy,
      title: 'Test Expense',
      amount: 100000,
      category: 'Food',
      description: 'Test expense description',
      expense_date: new Date().toISOString().split('T')[0],
      split_type: 'equal',
      split_data: { user1: 50000, user2: 50000 },
      created_at: new Date(),
      ...overrides
    };

    const result = await global.testDb.query(
      `INSERT INTO expenses (id, couple_id, created_by, title, amount, category, 
                           description, expense_date, split_type, split_data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [expenseData.id, expenseData.couple_id, expenseData.created_by,
       expenseData.title, expenseData.amount, expenseData.category,
       expenseData.description, expenseData.expense_date, expenseData.split_type,
       JSON.stringify(expenseData.split_data), expenseData.created_at]
    );

    return result.rows[0];
  }

  static async createGoal(coupleId, overrides = {}) {
    const goalData = {
      id: uuidv4(),
      couple_id: coupleId,
      title: 'Test Goal',
      description: 'Test goal description',
      target_amount: 1000000,
      current_amount: 0,
      target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      created_at: new Date(),
      ...overrides
    };

    const result = await global.testDb.query(
      `INSERT INTO goals (id, couple_id, title, description, target_amount, 
                         current_amount, target_date, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [goalData.id, goalData.couple_id, goalData.title, goalData.description,
       goalData.target_amount, goalData.current_amount, goalData.target_date,
       goalData.status, goalData.created_at]
    );

    return result.rows[0];
  }

  static generateJWT(userId) {
    return jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  static async createAuthenticatedUser() {
    const user = await this.createUser();
    const token = this.generateJWT(user.id);
    return { user, token };
  }

  static async createCoupleWithUsers() {
    const user1 = await this.createUser({ email: 'user1@test.com' });
    const user2 = await this.createUser({ email: 'user2@test.com' });
    const couple = await this.createCouple(user1.id, user2.id);
    
    return {
      user1,
      user2,
      couple,
      token1: this.generateJWT(user1.id),
      token2: this.generateJWT(user2.id)
    };
  }
}

module.exports = { TestDataFactory };
```

### 1.4 Controller Test Template
**File**: `src/backend/tests/controllers/auth.controller.test.js`

```javascript
const request = require('supertest');
const app = require('../../app'); // Your Express app
const { TestDataFactory } = require('../utils/testHelpers');

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@test.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('password');
    });

    it('should reject duplicate email registration', async () => {
      const existingUser = await TestDataFactory.createUser({
        email: 'existing@test.com'
      });

      const userData = {
        email: 'existing@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await TestDataFactory.createUser({
        email: 'login@test.com'
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.id).toBe(testUser.id);
    });

    it('should reject login with wrong password', async () => {
      const loginData = {
        email: 'login@test.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const { user, token } = await TestDataFactory.createAuthenticatedUser();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('token');
    });
  });
});
```

### 1.5 Service Test Template
**File**: `src/backend/tests/services/expense.service.test.js`

```javascript
const ExpenseService = require('../../services/expense.service');
const { TestDataFactory } = require('../utils/testHelpers');

describe('Expense Service', () => {
  let testData;

  beforeEach(async () => {
    testData = await TestDataFactory.createCoupleWithUsers();
  });

  describe('createExpense', () => {
    it('should create expense with equal split', async () => {
      const expenseData = {
        coupleId: testData.couple.id,
        createdBy: testData.user1.id,
        title: 'Groceries',
        amount: 200000,
        category: 'Food',
        description: 'Weekly groceries',
        expenseDate: '2024-01-15',
        splitType: 'equal'
      };

      const expense = await ExpenseService.createExpense(expenseData);

      expect(expense).toHaveProperty('id');
      expect(expense.title).toBe(expenseData.title);
      expect(expense.amount).toBe(expenseData.amount);
      expect(expense.split_type).toBe('equal');
      expect(expense.split_data).toEqual({
        [testData.user1.id]: 100000,
        [testData.user2.id]: 100000
      });
    });

    it('should create expense with percentage split', async () => {
      const expenseData = {
        coupleId: testData.couple.id,
        createdBy: testData.user1.id,
        title: 'Rent',
        amount: 3000000,
        category: 'Housing',
        splitType: 'percentage',
        splitData: {
          [testData.user1.id]: 60,
          [testData.user2.id]: 40
        }
      };

      const expense = await ExpenseService.createExpense(expenseData);

      expect(expense.split_data).toEqual({
        [testData.user1.id]: 1800000,
        [testData.user2.id]: 1200000
      });
    });

    it('should create expense with custom split', async () => {
      const expenseData = {
        coupleId: testData.couple.id,
        createdBy: testData.user1.id,
        title: 'Dinner',
        amount: 150000,
        category: 'Food',
        splitType: 'custom',
        splitData: {
          [testData.user1.id]: 100000,
          [testData.user2.id]: 50000
        }
      };

      const expense = await ExpenseService.createExpense(expenseData);

      expect(expense.split_data).toEqual(expenseData.splitData);
    });

    it('should validate expense amount', async () => {
      const expenseData = {
        coupleId: testData.couple.id,
        createdBy: testData.user1.id,
        title: 'Invalid Expense',
        amount: -100,
        category: 'Food'
      };

      await expect(ExpenseService.createExpense(expenseData))
        .rejects.toThrow('Amount must be positive');
    });

    it('should validate split percentages sum to 100', async () => {
      const expenseData = {
        coupleId: testData.couple.id,
        createdBy: testData.user1.id,
        title: 'Invalid Split',
        amount: 100000,
        category: 'Food',
        splitType: 'percentage',
        splitData: {
          [testData.user1.id]: 60,
          [testData.user2.id]: 50 // Total = 110%
        }
      };

      await expect(ExpenseService.createExpense(expenseData))
        .rejects.toThrow('Split percentages must sum to 100');
    });
  });

  describe('getExpensesByCouple', () => {
    it('should return expenses for couple', async () => {
      // Create test expenses
      await TestDataFactory.createExpense(testData.couple.id, testData.user1.id, {
        title: 'Expense 1'
      });
      await TestDataFactory.createExpense(testData.couple.id, testData.user1.id, {
        title: 'Expense 2'
      });

      const expenses = await ExpenseService.getExpensesByCouple(testData.couple.id);

      expect(expenses).toHaveLength(2);
      expect(expenses[0]).toHaveProperty('title');
      expect(expenses[0]).toHaveProperty('amount');
    });

    it('should return empty array for couple with no expenses', async () => {
      const expenses = await ExpenseService.getExpensesByCouple(testData.couple.id);
      expect(expenses).toHaveLength(0);
    });
  });

  describe('updateExpense', () => {
    let testExpense;

    beforeEach(async () => {
      testExpense = await TestDataFactory.createExpense(
        testData.couple.id, 
        testData.user1.id
      );
    });

    it('should update expense title', async () => {
      const updatedExpense = await ExpenseService.updateExpense(
        testExpense.id,
        { title: 'Updated Title' }
      );

      expect(updatedExpense.title).toBe('Updated Title');
    });

    it('should recalculate split when amount changes', async () => {
      const updatedExpense = await ExpenseService.updateExpense(
        testExpense.id,
        { amount: 200000 }
      );

      expect(updatedExpense.amount).toBe(200000);
      expect(updatedExpense.split_data).toEqual({
        [testData.user1.id]: 100000,
        [testData.user2.id]: 100000
      });
    });
  });

  describe('deleteExpense', () => {
    it('should delete expense', async () => {
      const testExpense = await TestDataFactory.createExpense(
        testData.couple.id, 
        testData.user1.id
      );

      await ExpenseService.deleteExpense(testExpense.id);

      const expenses = await ExpenseService.getExpensesByCouple(testData.couple.id);
      expect(expenses).toHaveLength(0);
    });

    it('should throw error when deleting non-existent expense', async () => {
      await expect(ExpenseService.deleteExpense('non-existent-id'))
        .rejects.toThrow('Expense not found');
    });
  });
});
```

---

## 2. Frontend Test Templates

### 2.1 Jest Configuration for React Native
**File**: `src/mobile/jest.config.js`

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
    '@testing-library/jest-native/extend-expect'
  ],
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/**/*.stories.{js,jsx,ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)',
  ],
  testEnvironment: 'jsdom'
};
```

### 2.2 Frontend Test Setup
**File**: `src/mobile/tests/setup.js`

```javascript
import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock navigation
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Mock API service
jest.mock('../src/services/api', () => ({
  auth: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
  },
  expenses: {
    getExpenses: jest.fn(),
    createExpense: jest.fn(),
    updateExpense: jest.fn(),
    deleteExpense: jest.fn(),
  },
  goals: {
    getGoals: jest.fn(),
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
  },
}));

// Global test utilities
global.mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
};

global.mockExpense = {
  id: 'test-expense-id',
  title: 'Test Expense',
  amount: 100000,
  category: 'Food',
  splitType: 'equal',
  createdAt: new Date().toISOString(),
};

global.mockGoal = {
  id: 'test-goal-id',
  title: 'Test Goal',
  targetAmount: 1000000,
  currentAmount: 250000,
  targetDate: '2024-12-31',
  status: 'active',
};

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
```

### 2.3 Component Test Template
**File**: `src/mobile/tests/components/ExpenseForm.test.tsx`

```typescript
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { ExpenseForm } from '@/components/expense/ExpenseForm';
import { TestWrapper } from '../utils/TestWrapper';

// Mock props
const mockProps = {
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
  initialData: null,
  loading: false,
};

describe('ExpenseForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(
      <TestWrapper>
        <ExpenseForm {...mockProps} />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Expense title')).toBeTruthy();
    expect(screen.getByPlaceholderText('Amount')).toBeTruthy();
    expect(screen.getByText('Category')).toBeTruthy();
    expect(screen.getByText('Split Type')).toBeTruthy();
    expect(screen.getByText('Save Expense')).toBeTruthy();
  });

  it('should validate required fields', async () => {
    render(
      <TestWrapper>
        <ExpenseForm {...mockProps} />
      </TestWrapper>
    );

    const saveButton = screen.getByText('Save Expense');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeTruthy();
      expect(screen.getByText('Amount is required')).toBeTruthy();
    });

    expect(mockProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should validate amount format', async () => {
    render(
      <TestWrapper>
        <ExpenseForm {...mockProps} />
      </TestWrapper>
    );

    const amountInput = screen.getByPlaceholderText('Amount');
    fireEvent.changeText(amountInput, 'invalid-amount');

    const saveButton = screen.getByText('Save Expense');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid amount')).toBeTruthy();
    });
  });

  it('should calculate equal split correctly', async () => {
    render(
      <TestWrapper>
        <ExpenseForm {...mockProps} />
      </TestWrapper>
    );

    // Fill form
    fireEvent.changeText(screen.getByPlaceholderText('Expense title'), 'Groceries');
    fireEvent.changeText(screen.getByPlaceholderText('Amount'), '200000');
    
    // Select equal split (default)
    const saveButton = screen.getByText('Save Expense');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledWith({
        title: 'Groceries',
        amount: 200000,
        category: 'Food', // default category
        splitType: 'equal',
        splitData: {
          user1: 100000,
          user2: 100000,
        },
      });
    });
  });

  it('should handle percentage split', async () => {
    render(
      <TestWrapper>
        <ExpenseForm {...mockProps} />
      </TestWrapper>
    );

    // Fill basic form
    fireEvent.changeText(screen.getByPlaceholderText('Expense title'), 'Rent');
    fireEvent.changeText(screen.getByPlaceholderText('Amount'), '3000000');
    
    // Select percentage split
    fireEvent.press(screen.getByText('Percentage'));
    
    // Set percentages
    fireEvent.changeText(screen.getByPlaceholderText('Your percentage'), '60');
    fireEvent.changeText(screen.getByPlaceholderText('Partner percentage'), '40');
    
    const saveButton = screen.getByText('Save Expense');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockProps.onSubmit).toHaveBeenCalledWith({
        title: 'Rent',
        amount: 3000000,
        category: 'Housing',
        splitType: 'percentage',
        splitData: {
          user1: 1800000, // 60%
          user2: 1200000, // 40%
        },
      });
    });
  });

  it('should validate percentage sum equals 100', async () => {
    render(
      <TestWrapper>
        <ExpenseForm {...mockProps} />
      </TestWrapper>
    );

    fireEvent.changeText(screen.getByPlaceholderText('Expense title'), 'Test');
    fireEvent.changeText(screen.getByPlaceholderText('Amount'), '100000');
    fireEvent.press(screen.getByText('Percentage'));
    
    // Invalid percentages
    fireEvent.changeText(screen.getByPlaceholderText('Your percentage'), '60');
    fireEvent.changeText(screen.getByPlaceholderText('Partner percentage'), '50');
    
    const saveButton = screen.getByText('Save Expense');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Percentages must sum to 100%')).toBeTruthy();
    });
  });

  it('should populate form with initial data', () => {
    const initialData = {
      id: 'test-id',
      title: 'Existing Expense',
      amount: 150000,
      category: 'Entertainment',
      splitType: 'custom',
    };

    render(
      <TestWrapper>
        <ExpenseForm {...mockProps} initialData={initialData} />
      </TestWrapper>
    );

    expect(screen.getByDisplayValue('Existing Expense')).toBeTruthy();
    expect(screen.getByDisplayValue('150000')).toBeTruthy();
    expect(screen.getByText('Entertainment')).toBeTruthy();
  });

  it('should show loading state', () => {
    render(
      <TestWrapper>
        <ExpenseForm {...mockProps} loading={true} />
      </TestWrapper>
    );

    expect(screen.getByText('Saving...')).toBeTruthy();
    expect(screen.getByText('Save Expense')).toBeDisabled();
  });

  it('should call onCancel when cancel button is pressed', () => {
    render(
      <TestWrapper>
        <ExpenseForm {...mockProps} />
      </TestWrapper>
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });
});
```

### 2.4 Screen Test Template
**File**: `src/mobile/tests/screens/DashboardScreen.test.tsx`

```typescript
import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { TestWrapper } from '../utils/TestWrapper';
import { api } from '@/services/api';

// Mock API responses
const mockExpenses = [
  {
    id: '1',
    title: 'Groceries',
    amount: 150000,
    category: 'Food',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Gas',
    amount: 100000,
    category: 'Transportation',
    createdAt: '2024-01-14T15:30:00Z',
  },
];

const mockGoals = [
  {
    id: '1',
    title: 'Emergency Fund',
    targetAmount: 10000000,
    currentAmount: 2500000,
    progress: 25,
  },
];

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup API mocks
    (api.expenses.getExpenses as jest.Mock).mockResolvedValue({
      data: mockExpenses,
      total: mockExpenses.length,
    });
    
    (api.goals.getGoals as jest.Mock).mockResolvedValue({
      data: mockGoals,
    });
  });

  it('should render dashboard components', async () => {
    render(
      <TestWrapper>
        <DashboardScreen />
      </TestWrapper>
    );

    // Check for main sections
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Recent Expenses')).toBeTruthy();
    expect(screen.getByText('Savings Goals')).toBeTruthy();
  });

  it('should display expense summary', async () => {
    render(
      <TestWrapper>
        <DashboardScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeTruthy();
      expect(screen.getByText('Rp 150.000')).toBeTruthy();
      expect(screen.getByText('Gas')).toBeTruthy();
      expect(screen.getByText('Rp 100.000')).toBeTruthy();
    });
  });

  it('should display goals progress', async () => {
    render(
      <TestWrapper>
        <DashboardScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Emergency Fund')).toBeTruthy();
      expect(screen.getByText('25%')).toBeTruthy();
      expect(screen.getByText('Rp 2.500.000 / Rp 10.000.000')).toBeTruthy();
    });
  });

  it('should handle loading state', () => {
    // Mock loading state
    (api.expenses.getExpenses as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <TestWrapper>
        <DashboardScreen />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should handle error state', async () => {
    // Mock API error
    (api.expenses.getExpenses as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(
      <TestWrapper>
        <DashboardScreen />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load data')).toBeTruthy();
      expect(screen.getByText('Retry')).toBeTruthy();
    });
  });

  it('should refresh data on pull to refresh', async () => {
    render(
      <TestWrapper>
        <DashboardScreen />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeTruthy();
    });

    // Simulate pull to refresh
    const scrollView = screen.getByTestId('dashboard-scroll');
    fireEvent(scrollView, 'refresh');

    // Verify API was called again
    expect(api.expenses.getExpenses).toHaveBeenCalledTimes(2);
  });
});
```

### 2.5 Test Wrapper Utility
**File**: `src/mobile/tests/utils/TestWrapper.tsx`

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock store
const mockStore = configureStore({
  reducer: {
    auth: (state = { user: global.mockUser, isAuthenticated: true }) => state,
    expenses: (state = { expenses: [], loading: false }) => state,
    goals: (state = { goals: [], loading: false }) => state,
  },
});

// Mock query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface TestWrapperProps {
  children: React.ReactNode;
  initialState?: any;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  initialState 
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={mockStore}>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </Provider>
    </QueryClientProvider>
  );
};
```

---

## 3. E2E Test Templates

### 3.1 Detox Configuration
**File**: `src/mobile/.detoxrc.js`

```javascript
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  configurations: {
    'ios.sim.debug': {
      device: {
        type: 'ios.simulator',
        device: {
          type: 'iPhone 14',
        },
      },
      app: {
        type: 'ios.app',
        binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/DanaBersama.app',
        build: 'xcodebuild -workspace ios/DanaBersama.xcworkspace -scheme DanaBersama -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      },
    },
    'android.emu.debug': {
      device: {
        type: 'android.emulator',
        device: {
          avdName: 'Pixel_4_API_30',
        },
      },
      app: {
        type: 'android.apk',
        binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
        build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      },
    },
  },
};
```

### 3.2 E2E Test Template
**File**: `e2e/expense-flow.e2e.test.js`

```javascript
describe('Expense Management Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    
    // Login
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // Wait for dashboard
    await waitFor(element(by.id('dashboard-screen')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should create a new expense with equal split', async () => {
    // Navigate to add expense
    await element(by.id('add-expense-fab')).tap();
    
    // Fill expense form
    await element(by.id('expense-title-input')).typeText('Groceries');
    await element(by.id('expense-amount-input')).typeText('200000');
    await element(by.id('expense-category-picker')).tap();
    await element(by.text('Food')).tap();
    
    // Keep equal split (default)
    await element(by.id('save-expense-button')).tap();
    
    // Verify expense appears in list
    await waitFor(element(by.text('Groceries')))
      .toBeVisible()
      .withTimeout(3000);
    
    await expect(element(by.text('Rp 200.000'))).toBeVisible();
    await expect(element(by.text('Split equally'))).toBeVisible();
  });

  it('should create expense with percentage split', async () => {
    await element(by.id('add-expense-fab')).tap();
    
    // Fill basic info
    await element(by.id('expense-title-input')).typeText('Rent');
    await element(by.id('expense-amount-input')).typeText('3000000');
    
    // Select percentage split
    await element(by.id('split-type-picker')).tap();
    await element(by.text('Percentage')).tap();
    
    // Set percentages
    await element(by.id('user-percentage-input')).typeText('60');
    await element(by.id('partner-percentage-input')).typeText('40');
    
    await element(by.id('save-expense-button')).tap();
    
    // Verify split amounts
    await waitFor(element(by.text('Rent')))
      .toBeVisible()
      .withTimeout(3000);
    
    await expect(element(by.text('Your share: Rp 1.800.000'))).toBeVisible();
    await expect(element(by.text('Partner share: Rp 1.200.000'))).toBeVisible();
  });

  it('should edit existing expense', async () => {
    // Assume expense already exists
    await element(by.text('Groceries')).tap();
    await element(by.id('edit-expense-button')).tap();
    
    // Modify title
    await element(by.id('expense-title-input')).clearText();
    await element(by.id('expense-title-input')).typeText('Weekly Groceries');
    
    await element(by.id('save-expense-button')).tap();
    
    // Verify update
    await waitFor(element(by.text('Weekly Groceries')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should delete expense', async () => {
    await element(by.text('Weekly Groceries')).tap();
    await element(by.id('delete-expense-button')).tap();
    
    // Confirm deletion
    await element(by.text('Delete')).tap();
    
    // Verify expense is removed
    await waitFor(element(by.text('Weekly Groceries')))
      .not.toBeVisible()
      .withTimeout(3000);
  });

  it('should show expense details and split breakdown', async () => {
    await element(by.text('Rent')).tap();
    
    // Verify expense details screen
    await expect(element(by.id('expense-details-screen'))).toBeVisible();
    await expect(element(by.text('Rp 3.000.000'))).toBeVisible();
    await expect(element(by.text('60% / 40% split'))).toBeVisible();
    
    // Check split breakdown
    await expect(element(by.text('Your contribution: Rp 1.800.000'))).toBeVisible();
    await expect(element(by.text('Partner contribution: Rp 1.200.000'))).toBeVisible();
  });
});
```

---

## 4. Package.json Scripts

### 4.1 Backend Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:security": "jest --testPathPattern=tests/security",
    "test:performance": "artillery run tests/performance/load-test.yml",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### 4.2 Frontend Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "detox test",
    "test:e2e:build": "detox build",
    "test:e2e:ios": "detox test --configuration ios.sim.debug",
    "test:e2e:android": "detox test --configuration android.emu.debug",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

---

**Template ini siap digunakan oleh developer untuk memulai implementasi testing yang komprehensif sesuai dengan testing strategy Dana Bersama.**