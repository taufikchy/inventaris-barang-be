const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test komprehensif untuk semua fitur sumber dana
async function testSumberDanaFinal() {
  console.log('=== TEST FINAL FITUR SUMBER DANA ===\n');
  
  let kalabToken = '';
  let adminToken = '';
  let toolmanToken = '';
  
  // 1. Test Login semua role
  console.log('1. TESTING LOGIN SEMUA ROLE');
  console.log('=' .repeat(40));
  
  try {
    // Login Kalab
    const kalabLogin = await axios.post(`${BASE_URL}/auth/login`, {
      nama_pengguna: 'kalab',
      kata_sandi: 'kalab'
    });
    
    if (kalabLogin.data.sukses) {
      kalabToken = kalabLogin.data.data.token;
      console.log('✅ Login Kalab berhasil');
    }
    
    // Login Admin
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      nama_pengguna: 'admin',
      kata_sandi: 'admin'
    });
    
    if (adminLogin.data.sukses) {
      adminToken = adminLogin.data.data.token;
      console.log('✅ Login Admin berhasil');
    }
    
    // Login Toolman
    const toolmanLogin = await axios.post(`${BASE_URL}/auth/login`, {
      nama_pengguna: 'toolman',
      kata_sandi: 'toolman'
    });
    
    if (toolmanLogin.data.sukses) {
      toolmanToken = toolmanLogin.data.data.token;
      console.log('✅ Login Toolman berhasil');
    }
    
  } catch (error) {
    console.log('❌ Error saat login:', error.message);
    return;
  }
  
  // 2. Test akses GET sumber dana untuk semua role
  console.log('\n2. TESTING AKSES GET SUMBER DANA');
  console.log('=' .repeat(40));
  
  const roles = [
    { name: 'Kalab', token: kalabToken },
    { name: 'Admin', token: adminToken },
    { name: 'Toolman', token: toolmanToken }
  ];
  
  for (const role of roles) {
    try {
      const response = await axios.get(`${BASE_URL}/sumber-dana`, {
        headers: { Authorization: `Bearer ${role.token}` }
      });
      
      if (response.data.success) {
        console.log(`✅ ${role.name}: Berhasil akses sumber dana (${response.data.data.length} items)`);
      } else {
        console.log(`❌ ${role.name}: Gagal akses sumber dana`);
      }
    } catch (error) {
      console.log(`❌ ${role.name}: Error akses sumber dana - ${error.response?.status || error.message}`);
    }
  }
  
  // 3. Test CRUD operations - hanya Kalab yang boleh
  console.log('\n3. TESTING CRUD OPERATIONS');
  console.log('=' .repeat(40));
  
  let testSumberDanaId = null;
  
  // Test POST (Create) - hanya Kalab
  console.log('\n3a. Testing POST (Create) Sumber Dana:');
  const testName = `Test Final - ${Date.now()}`;
  
  for (const role of roles) {
    try {
      const response = await axios.post(`${BASE_URL}/sumber-dana`, {
        nama: `${testName} - ${role.name}`
      }, {
        headers: { Authorization: `Bearer ${role.token}` }
      });
      
      if (role.name === 'Kalab') {
        console.log(`✅ ${role.name}: POST berhasil (ID: ${response.data.data.id})`);
        testSumberDanaId = response.data.data.id;
      } else {
        console.log(`❌ MASALAH: ${role.name} bisa POST (seharusnya ditolak!)`);
      }
    } catch (error) {
      if (role.name === 'Kalab') {
        console.log(`❌ ${role.name}: POST gagal - ${error.response?.status || error.message}`);
      } else {
        console.log(`✅ ${role.name}: POST ditolak dengan benar (${error.response?.status})`);
      }
    }
  }
  
  // Test PUT (Update) - hanya Kalab
  if (testSumberDanaId) {
    console.log('\n3b. Testing PUT (Update) Sumber Dana:');
    
    for (const role of roles) {
      try {
        const response = await axios.put(`${BASE_URL}/sumber-dana/${testSumberDanaId}`, {
          nama: `${testName} - Updated by ${role.name}`
        }, {
          headers: { Authorization: `Bearer ${role.token}` }
        });
        
        if (role.name === 'Kalab') {
          console.log(`✅ ${role.name}: PUT berhasil`);
        } else {
          console.log(`❌ MASALAH: ${role.name} bisa PUT (seharusnya ditolak!)`);
        }
      } catch (error) {
        if (role.name === 'Kalab') {
          console.log(`❌ ${role.name}: PUT gagal - ${error.response?.status || error.message}`);
        } else {
          console.log(`✅ ${role.name}: PUT ditolak dengan benar (${error.response?.status})`);
        }
      }
    }
  }
  
  // Test DELETE - hanya Kalab
  if (testSumberDanaId) {
    console.log('\n3c. Testing DELETE Sumber Dana:');
    
    // Test dengan Admin dan Toolman dulu (seharusnya ditolak)
    for (const role of roles.filter(r => r.name !== 'Kalab')) {
      try {
        await axios.delete(`${BASE_URL}/sumber-dana/${testSumberDanaId}`, {
          headers: { Authorization: `Bearer ${role.token}` }
        });
        console.log(`❌ MASALAH: ${role.name} bisa DELETE (seharusnya ditolak!)`);
      } catch (error) {
        console.log(`✅ ${role.name}: DELETE ditolak dengan benar (${error.response?.status})`);
      }
    }
    
    // Test dengan Kalab (seharusnya berhasil)
    try {
      await axios.delete(`${BASE_URL}/sumber-dana/${testSumberDanaId}`, {
        headers: { Authorization: `Bearer ${kalabToken}` }
      });
      console.log(`✅ Kalab: DELETE berhasil`);
    } catch (error) {
      console.log(`❌ Kalab: DELETE gagal - ${error.response?.status || error.message}`);
    }
  }
  
  // 4. Test assign sumber dana ke barang
  console.log('\n4. TESTING ASSIGN SUMBER DANA KE BARANG');
  console.log('=' .repeat(40));
  
  try {
    // Ambil barang pertama
    const barangResponse = await axios.get(`${BASE_URL}/barang?batas=1`, {
      headers: { Authorization: `Bearer ${kalabToken}` }
    });
    
    if (barangResponse.data.sukses && barangResponse.data.data.length > 0) {
      const barang = barangResponse.data.data[0];
      console.log(`Testing dengan barang: ${barang.nama} (ID: ${barang.id})`);
      
      // Test assign dengan semua role
      for (const role of roles) {
        try {
          const response = await axios.put(`${BASE_URL}/barang/${barang.id}`, {
            sumber_dana_id: 1 // BOS
          }, {
            headers: { Authorization: `Bearer ${role.token}` }
          });
          
          if (response.data.sukses) {
            console.log(`✅ ${role.name}: Berhasil assign sumber dana ke barang`);
          } else {
            console.log(`❌ ${role.name}: Gagal assign sumber dana`);
          }
        } catch (error) {
          console.log(`❌ ${role.name}: Error assign sumber dana - ${error.response?.status || error.message}`);
        }
      }
    } else {
      console.log('⚠️ Tidak ada barang untuk testing assign sumber dana');
    }
  } catch (error) {
    console.log('❌ Error saat mengambil data barang:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 TEST FINAL SUMBER DANA SELESAI');
  console.log('=' .repeat(50));
}

testSumberDanaFinal();