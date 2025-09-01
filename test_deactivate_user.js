const axios = require('axios');
const { Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

async function testDeactivateUser() {
  try {
    console.log('🧪 Testing User Deactivation Functionality...');
    
    // 1. Buat user test
    console.log('\n1. Creating test user...');
    const testUser = await Pengguna.create({
      nama: 'Test User Deactivate',
      nama_pengguna: 'testdeactivate',
      kata_sandi: 'password123',
      peran: 'sarana',
      aktif: true
    });
    console.log(`✅ Test user created: ID ${testUser.id}`);
    
    // 2. Login sebagai admin untuk mendapatkan token
    console.log('\n2. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      nama_pengguna: 'admin',
      kata_sandi: 'admin'
    });
    
    console.log('Login response:', loginResponse.data);
    const token = loginResponse.data.data.token;
    console.log(`✅ Login successful, token obtained: ${token.substring(0, 20)}...`);
    
    // 3. Test nonaktifkan user
    console.log('\n3. Testing user deactivation...');
    try {
      const deactivateResponse = await axios.patch(
        `http://localhost:5000/api/pengguna/${testUser.id}/nonaktifkan`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ User deactivation successful!');
      console.log('Response:', deactivateResponse.data);
      
      // Verifikasi user sudah nonaktif
      const updatedUser = await Pengguna.findByPk(testUser.id);
      console.log(`✅ User status verified: aktif = ${updatedUser.aktif}`);
      
    } catch (deactivateError) {
      console.log('❌ User deactivation failed:');
      console.log('Status:', deactivateError.response?.status);
      console.log('Error:', deactivateError.response?.data);
    }
    
    // 4. Test aktifkan user kembali
    console.log('\n4. Testing user reactivation...');
    try {
      const reactivateResponse = await axios.patch(
        `http://localhost:5000/api/pengguna/${testUser.id}/aktifkan`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ User reactivation successful!');
      console.log('Response:', reactivateResponse.data);
      
      // Verifikasi user sudah aktif kembali
      const reactivatedUser = await Pengguna.findByPk(testUser.id);
      console.log(`✅ User status verified: aktif = ${reactivatedUser.aktif}`);
      
    } catch (reactivateError) {
      console.log('❌ User reactivation failed:');
      console.log('Status:', reactivateError.response?.status);
      console.log('Error:', reactivateError.response?.data);
    }
    
    // 5. Test hapus user yang sudah aktif (seharusnya gagal jika ada data terkait)
    console.log('\n5. Testing deletion of active user...');
    try {
      const deleteResponse = await axios.delete(
        `http://localhost:5000/api/pengguna/${testUser.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ User deletion successful!');
      console.log('Response:', deleteResponse.data);
      
    } catch (deleteError) {
      console.log('ℹ️ User deletion prevented (expected if user has related data):');
      console.log('Status:', deleteError.response?.status);
      console.log('Error:', deleteError.response?.data);
      
      // Cleanup: hapus test user secara manual
      console.log('\n🧹 Cleaning up test user...');
      await testUser.destroy();
      console.log('✅ Test user cleaned up');
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Cleanup jika ada error
    try {
      const testUser = await Pengguna.findOne({
        where: { nama_pengguna: 'testdeactivate' }
      });
      if (testUser) {
        await testUser.destroy();
        console.log('🧹 Test user cleaned up after error');
      }
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError.message);
    }
  } finally {
    await sequelize.close();
  }
}

// Jalankan test
testDeactivateUser();