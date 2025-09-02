const sequelize = require('./src/config/basisdata');

async function addTipeKategori() {
  try {
    console.log('Menambahkan kolom tipe pada tabel kategori...');
    
    // Tambahkan kolom tipe
    await sequelize.query(`
      ALTER TABLE kategori 
      ADD COLUMN tipe ENUM('alat', 'bahan') NOT NULL DEFAULT 'alat' 
      AFTER deskripsi
    `);
    
    console.log('Kolom tipe berhasil ditambahkan.');
    
    // Update kategori yang sudah ada berdasarkan nama
    console.log('Mengupdate kategori yang kemungkinan bahan...');
    
    await sequelize.query(`
      UPDATE kategori SET tipe = 'bahan' 
      WHERE nama LIKE '%bahan%' 
         OR nama LIKE '%material%' 
         OR nama LIKE '%consumable%'
         OR nama LIKE '%habis pakai%'
         OR nama LIKE '%kabel%'
         OR nama LIKE '%connector%'
         OR nama LIKE '%konektor%'
         OR nama LIKE '%rj45%'
         OR nama LIKE '%crimping%'
         OR nama LIKE '%tang%'
    `);
    
    console.log('Update kategori selesai.');
    
    // Tampilkan hasil
    const [results] = await sequelize.query(`
      SELECT id, nama, tipe FROM kategori ORDER BY tipe, nama
    `);
    
    console.log('\nDaftar kategori setelah update:');
    console.table(results);
    
    console.log('\nMigrasi berhasil!');
    
  } catch (error) {
    console.error('Error saat migrasi:', error.message);
    
    // Jika kolom sudah ada, tampilkan pesan yang lebih informatif
    if (error.message.includes('Duplicate column name')) {
      console.log('Kolom tipe sudah ada di tabel kategori.');
      
      // Tampilkan data kategori yang ada
      try {
        const [results] = await sequelize.query(`
          SELECT id, nama, tipe FROM kategori ORDER BY tipe, nama
        `);
        
        console.log('\nDaftar kategori saat ini:');
        console.table(results);
      } catch (err) {
        console.error('Error saat mengambil data kategori:', err.message);
      }
    }
  } finally {
    await sequelize.close();
  }
}

// Jalankan migrasi
addTipeKategori();