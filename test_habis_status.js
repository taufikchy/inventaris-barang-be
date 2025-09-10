const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function testHabisStatus() {
  let connection;
  let token;
  
  try {
    // Login untuk mendapatkan token
    console.log('1. Login sebagai admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      nama_pengguna: 'admin',
      kata_sandi: 'admin'
    });
    
    token = loginResponse.data.data.token;
    console.log('✓ Login berhasil');
    
    // Koneksi ke database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'inventaris_barang'
    });
    
    console.log('✓ Terhubung ke database');
    
    // Cari barang kategori bahan dengan stok > 0
    console.log('\n2. Mencari barang kategori bahan...');
    const [barangBahan] = await connection.execute(`
      SELECT b.*, k.nama as kategori_nama, k.tipe 
      FROM barang b 
      JOIN kategori k ON b.id_kategori = k.id 
      WHERE k.tipe = 'bahan' AND b.jumlah > 0 
      LIMIT 1
    `);
    
    if (barangBahan.length === 0) {
      console.log('❌ Tidak ada barang kategori bahan dengan stok > 0');
      return;
    }
    
    const barang = barangBahan[0];
    console.log(`✓ Ditemukan barang: ${barang.nama} (ID: ${barang.id}, Stok: ${barang.jumlah})`);
    
    // Update stok menjadi 0
    console.log('\n3. Mengubah stok menjadi 0...');
    await connection.execute(
      'UPDATE barang SET jumlah = 0 WHERE id = ?',
      [barang.id]
    );
    console.log('✓ Stok berhasil diubah menjadi 0');
    
    // Test API untuk melihat status
    console.log('\n4. Mengecek status melalui API...');
    const barangResponse = await axios.get(`${BASE_URL}/barang`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const barangFromAPI = barangResponse.data.data.find(item => 
      item.units && item.units.some(unit => unit.id === barang.id)
    );
    
    if (barangFromAPI) {
      const unit = barangFromAPI.units.find(unit => unit.id === barang.id);
      console.log(`✓ Status barang dari API: ${unit.status}`);
      console.log(`✓ Stok barang dari API: ${unit.stok || unit.jumlah}`);
      
      if (unit.status === 'Habis') {
        console.log('\n🎉 SUCCESS: Status berhasil berubah menjadi "Habis" ketika stok 0!');
      } else {
        console.log(`\n❌ FAILED: Status masih "${unit.status}", seharusnya "Habis"`);
      }
    } else {
      console.log('❌ Barang tidak ditemukan dalam response API');
    }
    
    // Test detail barang
    console.log('\n5. Mengecek detail barang...');
    const detailResponse = await axios.get(`${BASE_URL}/barang/${barang.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✓ Status dari detail API: ${detailResponse.data.data.status}`);
    console.log(`✓ Stok dari detail API: ${detailResponse.data.data.stok || detailResponse.data.data.jumlah}`);
    
    // Kembalikan stok ke nilai semula
    console.log('\n6. Mengembalikan stok ke nilai semula...');
    await connection.execute(
      'UPDATE barang SET jumlah = ? WHERE id = ?',
      [barang.jumlah, barang.id]
    );
    console.log('✓ Stok berhasil dikembalikan');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testHabisStatus();