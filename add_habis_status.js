const mysql = require('mysql2/promise');
require('dotenv').config();

async function addHabisStatus() {
  let connection;
  
  try {
    // Buat koneksi ke database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'inventaris_barang'
    });
    
    console.log('Terhubung ke database MySQL');
    
    // Tambahkan status 'habis' ke enum
    const alterQuery = `
      ALTER TABLE barang 
      MODIFY COLUMN status ENUM('tersedia', 'dipinjam', 'perbaikan', 'dihapuskan', 'habis') 
      DEFAULT 'tersedia'
    `;
    
    await connection.execute(alterQuery);
    console.log('Status "habis" berhasil ditambahkan ke enum status barang');
    
    // Verifikasi perubahan
    const [rows] = await connection.execute("SHOW COLUMNS FROM barang LIKE 'status'");
    console.log('Kolom status sekarang:', rows[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Koneksi database ditutup');
    }
  }
}

addHabisStatus();