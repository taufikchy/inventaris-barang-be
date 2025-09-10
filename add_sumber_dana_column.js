const mysql = require('mysql2/promise');
require('dotenv').config();

async function addSumberDanaColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventaris_barang'
  });

  try {
    console.log('Menambahkan kolom sumber_dana ke tabel barang...');
    
    // Cek apakah kolom sudah ada
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM barang LIKE 'sumber_dana'"
    );
    
    if (columns.length > 0) {
      console.log('Kolom sumber_dana sudah ada di tabel barang.');
    } else {
      // Tambahkan kolom sumber_dana
      await connection.execute(
        "ALTER TABLE barang ADD COLUMN sumber_dana VARCHAR(255) NULL COMMENT 'Sumber dana barang (contoh: BOS, BOP, dll)'"
      );
      console.log('Kolom sumber_dana berhasil ditambahkan ke tabel barang.');
    }
    
    // Verifikasi struktur tabel
    const [structure] = await connection.execute('DESCRIBE barang');
    console.log('\nStruktur tabel barang:');
    structure.forEach(col => {
      if (col.Field === 'sumber_dana') {
        console.log(`✓ ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

addSumberDanaColumn();