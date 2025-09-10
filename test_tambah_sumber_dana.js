const axios = require('axios');

// Test tambah sumber dana dengan user kalab
async function testTambahSumberDana() {
  try {
    console.log('=== TEST TAMBAH SUMBER DANA ===');
    
    // 1. Login sebagai kalab
    console.log('1. Login sebagai kalab...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      nama_pengguna: 'kalab',
      kata_sandi: 'kalab'
    });
    
    if (!loginResponse.data.sukses) {
      throw new Error('Login gagal: ' + loginResponse.data.pesan);
    }
    
    const token = loginResponse.data.data.token;
    console.log('✓ Login berhasil');
    console.log('✓ Token:', token.substring(0, 20) + '...');
    
    // 2. Verifikasi user info
    console.log('\n2. Verifikasi user info...');
    const verifyResponse = await axios.get('http://localhost:5000/api/auth/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ User info:', {
      id: verifyResponse.data.data.id,
      username: verifyResponse.data.data.nama_pengguna,
      nama: verifyResponse.data.data.nama,
      peran: verifyResponse.data.data.peran
    });
    
    // 3. Cek sumber dana yang ada
    console.log('\n3. Cek sumber dana yang ada...');
    const getSumberDanaResponse = await axios.get('http://localhost:5000/api/sumber-dana', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ Sumber dana yang ada:');
    getSumberDanaResponse.data.data.forEach(item => {
      console.log(`  - ${item.id}: ${item.nama}`);
    });
    
    // 4. Tambah sumber dana baru
    console.log('\n4. Tambah sumber dana baru...');
    const namaSumberDanaBaru = `Test Sumber Dana ${Date.now()}`;
    
    const addResponse = await axios.post('http://localhost:5000/api/sumber-dana', 
      { nama: namaSumberDanaBaru },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (addResponse.data.success) {
      console.log('✅ BERHASIL! Sumber dana berhasil ditambahkan:');
      console.log('   ID:', addResponse.data.data.id);
      console.log('   Nama:', addResponse.data.data.nama);
      console.log('   Created:', addResponse.data.data.createdAt);
    } else {
      console.log('❌ GAGAL! Response:', addResponse.data);
    }
    
    // 5. Verifikasi data tersimpan
    console.log('\n5. Verifikasi data tersimpan...');
    const verifyDataResponse = await axios.get('http://localhost:5000/api/sumber-dana', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const newItem = verifyDataResponse.data.data.find(item => item.nama === namaSumberDanaBaru);
    if (newItem) {
      console.log('✅ KONFIRMASI! Data berhasil tersimpan di database:');
      console.log('   ID:', newItem.id);
      console.log('   Nama:', newItem.nama);
    } else {
      console.log('❌ MASALAH! Data tidak ditemukan di database');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Jalankan test
testTambahSumberDana();