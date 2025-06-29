module.exports = (sequelize, DataTypes) => {
  const Expense = sequelize.define('Expense', {
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
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [[
          'food_dining',
          'transportation',
          'shopping',
          'entertainment',
          'bills_utilities',
          'healthcare',
          'education',
          'travel',
          'groceries',
          'personal_care',
          'gifts_donations',
          'home_garden',
          'sports_fitness',
          'technology',
          'insurance',
          'investments',
          'other'
        ]]
      }
    },
    expense_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'cash',
      validate: {
        isIn: [['cash', 'debit_card', 'credit_card', 'bank_transfer', 'e_wallet', 'other']]
      }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    receipt_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_shared: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    shared_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
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
    recurring: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('recurring');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('recurring', value ? JSON.stringify(value) : null);
      }
      // Structure: { type: 'weekly|monthly|yearly', interval: 1, end_date: '2024-12-31' }
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'approved',
      validate: {
        isIn: [['pending', 'approved', 'rejected']]
      }
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_at: {
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
    tableName: 'expenses',
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
        fields: ['expense_date']
      },
      {
        fields: ['is_shared']
      },
      {
        fields: ['status']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // Instance methods
  Expense.prototype.calculateSharedAmount = function() {
    if (!this.is_shared || !this.shared_percentage) {
      return 0;
    }
    return (parseFloat(this.amount) * parseFloat(this.shared_percentage)) / 100;
  };

  Expense.prototype.getPersonalAmount = function() {
    if (!this.is_shared || !this.shared_percentage) {
      return parseFloat(this.amount);
    }
    return parseFloat(this.amount) - this.calculateSharedAmount();
  };

  Expense.prototype.approve = function(approvedBy) {
    this.status = 'approved';
    this.approved_by = approvedBy;
    this.approved_at = new Date();
  };

  Expense.prototype.reject = function() {
    this.status = 'rejected';
    this.approved_by = null;
    this.approved_at = null;
  };

  Expense.prototype.addTag = function(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  };

  Expense.prototype.removeTag = function(tag) {
    this.tags = this.tags.filter(t => t !== tag);
  };

  // Class methods
  Expense.getCategories = function() {
    return [
      { value: 'food_dining', label: 'Makanan & Restoran' },
      { value: 'transportation', label: 'Transportasi' },
      { value: 'shopping', label: 'Belanja' },
      { value: 'entertainment', label: 'Hiburan' },
      { value: 'bills_utilities', label: 'Tagihan & Utilitas' },
      { value: 'healthcare', label: 'Kesehatan' },
      { value: 'education', label: 'Pendidikan' },
      { value: 'travel', label: 'Perjalanan' },
      { value: 'groceries', label: 'Belanja Harian' },
      { value: 'personal_care', label: 'Perawatan Pribadi' },
      { value: 'gifts_donations', label: 'Hadiah & Donasi' },
      { value: 'home_garden', label: 'Rumah & Taman' },
      { value: 'sports_fitness', label: 'Olahraga & Fitness' },
      { value: 'technology', label: 'Teknologi' },
      { value: 'insurance', label: 'Asuransi' },
      { value: 'investments', label: 'Investasi' },
      { value: 'other', label: 'Lainnya' }
    ];
  };

  Expense.findByDateRange = function(startDate, endDate, options = {}) {
    const whereClause = {
      expense_date: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    };

    if (options.userId) {
      whereClause.user_id = options.userId;
    }

    if (options.coupleId) {
      whereClause.couple_id = options.coupleId;
    }

    if (options.category) {
      whereClause.category = options.category;
    }

    if (options.isShared !== undefined) {
      whereClause.is_shared = options.isShared;
    }

    return this.findAll({
      where: whereClause,
      order: [['expense_date', 'DESC'], ['created_at', 'DESC']],
      ...options
    });
  };

  Expense.getTotalByCategory = function(userId, coupleId, startDate, endDate) {
    const whereClause = {
      expense_date: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    };

    if (coupleId) {
      whereClause.couple_id = coupleId;
    } else if (userId) {
      whereClause.user_id = userId;
    }

    return this.findAll({
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['category'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']]
    });
  };

  Expense.getMonthlyTrend = function(userId, coupleId, months = 6) {
    const whereClause = {};

    if (coupleId) {
      whereClause.couple_id = coupleId;
    } else if (userId) {
      whereClause.user_id = userId;
    }

    return this.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('expense_date')), 'month'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        ...whereClause,
        expense_date: {
          [sequelize.Sequelize.Op.gte]: sequelize.literal(`DATE_TRUNC('month', NOW()) - INTERVAL '${months - 1} months'`)
        }
      },
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('expense_date'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('expense_date')), 'ASC']]
    });
  };

  return Expense;
};