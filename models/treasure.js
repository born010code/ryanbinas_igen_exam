'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Treasure extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Treasure.hasMany(models.MoneyValue, { foreignKey:'treasureId', foreignKeyConstraint:true} );
    }
  }
  Treasure.init({
    latitude: DataTypes.FLOAT,
    longitude: DataTypes.FLOAT,
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Treasure',
  });

  return Treasure;
};