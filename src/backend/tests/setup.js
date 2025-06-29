// Set test environment first
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';

const { sequelize, User, Couple, Expense, Goal, Transaction } = require('../src/models');
const logger = require('../src/utils/logger');

// Setup before all tests
beforeAll(async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('✅ Test database connection established');
    
    // Sync database (create tables)
    await sequelize.sync({ force: true });
    logger.info('✅ Test database synchronized');
  } catch (error) {
    logger.error('❌ Test database setup failed:', error);
    throw error;
  }
});

// Cleanup after each test
afterEach(async () => {
  try {
    // Clear all tables but keep structure
    await Transaction.destroy({ where: {}, force: true });
    await Goal.destroy({ where: {}, force: true });
    await Expense.destroy({ where: {}, force: true });
    await Couple.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
  } catch (error) {
    logger.error('❌ Test cleanup failed:', error);
  }
});

// Cleanup after all tests
afterAll(async () => {
  try {
    await sequelize.close();
    logger.info('✅ Test database connection closed');
  } catch (error) {
    logger.error('❌ Test database cleanup failed:', error);
  }
});

// Export test utilities
global.testDb = sequelize;
global.testModels = {
  User,
  Couple,
  Expense,
  Goal,
  Transaction
};