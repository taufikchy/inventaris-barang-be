'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('peminjaman', 'kode_peminjaman', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      comment: 'Kode unik peminjaman (contoh: PJM-001)'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('peminjaman', 'kode_peminjaman');
  }
};
