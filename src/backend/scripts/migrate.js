const { sequelize, testConnection, syncDatabase } = require('../src/models');
const logger = require('../src/utils/logger');
const fs = require('fs');
const path = require('path');

// Migration runner
const runMigrations = async () => {
  try {
    logger.info('🚀 Starting database migration...');
    
    // Test database connection first
    logger.info('📡 Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      logger.error('❌ Database connection failed. Please check your database configuration.');
      process.exit(1);
    }
    
    logger.info('✅ Database connection successful');
    
    // Check if we should force sync (drop all tables)
    const forceSync = process.argv.includes('--force');
    
    if (forceSync) {
      logger.warn('⚠️  Force sync enabled - All existing data will be lost!');
      
      // Ask for confirmation in production
      if (process.env.NODE_ENV === 'production') {
        logger.error('❌ Force sync is not allowed in production environment');
        process.exit(1);
      }
    }
    
    // Run database synchronization
    logger.info(`🔄 Synchronizing database schema${forceSync ? ' (force mode)' : ''}...`);
    const isSynced = await syncDatabase(forceSync);
    
    if (!isSynced) {
      logger.error('❌ Database synchronization failed');
      process.exit(1);
    }
    
    logger.info('✅ Database migration completed successfully');
    
    // Show table information
    await showTableInfo();
    
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Show table information
const showTableInfo = async () => {
  try {
    logger.info('📊 Database schema information:');
    
    const tables = await sequelize.getQueryInterface().showAllTables();
    logger.info(`📋 Created ${tables.length} tables:`);
    
    for (const table of tables) {
      const columns = await sequelize.getQueryInterface().describeTable(table);
      const columnCount = Object.keys(columns).length;
      logger.info(`   • ${table} (${columnCount} columns)`);
    }
    
  } catch (error) {
    logger.error('Error showing table info:', error);
  }
};

// Rollback function (for development)
const rollback = async () => {
  try {
    logger.info('🔄 Rolling back database...');
    
    if (process.env.NODE_ENV === 'production') {
      logger.error('❌ Rollback is not allowed in production environment');
      process.exit(1);
    }
    
    // Drop all tables
    await sequelize.drop();
    logger.info('✅ Database rollback completed');
    
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Rollback failed:', error);
    process.exit(1);
  }
};

// Seed database with sample data
const seedDatabase = async () => {
  try {
    logger.info('🌱 Seeding database with sample data...');
    
    // Import seed function
    const seedData = require('../src/database/seed');
    
    await seedData();
    
    logger.info('✅ Database seeding completed');
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Check database status
const checkStatus = async () => {
  try {
    logger.info('🔍 Checking database status...');
    
    const isConnected = await testConnection();
    
    if (!isConnected) {
      logger.error('❌ Database connection failed');
      process.exit(1);
    }
    
    // Check if tables exist
    const tables = await sequelize.getQueryInterface().showAllTables();
    
    if (tables.length === 0) {
      logger.warn('⚠️  No tables found. Run migration first.');
    } else {
      logger.info(`✅ Database is ready with ${tables.length} tables`);
      await showTableInfo();
    }
    
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Status check failed:', error);
    process.exit(1);
  }
};

// Main function
const main = () => {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
    case 'up':
      runMigrations();
      break;
      
    case 'rollback':
    case 'down':
      rollback();
      break;
      
    case 'seed':
      seedDatabase();
      break;
      
    case 'status':
      checkStatus();
      break;
      
    default:
      logger.info('📖 Database Migration Tool');
      logger.info('');
      logger.info('Usage: node scripts/migrate.js <command>');
      logger.info('');
      logger.info('Commands:');
      logger.info('  migrate, up     Run database migrations');
      logger.info('  rollback, down  Rollback database (development only)');
      logger.info('  seed           Seed database with sample data');
      logger.info('  status         Check database status');
      logger.info('');
      logger.info('Options:');
      logger.info('  --force        Force sync (drop all tables)');
      logger.info('');
      logger.info('Examples:');
      logger.info('  node scripts/migrate.js migrate');
      logger.info('  node scripts/migrate.js migrate --force');
      logger.info('  node scripts/migrate.js seed');
      logger.info('  node scripts/migrate.js status');
      break;
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run main function
main();