const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test detail akses GET sumber dana untuk admin
async function testGetSumberDanaDetail() {
  console.log('=== Testing Detail GET Sumber Dana ===\n');
  
  try {
    // Login sebagai admin
    console.log('1. Login sebagai admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      nama_pengguna: 'admin',
      kata_sandi: 'admin'
    });
    
    if (loginResponse.data.sukses) {
      const token = loginResponse.data.data.token;
      const headers = { Authorization: `Bearer ${token}` };
      
      console.log('✅ Login berhasil');
      
      // Test GET sumber dana
      console.log('\n2. Testing GET sumber dana...');
      try {
        const response = await axios.get(`${BASE_URL}/sumber-dana`, { headers });
        console.log('✅ GET sumber dana berhasil');
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        
      } catch (getError) {
        console.log('❌ GET sumber dana gagal');
        console.log('Status:', getError.response?.status);
        console.log('Error data:', JSON.stringify(getError.response?.data, null, 2));
        console.log('Error message:', getError.message);
      }
      
      // Test GET sumber dana dropdown
      console.log('\n3. Testing GET sumber dana dropdown...');
      try {
        const response = await axios.get(`${BASE_URL}/sumber-dana/dropdown`, { headers });
        console.log('✅ GET sumber dana dropdown berhasil');
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        
      } catch (getError) {
        console.log('❌ GET sumber dana dropdown gagal');
        console.log('Status:', getError.response?.status);
        console.log('Error data:', JSON.stringify(getError.response?.data, null, 2));
        console.log('Error message:', getError.message);
      }
      
    } else {
      console.log('❌ Login gagal');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testGetSumberDanaDetail();