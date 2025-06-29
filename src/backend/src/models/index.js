const { Sequelize } = require('sequelize');
const config = require('../config/database');
const logger = require('../utils/logger');

// Initialize Sequelize
let sequelize;
if (config.dialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: config.dialect,
    storage: config.storage,
    logging: config.logging ? logger.info : false,
    pool: config.pool,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: config.logging ? logger.info : false,
      pool: config.pool,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    }
  );
}

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Couple = require('./Couple')(sequelize, Sequelize.DataTypes);
const Expense = require('./Expense')(sequelize, Sequelize.DataTypes);
const Goal = require('./Goal')(sequelize, Sequelize.DataTypes);
const Transaction = require('./Transaction')(sequelize, Sequelize.DataTypes);

// Define associations
User.hasOne(Couple, { foreignKey: 'user1_id', as: 'coupleAsUser1' });
User.hasOne(Couple, { foreignKey: 'user2_id', as: 'coupleAsUser2' });
Couple.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' });
Couple.belongsTo(User, { foreignKey: 'user2_id', as: 'user2' });

User.hasMany(Expense, { foreignKey: 'user_id', as: 'expenses' });
Expense.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Couple.hasMany(Expense, { foreignKey: 'couple_id', as: 'expenses' });
Expense.belongsTo(Couple, { foreignKey: 'couple_id', as: 'couple' });

User.hasMany(Goal, { foreignKey: 'user_id', as: 'goals' });
Goal.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Couple.hasMany(Goal, { foreignKey: 'couple_id', as: 'goals' });
Goal.belongsTo(Couple, { foreignKey: 'couple_id', as: 'couple' });

User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Goal.hasMany(Transaction, { foreignKey: 'goal_id', as: 'transactions' });
Transaction.belongsTo(Goal, { foreignKey: 'goal_id', as: 'goal' });

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to database:', error);
    return false;
  }
};

// Sync database (for development)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    logger.info('✅ Database synchronized successfully');
    return true;
  } catch (error) {
    logger.error('❌ Database synchronization failed:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  Sequelize,
  User,
  Couple,
  Expense,
  Goal,
  Transaction,
  testConnection,
  syncDatabase
};