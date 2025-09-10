const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './inventaris-barang-be/.env' });

async function testLoginDebug() {
  console.log('=== DEBUG LOGIN ISSUE ===\n');
  
  // 1. Cek koneksi database
  console.log('1. Checking database connection...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'inventaris_tkj'
    });
    
    console.log('✓ Database connection successful');
    
    // 2. Cek user kalab di database
    console.log('\n2. Checking user kalab in database...');
    const [users] = await connection.execute(
      'SELECT id, nama, nama_pengguna, peran, aktif FROM pengguna WHERE nama_pengguna = ?',
      ['kalab']
    );
    
    if (users.length === 0) {
      console.log('❌ User kalab not found in database!');
      
      // Show all users
      const [allUsers] = await connection.execute(
        'SELECT id, nama, nama_pengguna, peran, aktif FROM pengguna'
      );
      console.log('\nAll users in database:');
      allUsers.forEach(user => {
        console.log(`  - ${user.nama_pengguna} (${user.nama}) - Role: ${user.peran} - Active: ${user.aktif}`);
      });
    } else {
      const user = users[0];
      console.log('✓ User kalab found:');
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Name: ${user.nama}`);
      console.log(`  - Username: ${user.nama_pengguna}`);
      console.log(`  - Role: ${user.peran}`);
      console.log(`  - Active: ${user.aktif}`);
    }
    
    await connection.end();
    
  } catch (dbError) {
    console.log('❌ Database connection failed:', dbError.message);
    return;
  }
  
  // 3. Test backend server status
  console.log('\n3. Testing backend server status...');
  try {
    const statusResponse = await axios.get('http://localhost:5000/api/status');
    console.log('✓ Backend server is running');
    console.log('  Response:', statusResponse.data);
  } catch (serverError) {
    console.log('❌ Backend server not responding:', serverError.message);
    return;
  }
  
  // 4. Test login endpoint
  console.log('\n4. Testing login endpoint...');
  try {
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      nama_pengguna: 'kalab',
      kata_sandi: 'kalab'
    });
    
    console.log('✅ LOGIN SUCCESSFUL!');
    console.log('  Response:', loginResponse.data);
    
  } catch (loginError) {
    console.log('❌ LOGIN FAILED!');
    console.log('  Status:', loginError.response?.status);
    console.log('  Error message:', loginError.response?.data?.pesan || loginError.message);
    console.log('  Full response:', loginError.response?.data);
    
    // Additional debugging
    if (loginError.response?.status === 401) {
      console.log('\n🔍 401 Error Analysis:');
      console.log('  - This could mean:');
      console.log('    1. Username "kalab" does not exist');
      console.log('    2. Password "kalab" is incorrect');
      console.log('    3. User account is inactive');
      console.log('    4. Password hashing/comparison issue');
    }
  }
  
  // 5. Test with different credentials if kalab fails
  console.log('\n5. Testing with admin credentials...');
  try {
    const adminResponse = await axios.post('http://localhost:5000/api/auth/login', {
      nama_pengguna: 'admin',
      kata_sandi: 'admin123'
    });
    
    console.log('✅ ADMIN LOGIN SUCCESSFUL!');
    console.log('  This confirms the login endpoint is working');
    
  } catch (adminError) {
    console.log('❌ Admin login also failed');
    console.log('  Status:', adminError.response?.status);
    console.log('  This suggests a broader authentication issue');
  }
}

testLoginDebug().catch(console.error);