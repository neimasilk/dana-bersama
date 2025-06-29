module.exports = (sequelize, DataTypes) => {
  const Goal = sequelize.define('Goal', {
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
    couple_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'couples',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    target_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    current_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [[
          'emergency_fund',
          'vacation_travel',
          'home_purchase',
          'car_purchase',
          'wedding',
          'education',
          'retirement',
          'investment',
          'debt_payoff',
          'home_improvement',
          'healthcare',
          'business',
          'gadgets_electronics',
          'other'
        ]]
      }
    },
    target_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    priority: {
      type: DataTypes.STRING,
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high', 'urgent']]
      }
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'completed', 'paused', 'cancelled']]
      }
    },
    is_shared: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    contribution_method: {
      type: DataTypes.STRING,
      defaultValue: 'equal',
      validate: {
        isIn: [['equal', 'percentage', 'custom']]
      }
    },
    contribution_settings: {
      type: DataTypes.TEXT,
      defaultValue: '{}',
      get() {
        const value = this.getDataValue('contribution_settings');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('contribution_settings', JSON.stringify(value || {}));
      }
      // For 'percentage': { user1_percentage: 50, user2_percentage: 50 }
      // For 'custom': { user1_amount: 500000, user2_amount: 300000 }
      // For 'equal': {}
    },
    auto_contribution: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('auto_contribution');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('auto_contribution', value ? JSON.stringify(value) : null);
      }
      // Structure: { enabled: true, amount: 100000, frequency: 'monthly', next_date: '2024-02-01' }
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const value = this.getDataValue('tags');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('tags', JSON.stringify(value || []));
      }
    },
    milestones: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const value = this.getDataValue('milestones');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('milestones', JSON.stringify(value || []));
      }
      // Structure: [{ percentage: 25, amount: 2500000, achieved: false, achieved_date: null }]
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
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
    }
  }, {
    tableName: 'goals',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['couple_id']
      },
      {
        fields: ['category']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['target_date']
      },
      {
        fields: ['is_shared']
      }
    ]
  });

  // Instance methods
  Goal.prototype.getProgress = function() {
    const current = parseFloat(this.current_amount);
    const target = parseFloat(this.target_amount);
    const percentage = target > 0 ? (current / target) * 100 : 0;
    
    return {
      current_amount: current,
      target_amount: target,
      remaining_amount: Math.max(0, target - current),
      percentage: Math.min(100, percentage),
      is_completed: percentage >= 100
    };
  };

  Goal.prototype.addContribution = function(amount, userId = null) {
    const currentAmount = parseFloat(this.current_amount);
    const newAmount = currentAmount + parseFloat(amount);
    
    this.current_amount = newAmount;
    
    // Check if goal is completed
    if (newAmount >= parseFloat(this.target_amount) && this.status === 'active') {
      this.status = 'completed';
      this.completed_at = new Date();
    }
    
    // Update milestones
    this.updateMilestones();
    
    return this.getProgress();
  };

  Goal.prototype.updateMilestones = function() {
    const progress = this.getProgress();
    
    if (this.milestones && Array.isArray(this.milestones)) {
      this.milestones.forEach(milestone => {
        if (!milestone.achieved && progress.percentage >= milestone.percentage) {
          milestone.achieved = true;
          milestone.achieved_date = new Date();
        }
      });
    }
  };

  Goal.prototype.getDaysRemaining = function() {
    if (!this.target_date) return null;
    
    const today = new Date();
    const targetDate = new Date(this.target_date);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  Goal.prototype.getRequiredMonthlyContribution = function() {
    const daysRemaining = this.getDaysRemaining();
    if (!daysRemaining || daysRemaining <= 0) return null;
    
    const progress = this.getProgress();
    const monthsRemaining = daysRemaining / 30.44; // Average days per month
    
    return progress.remaining_amount / monthsRemaining;
  };

  Goal.prototype.addTag = function(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  };

  Goal.prototype.removeTag = function(tag) {
    this.tags = this.tags.filter(t => t !== tag);
  };

  Goal.prototype.pause = function() {
    this.status = 'paused';
  };

  Goal.prototype.resume = function() {
    if (this.status === 'paused') {
      this.status = 'active';
    }
  };

  Goal.prototype.cancel = function() {
    this.status = 'cancelled';
  };

  // Class methods
  Goal.getCategories = function() {
    return [
      { value: 'emergency_fund', label: 'Dana Darurat' },
      { value: 'vacation_travel', label: 'Liburan & Perjalanan' },
      { value: 'home_purchase', label: 'Pembelian Rumah' },
      { value: 'car_purchase', label: 'Pembelian Kendaraan' },
      { value: 'wedding', label: 'Pernikahan' },
      { value: 'education', label: 'Pendidikan' },
      { value: 'retirement', label: 'Pensiun' },
      { value: 'investment', label: 'Investasi' },
      { value: 'debt_payoff', label: 'Pelunasan Hutang' },
      { value: 'home_improvement', label: 'Renovasi Rumah' },
      { value: 'healthcare', label: 'Kesehatan' },
      { value: 'business', label: 'Bisnis' },
      { value: 'gadgets_electronics', label: 'Gadget & Elektronik' },
      { value: 'other', label: 'Lainnya' }
    ];
  };

  Goal.findActiveGoals = function(userId, coupleId) {
    const whereClause = {
      status: 'active'
    };

    if (coupleId) {
      whereClause.couple_id = coupleId;
    } else if (userId) {
      whereClause.user_id = userId;
    }

    return this.findAll({
      where: whereClause,
      order: [['priority', 'DESC'], ['target_date', 'ASC'], ['created_at', 'DESC']]
    });
  };

  Goal.findByCategory = function(category, userId, coupleId) {
    const whereClause = {
      category: category
    };

    if (coupleId) {
      whereClause.couple_id = coupleId;
    } else if (userId) {
      whereClause.user_id = userId;
    }

    return this.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
  };

  Goal.getGoalsSummary = function(userId, coupleId) {
    const whereClause = {};

    if (coupleId) {
      whereClause.couple_id = coupleId;
    } else if (userId) {
      whereClause.user_id = userId;
    }

    return this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('target_amount')), 'total_target'],
        [sequelize.fn('SUM', sequelize.col('current_amount')), 'total_current']
      ],
      where: whereClause,
      group: ['status']
    });
  };

  Goal.findUpcomingDeadlines = function(userId, coupleId, days = 30) {
    const whereClause = {
      status: 'active',
      target_date: {
        [sequelize.Sequelize.Op.between]: [
          new Date(),
          new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        ]
      }
    };

    if (coupleId) {
      whereClause.couple_id = coupleId;
    } else if (userId) {
      whereClause.user_id = userId;
    }

    return this.findAll({
      where: whereClause,
      order: [['target_date', 'ASC']]
    });
  };

  Goal.findNearCompletion = function(userId, coupleId, threshold = 80) {
    const whereClause = {
      status: 'active'
    };

    if (coupleId) {
      whereClause.couple_id = coupleId;
    } else if (userId) {
      whereClause.user_id = userId;
    }

    return this.findAll({
      where: {
        ...whereClause,
        [sequelize.Sequelize.Op.and]: [
          sequelize.literal(`(current_amount / target_amount * 100) >= ${threshold}`)
        ]
      },
      order: [['current_amount', 'DESC']]
    });
  };

  return Goal;
};