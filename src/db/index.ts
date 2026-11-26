/**
 * Database layer barrel export.
 * Import from here rather than from individual files.
 */
export { initDb, getDb } from './schema';
export { getSettings, updateLastScanAt, updateSettings } from './settings';
export type { Settings } from './settings';
export {
  upsertShot,
  getAllShots,
  getShotsByStatus,
  getShotById,
  updateShotStatus,
  shotExistsByAssetId,
  deleteShotById,
  deleteAllShots,
} from './shots';
