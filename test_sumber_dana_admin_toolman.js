const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test untuk Admin dan Toolman - hanya bisa akses dropdown, tidak bisa CRUD
async function testSumberDanaAdminToolman() {
  console.log('=== Testing Sumber Dana untuk Admin dan Toolman ===\n');
  
  const testUsers = [
    { username: 'admin', password: 'admin', role: 'admin' },
    { username: 'toolman', password: 'toolman', role: 'toolman' }
  ];
  
  for (const user of testUsers) {
    console.log(`\n--- Testing untuk role: ${user.role.toUpperCase()} ---`);
    
    try {
      // 1. Login
      console.log('1. Login...');
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        nama_pengguna: user.username,
        kata_sandi: user.password
      });
      
      if (loginResponse.data.sukses) {
        const token = loginResponse.data.data.token;
        const userInfo = loginResponse.data.data.pengguna;
        const headers = { Authorization: `Bearer ${token}` };
        
        console.log(`✅ Login berhasil sebagai ${userInfo.nama} (${userInfo.peran})`);
        
        // 2. Test akses GET sumber dana (seharusnya berhasil)
        console.log('\n2. Testing akses GET sumber dana...');
        try {
          const sumberDanaResponse = await axios.get(`${BASE_URL}/sumber-dana`, { headers });
          
          if (sumberDanaResponse.data.success) {
            console.log('✅ Berhasil mengakses data sumber dana untuk dropdown');
            console.log(`   Total sumber dana: ${sumberDanaResponse.data.data.length}`);
          } else {
            console.log('❌ Gagal mengakses data sumber dana');
          }
        } catch (getError) {
          console.log('❌ Error saat mengakses sumber dana:', getError.response?.data?.message || getError.message);
        }
        
        // 3. Test POST sumber dana (seharusnya ditolak)
        console.log('\n3. Testing POST sumber dana (seharusnya ditolak)...');
        try {
          const addResponse = await axios.post(`${BASE_URL}/sumber-dana`, {
            nama: `Test Unauthorized - ${Date.now()}`
          }, { headers });
          
          console.log('❌ MASALAH: POST sumber dana berhasil (seharusnya ditolak!)');
        } catch (postError) {
          if (postError.response?.status === 403) {
            console.log('✅ POST sumber dana ditolak dengan benar (403 Forbidden)');
          } else {
            console.log('⚠️ POST sumber dana ditolak dengan status:', postError.response?.status);
          }
        }
        
        // 4. Test PUT sumber dana (seharusnya ditolak)
        console.log('\n4. Testing PUT sumber dana (seharusnya ditolak)...');
        try {
          const editResponse = await axios.put(`${BASE_URL}/sumber-dana/1`, {
            nama: `Test Edit Unauthorized - ${Date.now()}`
          }, { headers });
          
          console.log('❌ MASALAH: PUT sumber dana berhasil (seharusnya ditolak!)');
        } catch (putError) {
          if (putError.response?.status === 403) {
            console.log('✅ PUT sumber dana ditolak dengan benar (403 Forbidden)');
          } else {
            console.log('⚠️ PUT sumber dana ditolak dengan status:', putError.response?.status);
          }
        }
        
        // 5. Test DELETE sumber dana (seharusnya ditolak)
        console.log('\n5. Testing DELETE sumber dana (seharusnya ditolak)...');
        try {
          const deleteResponse = await axios.delete(`${BASE_URL}/sumber-dana/1`, { headers });
          
          console.log('❌ MASALAH: DELETE sumber dana berhasil (seharusnya ditolak!)');
        } catch (deleteError) {
          if (deleteError.response?.status === 403) {
            console.log('✅ DELETE sumber dana ditolak dengan benar (403 Forbidden)');
          } else {
            console.log('⚠️ DELETE sumber dana ditolak dengan status:', deleteError.response?.status);
          }
        }
        
        // 6. Test assign sumber dana ke barang (seharusnya berhasil)
        console.log('\n6. Testing assign sumber dana ke barang...');
        try {
          // Ambil barang pertama
          const barangResponse = await axios.get(`${BASE_URL}/barang?page=1&limit=1`, { headers });
          
          if (barangResponse.data.success && barangResponse.data.data.length > 0) {
            const barang = barangResponse.data.data[0];
            
            const updateResponse = await axios.put(`${BASE_URL}/barang/${barang.id}`, {
              sumber_dana_id: 2 // BOP
            }, { headers });
            
            if (updateResponse.data.sukses) {
              console.log('✅ Berhasil assign sumber dana ke barang');
              console.log(`   Barang: ${barang.nama}`);
              console.log(`   Sumber dana baru: ${updateResponse.data.data.sumber_dana.nama}`);
            } else {
              console.log('❌ Gagal assign sumber dana:', updateResponse.data.pesan);
            }
          } else {
            console.log('⚠️ Tidak ada barang untuk testing assign sumber dana');
          }
        } catch (assignError) {
          console.log('❌ Error saat assign sumber dana:', assignError.response?.data?.pesan || assignError.message);
        }
        
      } else {
        console.log('❌ Login gagal:', loginResponse.data.message);
      }
      
    } catch (loginError) {
      console.log('❌ Error saat login:', loginError.response?.data?.message || loginError.message);
      if (loginError.response?.data) {
        console.log('   Response data:', loginError.response.data);
      }
    }
  }
  
  console.log('\n=== Testing Selesai ===');
}

testSumberDanaAdminToolman();