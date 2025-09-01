const axios = require('axios');
const { Pengguna } = require('./src/models');
const sequelize = require('./src/config/basisdata');

const BASE_URL = 'http://localhost:5000';

async function testUserFeatures() {
  let testUserId = null;
  let adminToken = null;

  try {
    console.log('🧪 Testing User Features...');
    
    // 1. Login sebagai kepala lab untuk mendapatkan token
    console.log('\n1. Login sebagai kepala lab...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      nama_pengguna: 'kalab',
      kata_sandi: 'kalab'
    });
    
    if (loginResponse.data.sukses) {
      adminToken = loginResponse.data.data.token;
      console.log('✅ Login berhasil');
    } else {
      throw new Error('Login gagal');
    }

    // 2. Test membuat user dengan password pendek (tanpa validasi 6 karakter)
    console.log('\n2. Test membuat user dengan password pendek...');
    const createUserResponse = await axios.post(`${BASE_URL}/api/pengguna`, {
      nama: 'Test User Password',
      nama_pengguna: 'testpass',
      kata_sandi: '123', // Password hanya 3 karakter
      peran: 'sarana'
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (createUserResponse.data.sukses) {
      testUserId = createUserResponse.data.data.id;
      console.log('✅ User berhasil dibuat dengan password pendek');
      console.log(`   User ID: ${testUserId}`);
    } else {
      console.log('❌ Gagal membuat user:', createUserResponse.data.pesan);
    }

    // 3. Test nonaktifkan user
    if (testUserId) {
      console.log('\n3. Test nonaktifkan user...');
      const deactivateResponse = await axios.patch(`${BASE_URL}/api/pengguna/${testUserId}/nonaktifkan`, {}, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (deactivateResponse.data.sukses) {
        console.log('✅ User berhasil dinonaktifkan');
        console.log(`   Status: ${deactivateResponse.data.data.aktif ? 'Aktif' : 'Nonaktif'}`);
      } else {
        console.log('❌ Gagal nonaktifkan user:', deactivateResponse.data.pesan);
      }
    }

    // 4. Test aktifkan user kembali
    if (testUserId) {
      console.log('\n4. Test aktifkan user kembali...');
      const activateResponse = await axios.patch(`${BASE_URL}/api/pengguna/${testUserId}/aktifkan`, {}, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (activateResponse.data.sukses) {
        console.log('✅ User berhasil diaktifkan kembali');
        console.log(`   Status: ${activateResponse.data.data.aktif ? 'Aktif' : 'Nonaktif'}`);
      } else {
        console.log('❌ Gagal aktifkan user:', activateResponse.data.pesan);
      }
    }

    // 5. Test hapus user (seharusnya berhasil karena tidak ada data terkait)
    if (testUserId) {
      console.log('\n5. Test hapus user...');
      const deleteResponse = await axios.delete(`${BASE_URL}/api/pengguna/${testUserId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (deleteResponse.data.sukses) {
        console.log('✅ User berhasil dihapus');
        testUserId = null; // Reset karena sudah dihapus
      } else {
        console.log('❌ Gagal hapus user:', deleteResponse.data.pesan);
      }
    }

    console.log('\n🎉 Testing selesai!');

  } catch (error) {
    console.error('❌ Error during testing:', error.response?.data || error.message);
  } finally {
    // Cleanup: hapus test user jika masih ada
    if (testUserId) {
      try {
        console.log('\n🧹 Cleanup: Menghapus test user...');
        await Pengguna.destroy({ where: { id: testUserId } });
        console.log('✅ Test user berhasil dihapus');
      } catch (cleanupError) {
        console.error('❌ Error cleanup:', cleanupError.message);
      }
    }
    
    // Tutup koneksi database
    try {
      await sequelize.close();
      console.log('✅ Database connection closed');
    } catch (closeError) {
      console.error('❌ Error closing database:', closeError.message);
    }
  }
}

// Jalankan test
testUserFeatures();