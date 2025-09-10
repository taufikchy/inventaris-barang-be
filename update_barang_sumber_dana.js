const { Barang, SumberDana, sequelize } = require('./src/models');

async function updateBarangSumberDana() {
  try {
    console.log('=== Updating Barang with Sumber Dana ===');
    
    // Get all barang
    const allBarang = await Barang.findAll({
      limit: 20 // Update first 20 items
    });
    
    // Get available sumber dana
    const sumberDanaList = await SumberDana.findAll();
    console.log('Available Sumber Dana:');
    sumberDanaList.forEach(sd => {
      console.log(`- ID: ${sd.id}, Nama: ${sd.nama}`);
    });
    
    if (sumberDanaList.length === 0) {
      console.log('No sumber dana found!');
      return;
    }
    
    console.log('\nUpdating barang with random sumber dana...');
    
    // Update each barang with random sumber dana
    for (let i = 0; i < allBarang.length; i++) {
      const barang = allBarang[i];
      const randomSumberDana = sumberDanaList[i % sumberDanaList.length];
      
      await barang.update({
        id_sumber_dana: randomSumberDana.id
      });
      
      console.log(`Updated ${barang.nama} with sumber dana: ${randomSumberDana.nama}`);
    }
    
    console.log('\n=== Verification ===');
    
    // Verify the update
    const updatedBarang = await Barang.findAll({
      include: [{
        model: SumberDana,
        as: 'sumber_dana',
        attributes: ['id', 'nama']
      }],
      limit: 10
    });
    
    console.log('\nUpdated Barang (first 10):');
    updatedBarang.forEach(barang => {
      console.log(`- ${barang.nama}: ${barang.sumber_dana?.nama || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error updating barang sumber dana:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

updateBarangSumberDana();