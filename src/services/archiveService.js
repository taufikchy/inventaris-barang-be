const { HistoriAktivitas, HistoriAktivitasArchive } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/basisdata');

class ArchiveService {
  /**
   * Archive data histori aktivitas yang lebih lama dari periode tertentu
   * @param {number} daysOld - Jumlah hari untuk menentukan data lama (default: 90 hari)
   * @param {number} batchSize - Ukuran batch untuk processing (default: 1000)
   */
  static async archiveOldActivities(daysOld = 90, batchSize = 1000) {
    const transaction = await sequelize.transaction();
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      console.log(`Starting archive process for activities older than ${cutoffDate.toISOString()}`);
      
      let totalArchived = 0;
      let hasMoreData = true;
      
      while (hasMoreData) {
        // Ambil batch data lama
        const oldActivities = await HistoriAktivitas.findAll({
          where: {
            waktu_aktivitas: {
              [Op.lt]: cutoffDate
            }
          },
          limit: batchSize,
          order: [['waktu_aktivitas', 'ASC']],
          transaction
        });
        
        if (oldActivities.length === 0) {
          hasMoreData = false;
          break;
        }
        
        // Siapkan data untuk archive
        const archiveData = oldActivities.map(activity => ({
          original_id: activity.id,
          id_pengguna: activity.id_pengguna,
          jenis_aktivitas: activity.jenis_aktivitas,
          modul: activity.modul,
          id_objek: activity.id_objek,
          nama_objek: activity.nama_objek,
          deskripsi: activity.deskripsi,
          data_sebelum: activity.data_sebelum,
          data_sesudah: activity.data_sesudah,
          ip_address: activity.ip_address,
          user_agent: activity.user_agent,
          waktu_aktivitas: activity.waktu_aktivitas,
          archived_at: new Date()
        }));
        
        // Insert ke tabel archive
        await HistoriAktivitasArchive.bulkCreate(archiveData, { transaction });
        
        // Hapus dari tabel utama
        const idsToDelete = oldActivities.map(activity => activity.id);
        await HistoriAktivitas.destroy({
          where: {
            id: {
              [Op.in]: idsToDelete
            }
          },
          transaction
        });
        
        totalArchived += oldActivities.length;
        console.log(`Archived ${oldActivities.length} activities. Total: ${totalArchived}`);
        
        // Jika batch tidak penuh, berarti sudah selesai
        if (oldActivities.length < batchSize) {
          hasMoreData = false;
        }
      }
      
      await transaction.commit();
      
      console.log(`Archive process completed. Total archived: ${totalArchived} activities`);
      
      return {
        success: true,
        totalArchived,
        cutoffDate
      };
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error during archive process:', error);
      throw error;
    }
  }
  
  /**
   * Mendapatkan statistik data archive
   */
  static async getArchiveStats() {
    try {
      const [mainTableCount, archiveTableCount] = await Promise.all([
        HistoriAktivitas.count(),
        HistoriAktivitasArchive.count()
      ]);
      
      const oldestInMain = await HistoriAktivitas.findOne({
        order: [['waktu_aktivitas', 'ASC']],
        attributes: ['waktu_aktivitas']
      });
      
      const newestInArchive = await HistoriAktivitasArchive.findOne({
        order: [['waktu_aktivitas', 'DESC']],
        attributes: ['waktu_aktivitas', 'archived_at']
      });
      
      return {
        mainTable: {
          count: mainTableCount,
          oldestRecord: oldestInMain?.waktu_aktivitas || null
        },
        archiveTable: {
          count: archiveTableCount,
          newestRecord: newestInArchive?.waktu_aktivitas || null,
          lastArchived: newestInArchive?.archived_at || null
        },
        totalRecords: mainTableCount + archiveTableCount
      };
      
    } catch (error) {
      console.error('Error getting archive stats:', error);
      throw error;
    }
  }
  
  /**
   * Membersihkan data archive yang sangat lama (opsional)
   * @param {number} daysOld - Hapus data archive yang lebih lama dari ini (default: 365 hari)
   */
  static async cleanupOldArchive(daysOld = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const deletedCount = await HistoriAktivitasArchive.destroy({
        where: {
          archived_at: {
            [Op.lt]: cutoffDate
          }
        }
      });
      
      console.log(`Cleaned up ${deletedCount} old archive records older than ${cutoffDate.toISOString()}`);
      
      return {
        success: true,
        deletedCount,
        cutoffDate
      };
      
    } catch (error) {
      console.error('Error during archive cleanup:', error);
      throw error;
    }
  }
}

module.exports = ArchiveService;