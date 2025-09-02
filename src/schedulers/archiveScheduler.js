const cron = require('node-cron');
const ArchiveService = require('../services/archiveService');

class ArchiveScheduler {
  static init() {
    // Jalankan auto-archive setiap hari Minggu jam 02:00 WIB
    // Cron pattern: '0 2 * * 0' = detik menit jam tanggal bulan hari_minggu
    cron.schedule('0 2 * * 0', async () => {
      console.log('Starting scheduled archive process...');
      
      try {
        // Archive data yang lebih lama dari 90 hari
        const result = await ArchiveService.archiveOldActivities(90, 1000);
        
        console.log(`Scheduled archive completed successfully:`);
        console.log(`- Total archived: ${result.totalArchived} activities`);
        console.log(`- Cutoff date: ${result.cutoffDate}`);
        
        // Opsional: Cleanup archive yang sangat lama (lebih dari 1 tahun)
        if (result.totalArchived > 0) {
          const cleanupResult = await ArchiveService.cleanupOldArchive(365);
          console.log(`Archive cleanup completed: ${cleanupResult.deletedCount} old records deleted`);
        }
        
      } catch (error) {
        console.error('Scheduled archive process failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Jakarta"
    });
    
    // Jalankan statistik archive setiap hari jam 01:00 WIB untuk monitoring
    cron.schedule('0 1 * * *', async () => {
      try {
        const stats = await ArchiveService.getArchiveStats();
        console.log('Daily Archive Statistics:');
        console.log(`- Main table records: ${stats.mainTable.count}`);
        console.log(`- Archive table records: ${stats.archiveTable.count}`);
        console.log(`- Total records: ${stats.totalRecords}`);
        
        // Warning jika data di main table terlalu banyak
        if (stats.mainTable.count > 50000) {
          console.warn(`⚠️  Main table has ${stats.mainTable.count} records. Consider running archive process.`);
        }
        
      } catch (error) {
        console.error('Failed to get archive statistics:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Jakarta"
    });
    
    console.log('Archive scheduler initialized:');
    console.log('- Auto-archive: Every Sunday at 02:00 WIB');
    console.log('- Statistics check: Every day at 01:00 WIB');
  }
  
  /**
   * Manual trigger untuk testing
   */
  static async runArchiveNow(daysOld = 90) {
    try {
      console.log('Running manual archive process...');
      const result = await ArchiveService.archiveOldActivities(daysOld, 1000);
      console.log('Manual archive completed:', result);
      return result;
    } catch (error) {
      console.error('Manual archive failed:', error);
      throw error;
    }
  }
}

module.exports = ArchiveScheduler;