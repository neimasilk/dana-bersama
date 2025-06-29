const request = require('supertest');
const app = require('../../../src/app');
const { User, Expense, Couple } = require('../../../src/models');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../../../src/models');

describe('Expense Controller', () => {
  let authToken;
  let testUser;
  let testExpense;
  let testCouple;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123',
      phone_number: '+1234567890',
      date_of_birth: '1990-01-01',
      gender: 'male'
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test couple
    const secondUser = await User.create({
      full_name: 'Partner User',
      email: 'partner@example.com',
      password: 'hashedpassword123',
      phone_number: '+1234567891',
      date_of_birth: '1992-01-01',
      gender: 'female'
    });

    testCouple = await Couple.create({
      user1_id: testUser.id,
      user2_id: secondUser.id,
      relationship_start_date: '2023-01-01',
      status: 'active'
    });

    // Create test expense
    testExpense = await Expense.create({
      user_id: testUser.id,
      couple_id: testCouple.id,
      title: 'Test Expense',
      description: 'Test expense description',
      amount: 100.50,
      category: 'food_dining',
      expense_date: new Date(),
      payment_method: 'cash',
      is_shared: false
    });
  });

  afterEach(async () => {
    // Clean up test data
    await Expense.destroy({ where: {} });
    await Couple.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/expenses', () => {
    it('should get all expenses for authenticated user', async () => {
      const response = await request(app)
        .get('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.expenses).toHaveLength(1);
      expect(response.body.data.expenses[0].title).toBe('Test Expense');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/expenses');

      expect(response.status).toBe(401);
    });

    it('should filter expenses by category', async () => {
      const response = await request(app)
        .get('/api/expenses?category=food_dining')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.expenses).toHaveLength(1);
    });

    it('should paginate expenses', async () => {
      const response = await request(app)
        .get('/api/expenses?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.current_page).toBe(1);
      expect(response.body.data.pagination.items_per_page).toBe(5);
    });
  });

  describe('POST /api/expenses', () => {
    it('should create a new expense', async () => {
      const expenseData = {
        title: 'New Test Expense',
        description: 'New test expense description',
        amount: 75.25,
        category: 'transportation',
        expense_date: '2024-01-15',
        payment_method: 'credit_card',
        location: 'Test Location',
        is_shared: false
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(expenseData.title);
      expect(response.body.data.amount).toBe(expenseData.amount.toString());
    });

    it('should create a shared expense', async () => {
      const expenseData = {
        title: 'Shared Expense',
        amount: 200,
        category: 'food_dining',
        is_shared: true,
        shared_percentage: 60
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData);

      expect(response.status).toBe(201);
      expect(response.body.data.is_shared).toBe(true);
      expect(response.body.data.shared_percentage).toBe(60);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        title: 'A', // Too short
        amount: -10, // Negative amount
        category: 'invalid_category'
      };

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const expenseData = {
        title: 'Test Expense',
        amount: 50,
        category: 'food_dining'
      };

      const response = await request(app)
        .post('/api/expenses')
        .send(expenseData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/expenses/:id', () => {
    it('should get expense by ID', async () => {
      const response = await request(app)
        .get(`/api/expenses/${testExpense.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testExpense.id);
      expect(response.body.data.title).toBe('Test Expense');
    });

    it('should return 404 for non-existent expense', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/expenses/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/expenses/:id', () => {
    it('should update expense', async () => {
      const updateData = {
        title: 'Updated Expense',
        amount: 150.75,
        category: 'entertainment'
      };

      const response = await request(app)
        .put(`/api/expenses/${testExpense.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.amount).toBe(updateData.amount.toString());
    });

    it('should return 404 for non-existent expense', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .put(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        amount: -50
      };

      const response = await request(app)
        .put(`/api/expenses/${testExpense.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    it('should delete expense', async () => {
      const response = await request(app)
        .delete(`/api/expenses/${testExpense.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify expense is deleted
      const deletedExpense = await Expense.findByPk(testExpense.id);
      expect(deletedExpense).toBeNull();
    });

    it('should return 404 for non-existent expense', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .delete(`/api/expenses/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/expenses/categories', () => {
    it('should get expense categories', async () => {
      const response = await request(app)
        .get('/api/expenses/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('value');
      expect(response.body.data[0]).toHaveProperty('label');
      expect(response.body.data[0]).toHaveProperty('icon');
    });
  });

  describe('GET /api/expenses/stats', () => {
    it('should get expense statistics', async () => {
      const response = await request(app)
        .get('/api/expenses/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('category_breakdown');
      expect(response.body.data.summary).toHaveProperty('total_amount');
      expect(response.body.data.summary).toHaveProperty('total_expenses');
    });

    it('should get weekly statistics', async () => {
      const response = await request(app)
        .get('/api/expenses/stats?period=week')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.period).toBe('week');
    });

    it('should return 400 for invalid period', async () => {
      const response = await request(app)
        .get('/api/expenses/stats?period=invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });
});