const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      // Write-only: Do not expose password in responses
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Default: not verified
      allowNull: false,
    },
    email_verification_token: {
      type: DataTypes.STRING, // Store the generated token
      allowNull: true, // Initially null
    },
    email_verification_expiry: {
      type: DataTypes.DATE, // Store the token's expiration timestamp
      allowNull: true, // Initially null
    },
    account_created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    account_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        const saltRounds = 10;
        const hash = await bcrypt.hash(user.password, saltRounds);
        user.password = hash;
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const saltRounds = 10;
          const hash = await bcrypt.hash(user.password, saltRounds);
          user.password = hash;
        }
      },
    },
  }
);

module.exports = User;
