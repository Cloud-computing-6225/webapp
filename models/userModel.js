// models/user.js
const { DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Automatically generates a UUIDV4
      allowNull: false,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
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
          // user.account_updated = new Date();
        }
      },
    },
  }
);

module.exports = User;
