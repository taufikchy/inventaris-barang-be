const { Sequelize } = require('sequelize');
require('dotenv').config();

// Konfigurasi koneksi database
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true, // Aktifkan timestamp (createdAt, updatedAt)
    underscored: false // Nonaktifkan underscored untuk menggunakan format camelCase
  },
  dialectOptions: {
    // Mengatasi masalah dengan nilai datetime '0000-00-00 00:00:00'
    dateStrings: true,
    typeCast: true
  },
  timezone: '+07:00' // Sesuaikan dengan timezone Indonesia
});

module.exports = sequelize;