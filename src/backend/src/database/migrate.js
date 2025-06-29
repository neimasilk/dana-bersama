const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

// SQL migrations
const migrations = [
  {
    name: '001_create_users_table',
    sql: `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `
  },
  {
    name: '002_create_couples_table',
    sql: `
      CREATE TABLE IF NOT EXISTS couples (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
        user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user1_id, user2_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_couples_user1 ON couples(user1_id);
      CREATE INDEX IF NOT EXISTS idx_couples_user2 ON couples(user2_id);
      CREATE INDEX IF NOT EXISTS idx_couples_status ON couples(status);
    `
  },
  {
    name: '003_create_expenses_table',
    sql: `
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
        created_by UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
        category VARCHAR(100) DEFAULT 'Other',
        description TEXT,
        expense_date DATE NOT NULL,
        split_type VARCHAR(20) DEFAULT 'equal' CHECK (split_type IN ('equal', 'percentage', 'custom')),
        split_data JSONB,
        receipt_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_expenses_couple ON expenses(couple_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    `
  },
  {
    name: '004_create_goals_table',
    sql: `
      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
        current_amount DECIMAL(12,2) DEFAULT 0 CHECK (current_amount >= 0),
        target_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_goals_couple ON goals(couple_id);
      CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
      CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
    `
  },
  {
    name: '005_create_transactions_table',
    sql: `
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(12,2) NOT NULL CHECK (amount != 0),
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('contribution', 'withdrawal')),
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_transactions_goal ON transactions(goal_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(created_at);
    `
  },
  {
    name: '006_create_migrations_table',
    sql: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `
  }
];

// Function to check if migration has been executed
const isMigrationExecuted = async (migrationName) => {
  try {
    const [results] = await sequelize.query(
      'SELECT name FROM migrations WHERE name = ?',
      {
        replacements: [migrationName],
        type: sequelize.QueryTypes.SELECT
      }
    );
    return results.length > 0;
  } catch (error) {
    // If migrations table doesn't exist, migration hasn't been executed
    return false;
  }
};

// Function to mark migration as executed
const markMigrationExecuted = async (migrationName) => {
  await sequelize.query(
    'INSERT INTO migrations (name) VALUES (?) ON CONFLICT (name) DO NOTHING',
    {
      replacements: [migrationName]
    }
  );
};

// Main migration function
const runMigrations = async () => {
  try {
    logger.info('🔄 Starting database migrations...');
    
    // Test database connection first
    await sequelize.authenticate();
    logger.info('✅ Database connection established');
    
    // Run migrations in order
    for (const migration of migrations) {
      const isExecuted = await isMigrationExecuted(migration.name);
      
      if (!isExecuted) {
        logger.info(`🔄 Running migration: ${migration.name}`);
        await sequelize.query(migration.sql);
        await markMigrationExecuted(migration.name);
        logger.info(`✅ Migration completed: ${migration.name}`);
      } else {
        logger.info(`⏭️  Migration already executed: ${migration.name}`);
      }
    }
    
    logger.info('🎉 All migrations completed successfully!');
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('✅ Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runMigrations,
  migrations
};