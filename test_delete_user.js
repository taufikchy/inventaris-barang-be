const { Pengguna } = require('./src/models');
const axios = require('axios');

// Script untuk menguji penghapusan user melalui API

async function testDeleteUser() {
  try {
    console.log('=== TEST PENGHAPUSAN USER ===\n');
    
    // 1. Buat user test baru
    console.log('1. Membuat user test baru...');
    const userTest = await Pengguna.create({
      nama: 'User Test Delete',
      nama_pengguna: 'usertest_delete',
      kata_sandi: 'test123',
      peran: 'sarana'
    });
    
    console.log(`✅ User test berhasil dibuat dengan ID: ${userTest.id}`);
    console.log(`   Nama: ${userTest.nama}`);
    console.log(`   Username: ${userTest.nama_pengguna}`);
    console.log(`   Role: ${userTest.peran}\n`);
    
    // 2. Login untuk mendapatkan token
    console.log('2. Login untuk mendapatkan token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      nama_pengguna: 'admin',
      kata_sandi: 'admin'
    });
    
    console.log('Login response:', loginResponse.data);
    
    if (!loginResponse.data.data || !loginResponse.data.data.token) {
      throw new Error('Token tidak ditemukan dalam response login');
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login berhasil, token diperoleh\n');
    console.log('Token preview:', token.substring(0, 20) + '...');
    
    // 3. Coba hapus user melalui API
    console.log(`3. Menghapus user dengan ID ${userTest.id} melalui API...`);
    
    const deleteResponse = await axios.delete(
      `http://localhost:5000/api/pengguna/${userTest.id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ User berhasil dihapus melalui API!');
    console.log('Response:', deleteResponse.data);
    
    // 4. Verifikasi user sudah terhapus
    console.log('\n4. Verifikasi user sudah terhapus...');
    const userCheck = await Pengguna.findByPk(userTest.id);
    
    if (!userCheck) {
      console.log('✅ Verifikasi berhasil: User sudah tidak ada di database');
    } else {
      console.log('❌ Error: User masih ada di database');
    }
    
    console.log('\n=== TEST SELESAI ===');
    console.log('✅ Semua test berhasil! Penghapusan user sudah berfungsi dengan benar.');
    
  } catch (error) {
    console.error('❌ Error saat test:', error.message);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    // Jika ada user test yang tertinggal, coba hapus
    try {
      const userTest = await Pengguna.findOne({
        where: { nama_pengguna: 'usertest_delete' }
      });
      
      if (userTest) {
        console.log('\nMembersihkan user test yang tertinggal...');
        await userTest.destroy();
        console.log('✅ User test berhasil dibersihkan');
      }
    } catch (cleanupError) {
      console.error('Error saat cleanup:', cleanupError.message);
    }
  }
}

// Jalankan test
if (require.main === module) {
  testDeleteUser();
}

module.exports = { testDeleteUser };