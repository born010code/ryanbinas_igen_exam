'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('money_values', [{
      treasureId: 100,
      amt: 15,
    },{
      treasureId: 101,
      amt: 10,
    },{
      treasureId: 102,
      amt: 15,
    },{
      treasureId: 103,
      amt: 15,
    },{
      treasureId: 104,
      amt: 10,
    },{
      treasureId: 105,
      amt: 15,
    },{
      treasureId: 106,
      amt: 15,
    },{
      treasureId: 107,
      amt: 10,
    },{
      treasureId: 108,
      amt: 15,
    },{
      treasureId: 109,
      amt: 15,
    },{
      treasureId: 110,
      amt: 10,
    },{
      treasureId: 111,
      amt: 15,
    },{
      treasureId: 112,
      amt: 15,
    },{
      treasureId: 113,
      amt: 10,
    },{
      treasureId: 114,
      amt: 15,
    },{
      treasureId: 115,
      amt: 15,
    },{
      treasureId: 116,
      amt: 10,
    },{
      treasureId: 117,
      amt: 15,
    },{
      treasureId: 100,
      amt: 20,
    },{
      treasureId: 101,
      amt: 25,
    },{
      treasureId: 102,
      amt: 20,
    },{
      treasureId: 103,
      amt: 25,
    },{
      treasureId: 107,
      amt: 30,
    },{
      treasureId: 108,
      amt: 30,
    },{
      treasureId: 109,
      amt: 30,
    }], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
