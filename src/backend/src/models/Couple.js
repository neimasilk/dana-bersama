module.exports = (sequelize, DataTypes) => {
  const Couple = sequelize.define('Couple', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user1_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    user2_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    couple_name: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [2, 100]
      }
    },
    relationship_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'active', 'inactive']]
      }
    },
    invitation_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    invitation_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shared_budget: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    budget_period: {
      type: DataTypes.STRING,
      defaultValue: 'monthly',
      validate: {
        isIn: [['weekly', 'monthly', 'yearly']]
      }
    },
    settings: {
      type: DataTypes.TEXT,
      defaultValue: JSON.stringify({
        expense_approval_required: false,
        expense_limit_individual: null,
        goal_contribution_method: 'equal', // equal, percentage, custom
        notifications: {
          expense_alerts: true,
          goal_reminders: true,
          budget_warnings: true
        },
        privacy: {
          share_individual_expenses: true,
          share_goals: true
        }
      }),
      get() {
        const value = this.getDataValue('settings');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('settings', JSON.stringify(value || {}));
      }
    }
  }, {
    tableName: 'couples',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user1_id', 'user2_id']
      },
      {
        fields: ['invitation_token']
      },
      {
        fields: ['status']
      }
    ],
    validate: {
      usersAreDifferent() {
        if (this.user1_id === this.user2_id) {
          throw new Error('User cannot be in a couple with themselves');
        }
      }
    }
  });

  // Instance methods
  Couple.prototype.generateInvitationToken = function() {
    const invitationToken = require('crypto').randomBytes(32).toString('hex');
    this.invitation_token = invitationToken;
    this.invitation_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return invitationToken;
  };

  Couple.prototype.isInvitationValid = function() {
    return this.invitation_token && 
           this.invitation_expires && 
           new Date() < this.invitation_expires;
  };

  Couple.prototype.acceptInvitation = function() {
    this.status = 'active';
    this.invitation_token = null;
    this.invitation_expires = null;
  };

  Couple.prototype.getPartner = function(userId) {
    return this.user1_id === userId ? this.user2_id : this.user1_id;
  };

  Couple.prototype.isMember = function(userId) {
    return this.user1_id === userId || this.user2_id === userId;
  };

  Couple.prototype.calculateBudgetUsage = async function() {
    const { Expense } = require('./index');
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const totalExpenses = await Expense.sum('amount', {
      where: {
        couple_id: this.id,
        created_at: {
          [sequelize.Sequelize.Op.gte]: currentMonth,
          [sequelize.Sequelize.Op.lt]: nextMonth
        }
      }
    });
    
    return {
      budget: parseFloat(this.shared_budget),
      used: parseFloat(totalExpenses || 0),
      remaining: parseFloat(this.shared_budget) - parseFloat(totalExpenses || 0),
      percentage: this.shared_budget > 0 ? 
        (parseFloat(totalExpenses || 0) / parseFloat(this.shared_budget)) * 100 : 0
    };
  };

  // Class methods
  Couple.findByInvitationToken = function(token) {
    return this.findOne({
      where: {
        invitation_token: token,
        invitation_expires: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      }
    });
  };

  Couple.findByUser = function(userId) {
    return this.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { user1_id: userId },
          { user2_id: userId }
        ],
        status: 'active'
      }
    });
  };

  Couple.findPendingInvitation = function(userId) {
    return this.findOne({
      where: {
        user2_id: userId,
        status: 'pending'
      }
    });
  };

  return Couple;
};