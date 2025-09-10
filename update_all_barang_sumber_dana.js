const { Barang, SumberDana } = require('./src/models');
const { Op } = require('sequelize');

async function updateAllBarangSumberDana() {
  try {
    console.log('=== Updating ALL Barang without Sumber Dana ===');
    
    // Get all barang without sumber dana
    const barangWithoutSumberDana = await Barang.findAll({
      where: {
        id_sumber_dana: {
          [Op.is]: null
        }
      }
    });
    
    console.log(`Found ${barangWithoutSumberDana.length} barang without sumber dana`);
    
    if (barangWithoutSumberDana.length === 0) {
      console.log('All barang already have sumber dana!');
      return;
    }
    
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
    
    console.log('\nUpdating barang with sumber dana...');
    
    // Update each barang with random sumber dana
    for (let i = 0; i < barangWithoutSumberDana.length; i++) {
      const barang = barangWithoutSumberDana[i];
      const randomSumberDana = sumberDanaList[i % sumberDanaList.length];
      
      await barang.update({
        id_sumber_dana: randomSumberDana.id
      });
      
      console.log(`Updated ${barang.nama} (${barang.kode}) with sumber dana: ${randomSumberDana.nama}`);
    }
    
    console.log('\n=== Final Verification ===');
    
    // Count again
    const totalBarang = await Barang.count();
    const barangWithSumberDanaCount = await Barang.count({
      where: {
        id_sumber_dana: {
          [Op.not]: null
        }
      }
    });
    const barangWithoutSumberDanaCount = totalBarang - barangWithSumberDanaCount;
    
    console.log(`Total Barang: ${totalBarang}`);
    console.log(`Barang with Sumber Dana: ${barangWithSumberDanaCount}`);
    console.log(`Barang without Sumber Dana: ${barangWithoutSumberDanaCount}`);
    
  } catch (error) {
    console.error('Error updating barang sumber dana:', error);
  } finally {
    process.exit(0);
  }
}

updateAllBarangSumberDana();