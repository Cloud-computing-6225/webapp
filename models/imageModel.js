const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Image = sequelize.define(
  "Image",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null values
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null values
    },
    upload_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = Image;
