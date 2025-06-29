const request = require('supertest');
const app = require('../../../src/app');
const { User, Goal, Couple } = require('../../../src/models');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../../../src/models');

describe('Goal Controller', () => {
  let authToken;
  let testUser;
  let testGoal;
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

    // Create test goal
    testGoal = await Goal.create({
      user_id: testUser.id,
      couple_id: testCouple.id,
      title: 'Test Goal',
      description: 'Test goal description',
      target_amount: 1000.00,
      current_amount: 250.00,
      category: 'emergency_fund',
      target_date: '2025-12-31',
      priority: 'high',
      is_shared: false
    });
  });

  afterEach(async () => {
    // Clean up test data
    await Goal.destroy({ where: {} });
    await Couple.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/goals', () => {
    it('should get all goals for authenticated user', async () => {
      const response = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.goals).toHaveLength(1);
      expect(response.body.data.goals[0].title).toBe('Test Goal');
      expect(response.body.data.goals[0]).toHaveProperty('progress_percentage');
      expect(response.body.data.goals[0]).toHaveProperty('remaining_amount');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/goals');

      expect(response.status).toBe(401);
    });

    it('should filter goals by category', async () => {
      const response = await request(app)
        .get('/api/goals?category=emergency_fund')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.goals).toHaveLength(1);
    });

    it('should filter goals by status', async () => {
      const response = await request(app)
        .get('/api/goals?status=active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.goals).toHaveLength(1);
    });

    it('should paginate goals', async () => {
      const response = await request(app)
        .get('/api/goals?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.current_page).toBe(1);
      expect(response.body.data.pagination.items_per_page).toBe(5);
    });
  });

  describe('POST /api/goals', () => {
    it('should create a new goal', async () => {
      const goalData = {
        title: 'New Test Goal',
        description: 'New test goal description',
        target_amount: 5000,
        current_amount: 0,
        category: 'vacation_travel',
        target_date: '2025-06-15',
        priority: 'medium',
        is_shared: false
      };

      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(goalData.title);
      expect(response.body.data.target_amount).toBe(goalData.target_amount.toString());
      expect(response.body.data).toHaveProperty('progress_percentage');
    });

    it('should create a shared goal', async () => {
      const goalData = {
        title: 'Shared Goal',
        target_amount: 10000,
        category: 'home_purchase',
        is_shared: true,
        contribution_method: 'percentage',
        contribution_settings: {
          user1_percentage: 60,
          user2_percentage: 40
        }
      };

      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData);

      expect(response.status).toBe(201);
      expect(response.body.data.is_shared).toBe(true);
      expect(response.body.data.contribution_method).toBe('percentage');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        title: 'A', // Too short
        target_amount: -100, // Negative amount
        category: 'invalid_category'
      };

      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for past target date', async () => {
      const goalData = {
        title: 'Test Goal',
        target_amount: 1000,
        category: 'emergency_fund',
        target_date: '2020-01-01' // Past date
      };

      const response = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send(goalData);

      expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const goalData = {
        title: 'Test Goal',
        target_amount: 1000,
        category: 'emergency_fund'
      };

      const response = await request(app)
        .post('/api/goals')
        .send(goalData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/goals/:id', () => {
    it('should get goal by ID', async () => {
      const response = await request(app)
        .get(`/api/goals/${testGoal.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testGoal.id);
      expect(response.body.data.title).toBe('Test Goal');
      expect(response.body.data).toHaveProperty('progress_percentage');
      expect(response.body.data).toHaveProperty('remaining_amount');
    });

    it('should return 404 for non-existent goal', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/goals/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/goals/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/goals/:id', () => {
    it('should update goal', async () => {
      const updateData = {
        title: 'Updated Goal',
        target_amount: 2000,
        priority: 'urgent'
      };

      const response = await request(app)
        .put(`/api/goals/${testGoal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.target_amount).toBe(updateData.target_amount.toString());
      expect(response.body.data.priority).toBe(updateData.priority);
    });

    it('should return 404 for non-existent goal', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .put(`/api/goals/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        target_amount: -50
      };

      const response = await request(app)
        .put(`/api/goals/${testGoal.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/goals/:id', () => {
    it('should delete goal', async () => {
      const response = await request(app)
        .delete(`/api/goals/${testGoal.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify goal is deleted
      const deletedGoal = await Goal.findByPk(testGoal.id);
      expect(deletedGoal).toBeNull();
    });

    it('should return 404 for non-existent goal', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .delete(`/api/goals/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/goals/:id/contribute', () => {
    it('should add contribution to goal', async () => {
      const contributionData = {
        amount: 100,
        note: 'Monthly contribution'
      };

      const response = await request(app)
        .post(`/api/goals/${testGoal.id}/contribute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(contributionData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(parseFloat(response.body.data.current_amount)).toBe(350); // 250 + 100
    });

    it('should complete goal when target is reached', async () => {
      const contributionData = {
        amount: 750 // This will make total 1000, reaching the target
      };

      const response = await request(app)
        .post(`/api/goals/${testGoal.id}/contribute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(contributionData);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.message).toContain('Goal completed');
    });

    it('should return 400 for invalid contribution amount', async () => {
      const invalidData = {
        amount: -50
      };

      const response = await request(app)
        .post(`/api/goals/${testGoal.id}/contribute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent goal', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .post(`/api/goals/${fakeId}/contribute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 100 });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/goals/categories', () => {
    it('should get goal categories', async () => {
      const response = await request(app)
        .get('/api/goals/categories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('value');
      expect(response.body.data[0]).toHaveProperty('label');
      expect(response.body.data[0]).toHaveProperty('icon');
    });
  });

  describe('GET /api/goals/stats', () => {
    it('should get goal statistics', async () => {
      const response = await request(app)
        .get('/api/goals/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('category_breakdown');
      expect(response.body.data).toHaveProperty('priority_breakdown');
      expect(response.body.data.summary).toHaveProperty('total_goals');
      expect(response.body.data.summary).toHaveProperty('active_goals');
      expect(response.body.data.summary).toHaveProperty('completed_goals');
      expect(response.body.data.summary).toHaveProperty('overall_progress');
    });
  });
});