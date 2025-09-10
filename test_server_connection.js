const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test koneksi ke server
async function testServerConnection() {
  console.log('=== Testing Server Connection ===\n');
  
  try {
    console.log('Testing koneksi ke server...');
    const response = await axios.get(`${BASE_URL}/status`, { timeout: 5000 });
    console.log('✅ Server terhubung');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Server tidak terhubung');
    console.log('Error:', error.message);
    if (error.code) {
      console.log('Error code:', error.code);
    }
    return;
  }
  
  // Test login dengan user yang sudah terbukti berhasil (kalab)
  try {
    console.log('\nTesting login dengan user kalab...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      nama_pengguna: 'kalab',
      kata_sandi: 'kalab'
    });
    
    console.log('✅ Login kalab berhasil');
    console.log('Response format:', {
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      hasToken: !!loginResponse.data.data?.token,
      hasUser: !!loginResponse.data.data?.pengguna
    });
    
  } catch (error) {
    console.log('❌ Login kalab gagal');
    console.log('Error:', error.response?.data || error.message);
  }
  
  // Test login dengan admin
  try {
    console.log('\nTesting login dengan admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      nama_pengguna: 'admin',
      kata_sandi: 'admin'
    });
    
    console.log('✅ Login admin berhasil');
    console.log('Response:', loginResponse.data);
    
  } catch (error) {
    console.log('❌ Login admin gagal');
    console.log('Status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Error message:', error.message);
  }
}

testServerConnection();