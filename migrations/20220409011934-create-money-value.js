'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('money_values', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      treasureId: {
        type: Sequelize.INTEGER
      },
      amt: {
        type: Sequelize.INTEGER
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('MoneyValues');
  }
};