const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [10, 15]
      }
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    profile_picture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verification_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reset_password_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive', 'suspended']]
      }
    },
    preferences: {
      type: DataTypes.TEXT,
      defaultValue: JSON.stringify({
        currency: 'IDR',
        language: 'id',
        notifications: {
          email: true,
          push: true,
          expense_alerts: true,
          goal_reminders: true
        }
      }),
      get() {
        const value = this.getDataValue('preferences');
        return value ? JSON.parse(value) : {};
      },
      set(value) {
        this.setDataValue('preferences', JSON.stringify(value || {}));
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  User.prototype.generateAuthToken = function() {
    const payload = {
      id: this.id,
      email: this.email,
      full_name: this.full_name
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  };

  User.prototype.generateRefreshToken = function() {
    const payload = {
      id: this.id,
      type: 'refresh'
    };
    
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
  };

  User.prototype.generateResetToken = function() {
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    this.reset_password_token = require('crypto')
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    this.reset_password_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.verification_token;
    delete values.reset_password_token;
    delete values.reset_password_expires;
    
    // Add backward compatibility for old field names
    if (values.full_name) {
      const nameParts = values.full_name.split(' ');
      values.firstName = nameParts[0] || '';
      values.lastName = nameParts.slice(1).join(' ') || '';
    }
    if (values.phone) {
      values.phoneNumber = values.phone;
    }
    
    return values;
  };

  // Class methods
  User.findByEmail = function(email) {
    return this.findOne({ where: { email } });
  };

  User.findByResetToken = function(token) {
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    return this.findOne({
      where: {
        reset_password_token: hashedToken,
        reset_password_expires: {
          [sequelize.Sequelize.Op.gt]: Date.now()
        }
      }
    });
  };

  return User;
};