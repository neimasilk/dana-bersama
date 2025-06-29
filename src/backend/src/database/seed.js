const bcrypt = require('bcryptjs');
const { User } = require('../models');
const logger = require('../utils/logger');

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function runSeeds() {
  try {
    logger.info('🌱 Starting database seeding...');
    logger.info('🌱 Creating test user...');
    
    const hashedPassword = await hashPassword('password123');
    
    const user = await User.create({
      email: 'test@example.com',
      password: hashedPassword,
      full_name: 'Test User'
    });
    
    logger.info(`✅ Test user created successfully with ID: ${user.id}`);
    logger.info('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    logger.error('❌ Error during seeding:', error.message);
    logger.error('❌ Full error:', error);
    throw error;
  }
}

module.exports = runSeeds;

if (require.main === module) {
  runSeeds().then(() => {
    console.log('Seeding completed');
    process.exit(0);
  }).catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}