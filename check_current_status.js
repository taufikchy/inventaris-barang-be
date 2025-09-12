const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCurrentStatus() {
  let connection;
  
  try {
    // Koneksi ke database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'inventaris_barang'
    });
    
    console.log('✓ Terhubung ke database');
    
    // Cek semua barang dengan status 'habis'
    console.log('\n1. Barang dengan status "habis":');
    const [barangHabis] = await connection.execute(`
      SELECT b.*, k.nama as kategori_nama, k.tipe 
      FROM barang b 
      JOIN kategori k ON b.id_kategori = k.id 
      WHERE b.status = 'habis'
      ORDER BY b.id
    `);
    
    console.log(`✓ Ditemukan ${barangHabis.length} barang dengan status 'habis'`);
    
    if (barangHabis.length > 0) {
      barangHabis.forEach(barang => {
        console.log(`  - ID: ${barang.id} | ${barang.nama} | ${barang.kategori_nama} | Stok: ${barang.jumlah} | Status: ${barang.status}`);
      });
    }
    
    // Cek semua barang dengan stok 0
    console.log('\n2. Semua barang dengan stok 0:');
    const [barangStok0] = await connection.execute(`
      SELECT b.*, k.nama as kategori_nama, k.tipe 
      FROM barang b 
      JOIN kategori k ON b.id_kategori = k.id 
      WHERE b.jumlah = 0 AND b.status != 'dihapuskan'
      ORDER BY b.id
    `);
    
    console.log(`✓ Ditemukan ${barangStok0.length} barang dengan stok 0`);
    
    if (barangStok0.length > 0) {
      barangStok0.forEach(barang => {
        console.log(`  - ID: ${barang.id} | ${barang.nama} | ${barang.kategori_nama} | Stok: ${barang.jumlah} | Status: ${barang.status}`);
      });
    }
    
    // Cek distribusi status
    console.log('\n3. Distribusi status barang:');
    const [statusDistribution] = await connection.execute(`
      SELECT status, COUNT(*) as jumlah
      FROM barang 
      WHERE status != 'dihapuskan'
      GROUP BY status
      ORDER BY status
    `);
    
    statusDistribution.forEach(item => {
      console.log(`  - ${item.status}: ${item.jumlah} barang`);
    });
    
    // Cek barang yang mungkin bermasalah (kategori alat dengan stok 0)
    console.log('\n4. Barang kategori alat dengan stok 0:');
    const [alatStok0] = await connection.execute(`
      SELECT b.*, k.nama as kategori_nama, k.tipe 
      FROM barang b 
      JOIN kategori k ON b.id_kategori = k.id 
      WHERE k.tipe = 'alat' AND b.jumlah = 0 AND b.status != 'dihapuskan'
      ORDER BY b.id
    `);
    
    console.log(`✓ Ditemukan ${alatStok0.length} barang kategori alat dengan stok 0`);
    
    if (alatStok0.length > 0) {
      alatStok0.forEach(barang => {
        console.log(`  - ID: ${barang.id} | ${barang.nama} | Status: ${barang.status} | Stok: ${barang.jumlah}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Koneksi database ditutup');
    }
  }
}

checkCurrentStatus();