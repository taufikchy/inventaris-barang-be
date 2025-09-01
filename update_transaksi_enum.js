const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateTransaksiEnum() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'inventaris_barang'
    });

    console.log('Connected to database');

    // Update enum for jenis_transaksi to remove 'masuk'
    const updateEnumQuery = `
      ALTER TABLE transaksi 
      MODIFY COLUMN jenis_transaksi ENUM('keluar', 'rusak', 'hilang') NOT NULL
    `;

    console.log('Updating jenis_transaksi enum...');
    await connection.execute(updateEnumQuery);
    console.log('✓ jenis_transaksi enum updated successfully');

    // Check if there are any existing 'masuk' transactions
    const [existingMasukRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM transaksi WHERE jenis_transaksi = "masuk"'
    );
    
    if (existingMasukRows[0].count > 0) {
      console.log(`⚠️  Warning: Found ${existingMasukRows[0].count} existing 'masuk' transactions`);
      console.log('These transactions may need to be handled manually');
    } else {
      console.log('✓ No existing "masuk" transactions found');
    }

    console.log('Database update completed successfully!');

  } catch (error) {
    console.error('Error updating database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the update
updateTransaksiEnum();