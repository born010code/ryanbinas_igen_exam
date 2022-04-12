'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MoneyValue extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MoneyValue.init({
    treasureId: DataTypes.INTEGER,
    amt: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'MoneyValue',
    tableName: 'money_values',
    timestamps: false
  }, { timestamps: false });
  return MoneyValue;
};