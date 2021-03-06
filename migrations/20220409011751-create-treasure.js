'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('treasures', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      latitude: {
        type: Sequelize.FLOAT
      },
      longitude: {
        type: Sequelize.FLOAT
      },
      name: {
        type: Sequelize.STRING
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Treasures');
  }
};