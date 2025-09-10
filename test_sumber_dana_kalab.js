const axios = require('axios');

// Base URL untuk API
const BASE_URL = 'http://localhost:5000/api';

async function testSumberDanaKalab() {
  try {
    console.log('=== Testing Sumber Dana Features dengan Role Kepala Lab ===\n');
    
    // 1. Login sebagai kepala lab
    console.log('1. Login sebagai kepala lab...');
    
    const passwords = ['kalab', 'admin', 'admin123', 'kalab123', 'password'];
    let token = null;
    let userInfo = null;
    
    for (const password of passwords) {
      try {
        console.log(`   Trying password: ${password}`);
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          nama_pengguna: 'kalab',
          kata_sandi: password
        });
        
        if (loginResponse.data.sukses) {
          token = loginResponse.data.data.token;
          userInfo = loginResponse.data.data.pengguna;
          console.log(`✅ Login berhasil dengan password: ${password}`);
          break;
        }
      } catch (err) {
        console.log(`   ❌ Failed with password: ${password}`);
      }
    }
    
    if (!token) {
      console.error('❌ Semua percobaan login gagal');
      return;
    }
    console.log('✅ Login berhasil sebagai kepala lab');
    console.log('   User:', userInfo.nama);
    console.log('   Role:', userInfo.role);
    
    // Setup headers dengan token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Ambil data sumber dana yang ada
    console.log('\n2. Mengambil data sumber dana yang ada...');
    const sumberDanaResponse = await axios.get(`${BASE_URL}/sumber-dana`, { headers });
    console.log('Response status:', sumberDanaResponse.status);
    console.log('Response data:', sumberDanaResponse.data);
    
    if (sumberDanaResponse.data.success) {
      console.log('✅ Data sumber dana berhasil diambil');
      console.log('   Total sumber dana:', sumberDanaResponse.data.data.length);
      sumberDanaResponse.data.data.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.nama} (ID: ${item.id})`);
      });
    } else {
      console.log('❌ Gagal mengambil data sumber dana:', sumberDanaResponse.data.message);
    }
    
    // 3. Test tambah sumber dana baru
    console.log('\n3. Testing tambah sumber dana baru...');
    const newSumberDana = {
      nama: 'Test Sumber Dana - ' + Date.now()
    };
    
    try {
      const addResponse = await axios.post(`${BASE_URL}/sumber-dana`, newSumberDana, { headers });
      
      console.log('Add response:', addResponse.data);
      
      if (addResponse.data.success) {
        console.log('✅ Sumber dana berhasil ditambahkan');
        console.log('   ID:', addResponse.data.data.id);
        console.log('   Nama:', addResponse.data.data.nama);
        
        const newId = addResponse.data.data.id;
        
        // 4. Test edit sumber dana
        console.log('\n4. Testing edit sumber dana...');
        const editData = {
          nama: 'Test Sumber Dana - Edited - ' + Date.now()
        };
        
        try {
          const editResponse = await axios.put(`${BASE_URL}/sumber-dana/${newId}`, editData, { headers });
          
          if (editResponse.data.success) {
            console.log('✅ Sumber dana berhasil diedit');
            console.log('   Nama baru:', editResponse.data.data.nama);
          } else {
            console.log('❌ Edit sumber dana gagal:', editResponse.data.message);
          }
        } catch (editError) {
          console.log('❌ Error saat edit sumber dana:', editError.response?.data?.pesan || editError.message);
        }
        
        // 5. Test hapus sumber dana
        console.log('\n5. Testing hapus sumber dana...');
        try {
          const deleteResponse = await axios.delete(`${BASE_URL}/sumber-dana/${newId}`, { headers });
          
          if (deleteResponse.data.success) {
            console.log('✅ Sumber dana berhasil dihapus');
          } else {
            console.log('❌ Hapus sumber dana gagal:', deleteResponse.data.message);
          }
        } catch (deleteError) {
          console.log('❌ Error saat hapus sumber dana:', deleteError.response?.data?.pesan || deleteError.message);
        }
        
      } else {
        console.log('❌ Tambah sumber dana gagal:', addResponse.data.pesan);
      }
    } catch (addError) {
      console.log('❌ Error saat tambah sumber dana:', addError.response?.data?.pesan || addError.message);
    }
    
    // 6. Test assign sumber dana ke barang
    console.log('\n6. Testing assign sumber dana ke barang...');
    
    // Ambil barang pertama
    const barangResponse = await axios.get(`${BASE_URL}/barang?limit=1`, { headers });
    
    if (barangResponse.data.sukses && barangResponse.data.data.length > 0) {
      const barang = barangResponse.data.data[0];
      console.log(`   Testing dengan barang: ${barang.nama} (${barang.kode_grup})`);
      
      if (barang.units && barang.units.length > 0) {
        const unit = barang.units[0];
        console.log(`   Unit ID: ${unit.id}, Current sumber dana: ${unit.sumber_dana?.nama || 'Tidak ada'}`);
        
        // Ambil sumber dana pertama untuk testing
        if (sumberDanaResponse.data.data.length > 0) {
          const sumberDanaId = sumberDanaResponse.data.data[0].id;
          
          try {
            const updateUnitResponse = await axios.put(`${BASE_URL}/barang/${unit.id}`, {
                sumber_dana_id: sumberDanaId
              }, { headers });
             
             console.log('Update response:', updateUnitResponse.data);
             
             if (updateUnitResponse.data.sukses) {
               console.log('✅ Sumber dana berhasil di-assign ke unit barang');
               console.log(`   Unit ID: ${unit.id}`);
               console.log(`   Sumber dana baru: ${updateUnitResponse.data.data.sumber_dana.nama}`);
             } else {
               console.log('❌ Assign sumber dana gagal:', updateUnitResponse.data.pesan);
             }
          } catch (assignError) {
            console.log('❌ Error saat assign sumber dana:', assignError.response?.data?.pesan || assignError.message);
          }
        }
      }
    }
    
    console.log('\n=== Testing Selesai ===');
    
  } catch (error) {
    console.error('❌ Error dalam testing:', error.response?.data?.pesan || error.message);
  }
}

// Jalankan test
testSumberDanaKalab();