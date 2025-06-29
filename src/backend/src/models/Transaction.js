module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    goal_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'goals',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'contribution',
      validate: {
        isIn: [['contribution', 'withdrawal', 'adjustment']]
      }
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'bank_transfer',
      validate: {
        isIn: [['cash', 'debit_card', 'credit_card', 'bank_transfer', 'e_wallet', 'other']]
      }
    },
    reference_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'completed',
      validate: {
        isIn: [['pending', 'completed', 'failed', 'cancelled']]
      }
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_automatic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recurring_id: {
      type: DataTypes.UUID,
      allowNull: true
      // Reference to recurring transaction setup
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.TEXT,
      defaultValue: '{}',
      get() {
        const value = this.getDataValue('metadata');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('metadata', JSON.stringify(value || {}));
      }
      // Can store additional info like bank details, receipt URLs, etc.
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['goal_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['transaction_date']
      },
      {
        fields: ['is_automatic']
      },
      {
        fields: ['recurring_id']
      },
      {
        fields: ['reference_number']
      }
    ]
  });

  // Instance methods
  Transaction.prototype.markAsCompleted = function() {
    this.status = 'completed';
    this.processed_at = new Date();
  };

  Transaction.prototype.markAsFailed = function(reason = null) {
    this.status = 'failed';
    this.processed_at = new Date();
    if (reason) {
      this.metadata = {
        ...this.metadata,
        failure_reason: reason
      };
    }
  };

  Transaction.prototype.cancel = function(reason = null) {
    this.status = 'cancelled';
    this.processed_at = new Date();
    if (reason) {
      this.metadata = {
        ...this.metadata,
        cancellation_reason: reason
      };
    }
  };

  Transaction.prototype.getFormattedAmount = function() {
    const amount = parseFloat(this.amount);
    const sign = this.type === 'withdrawal' ? '-' : '+';
    return `${sign}${amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`;
  };

  Transaction.prototype.isReversible = function() {
    // Transactions can be reversed within 24 hours if completed
    if (this.status !== 'completed') return false;
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.processed_at > twentyFourHoursAgo;
  };

  // Class methods
  Transaction.findByGoal = function(goalId, options = {}) {
    const whereClause = { goal_id: goalId };
    
    if (options.type) {
      whereClause.type = options.type;
    }
    
    if (options.status) {
      whereClause.status = options.status;
    }
    
    if (options.userId) {
      whereClause.user_id = options.userId;
    }
    
    return this.findAll({
      where: whereClause,
      order: [['transaction_date', 'DESC']],
      limit: options.limit || null,
      offset: options.offset || 0
    });
  };

  Transaction.findByUser = function(userId, options = {}) {
    const whereClause = { user_id: userId };
    
    if (options.type) {
      whereClause.type = options.type;
    }
    
    if (options.status) {
      whereClause.status = options.status;
    }
    
    if (options.startDate && options.endDate) {
      whereClause.transaction_date = {
        [sequelize.Sequelize.Op.between]: [options.startDate, options.endDate]
      };
    }
    
    return this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.Goal,
          as: 'goal',
          attributes: ['id', 'title', 'category']
        }
      ],
      order: [['transaction_date', 'DESC']],
      limit: options.limit || null,
      offset: options.offset || 0
    });
  };

  Transaction.getMonthlyContributions = function(userId, goalId = null, months = 12) {
    const whereClause = {
      user_id: userId,
      type: 'contribution',
      status: 'completed',
      transaction_date: {
        [sequelize.Sequelize.Op.gte]: sequelize.literal(`DATE_TRUNC('month', NOW()) - INTERVAL '${months - 1} months'`)
      }
    };
    
    if (goalId) {
      whereClause.goal_id = goalId;
    }
    
    return this.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('transaction_date')), 'month'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('transaction_date'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('transaction_date')), 'ASC']]
    });
  };

  Transaction.getTotalContributions = function(userId, goalId = null, startDate = null, endDate = null) {
    const whereClause = {
      user_id: userId,
      type: 'contribution',
      status: 'completed'
    };
    
    if (goalId) {
      whereClause.goal_id = goalId;
    }
    
    if (startDate && endDate) {
      whereClause.transaction_date = {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      };
    }
    
    return this.sum('amount', { where: whereClause });
  };

  Transaction.findPendingTransactions = function(userId = null) {
    const whereClause = {
      status: 'pending'
    };
    
    if (userId) {
      whereClause.user_id = userId;
    }
    
    return this.findAll({
      where: whereClause,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: sequelize.models.Goal,
          as: 'goal',
          attributes: ['id', 'title', 'category']
        }
      ],
      order: [['transaction_date', 'ASC']]
    });
  };

  Transaction.findByReferenceNumber = function(referenceNumber) {
    return this.findOne({
      where: { reference_number: referenceNumber }
    });
  };

  Transaction.getTransactionStats = function(userId, startDate, endDate) {
    const whereClause = {
      user_id: userId,
      status: 'completed',
      transaction_date: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    };
    
    return this.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'average']
      ],
      where: whereClause,
      group: ['type']
    });
  };

  Transaction.findRecurringTransactions = function(recurringId) {
    return this.findAll({
      where: {
        recurring_id: recurringId
      },
      order: [['transaction_date', 'DESC']]
    });
  };

  return Transaction;
};