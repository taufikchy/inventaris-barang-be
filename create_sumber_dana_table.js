const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSumberDanaTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'inventaris_barang'
  });

  try {
    console.log('Membuat tabel sumber_dana...');
    
    // Buat tabel sumber_dana
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sumber_dana (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL UNIQUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Tabel sumber_dana berhasil dibuat.');
    
    // Insert data default
    const defaultSumberDana = [
      'BOS (Bantuan Operasional Sekolah)',
      'BOP (Bantuan Operasional Pendidikan)',
      'APBD (Anggaran Pendapatan dan Belanja Daerah)',
      'APBN (Anggaran Pendapatan dan Belanja Negara)',
      'Hibah',
      'Swadaya Sekolah'
    ];
    
    for (const nama of defaultSumberDana) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO sumber_dana (nama) VALUES (?)',
          [nama]
        );
      } catch (err) {
        // Ignore duplicate entries
      }
    }
    
    console.log('Data default sumber dana berhasil ditambahkan.');
    
    // Update tabel barang untuk menggunakan foreign key
    console.log('Mengupdate tabel barang...');
    
    // Cek apakah kolom id_sumber_dana sudah ada
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM barang LIKE 'id_sumber_dana'"
    );
    
    if (columns.length === 0) {
      // Tambahkan kolom id_sumber_dana
      await connection.execute(
        'ALTER TABLE barang ADD COLUMN id_sumber_dana INT NULL'
      );
      
      // Tambahkan foreign key constraint
      await connection.execute(`
        ALTER TABLE barang 
        ADD CONSTRAINT fk_barang_sumber_dana 
        FOREIGN KEY (id_sumber_dana) REFERENCES sumber_dana(id)
      `);
      
      console.log('Kolom id_sumber_dana berhasil ditambahkan ke tabel barang.');
    } else {
      console.log('Kolom id_sumber_dana sudah ada di tabel barang.');
    }
    
    // Tampilkan struktur tabel
    const [sumberDanaData] = await connection.execute('SELECT * FROM sumber_dana');
    console.log('\nData sumber dana:');
    sumberDanaData.forEach(item => {
      console.log(`- ${item.id}: ${item.nama}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

createSumberDanaTable();