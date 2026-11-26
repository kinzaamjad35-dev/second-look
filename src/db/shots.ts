/**
 * Shots repository — typed reads/writes for the `shots` table.
 * See design.md §2 for the full schema.
 *
 * JSON columns (dates, prices, urls, phones, duplicateOf, notificationIds,
 * aiPrice, place) are serialised/deserialised transparently.
 */
import { getDb } from './schema';
import type { Shot } from '../features/library/types';

// ---------------------------------------------------------------------------
// Internal row shape (SQLite returns integers for booleans, strings for JSON)
// ---------------------------------------------------------------------------

interface ShotRow {
  id: string;
  assetId: string | null;
  fileName: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  takenAt: string;
  ingestedAt: string;
  thumbPath: string;
  dHash: string;
  ocrStatus: string;
  ocrText: string | null;
  isOtp: number;
  otpValue: string | null;
  dates: string; // JSON
  expiresAt: string | null;
  prices: string; // JSON
  urls: string; // JSON
  phones: string; // JSON
  isDuplicate: number;
  duplicateOf: string | null; // JSON array or null
  category: string | null;
  title: string | null;
  reason: string | null;
  aiPrice: string | null; // JSON
  place: string | null; // JSON
  confidence: number | null;
  classifyStatus: string;
  status: string;
  notificationIds: string; // JSON
}

function rowToShot(row: ShotRow): Shot {
  return {
    id: row.id,
    assetId: row.assetId ?? undefined,
    fileName: row.fileName,
    fileSize: row.fileSize,
    width: row.width ?? 0,
    height: row.height ?? 0,
    takenAt: row.takenAt,
    ingestedAt: row.ingestedAt,
    thumbPath: row.thumbPath,
    dHash: row.dHash,
    ocrStatus: row.ocrStatus as Shot['ocrStatus'],
    ocrText: row.ocrText ?? undefined,
    isOtp: row.isOtp === 1,
    otpValue: row.otpValue ?? undefined,
    dates: JSON.parse(row.dates) as string[],
    expiresAt: row.expiresAt ?? undefined,
    prices: JSON.parse(row.prices) as Shot['prices'],
    urls: JSON.parse(row.urls) as string[],
    phones: JSON.parse(row.phones) as string[],
    isDuplicate: row.isDuplicate === 1,
    duplicateOf: row.duplicateOf ? (JSON.parse(row.duplicateOf) as string[]) : undefined,
    category: (row.category as Shot['category']) ?? undefined,
    title: row.title ?? undefined,
    reason: row.reason ?? undefined,
    aiPrice: row.aiPrice ? (JSON.parse(row.aiPrice) as Shot['aiPrice']) : undefined,
    place: row.place ? (JSON.parse(row.place) as Shot['place']) : undefined,
    confidence: row.confidence ?? undefined,
    classifyStatus: row.classifyStatus as Shot['classifyStatus'],
    status: row.status as Shot['status'],
    notificationIds: JSON.parse(row.notificationIds) as string[],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upsert a shot row.  Uses INSERT OR REPLACE so the asset-id is the natural
 * dedup key when combined with the `id` primary key.  Callers should pass
 * the same `id` for the same asset across scans (derived from assetId).
 */
export async function upsertShot(
  shot: Partial<Shot> &
    Pick<Shot, 'id' | 'fileName' | 'fileSize' | 'takenAt' | 'ingestedAt' | 'thumbPath'>
): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    `INSERT OR REPLACE INTO shots (
      id, assetId, fileName, fileSize, width, height,
      takenAt, ingestedAt, thumbPath, dHash,
      ocrStatus, ocrText,
      isOtp, otpValue, dates, expiresAt, prices, urls, phones,
      isDuplicate, duplicateOf,
      category, title, reason, aiPrice, place, confidence, classifyStatus,
      status, notificationIds
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?
    )`,
    [
      shot.id,
      shot.assetId ?? null,
      shot.fileName,
      shot.fileSize,
      shot.width ?? null,
      shot.height ?? null,
      shot.takenAt,
      shot.ingestedAt,
      shot.thumbPath,
      shot.dHash ?? '',
      shot.ocrStatus ?? 'pending',
      shot.ocrText ?? null,
      shot.isOtp ? 1 : 0,
      shot.otpValue ?? null,
      JSON.stringify(shot.dates ?? []),
      shot.expiresAt ?? null,
      JSON.stringify(shot.prices ?? []),
      JSON.stringify(shot.urls ?? []),
      JSON.stringify(shot.phones ?? []),
      shot.isDuplicate ? 1 : 0,
      shot.duplicateOf ? JSON.stringify(shot.duplicateOf) : null,
      shot.category ?? null,
      shot.title ?? null,
      shot.reason ?? null,
      shot.aiPrice ? JSON.stringify(shot.aiPrice) : null,
      shot.place ? JSON.stringify(shot.place) : null,
      shot.confidence ?? null,
      shot.classifyStatus ?? 'pending',
      shot.status ?? 'active',
      JSON.stringify(shot.notificationIds ?? []),
    ]
  );
}

/**
 * Fetch all shots, ordered by takenAt descending (newest first).
 */
export async function getAllShots(): Promise<Shot[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ShotRow>('SELECT * FROM shots ORDER BY takenAt DESC');
  return rows.map(rowToShot);
}

/**
 * Fetch shots by status.
 */
export async function getShotsByStatus(status: Shot['status']): Promise<Shot[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ShotRow>(
    'SELECT * FROM shots WHERE status = ? ORDER BY takenAt DESC',
    status
  );
  return rows.map(rowToShot);
}

/**
 * Fetch a single shot by its primary key.
 */
export async function getShotById(id: string): Promise<Shot | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ShotRow>('SELECT * FROM shots WHERE id = ?', id);
  return row ? rowToShot(row) : null;
}

/**
 * Update the status of a shot.
 */
export async function updateShotStatus(id: string, status: Shot['status']): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE shots SET status = ? WHERE id = ?', status, id);
}

/**
 * Check whether a shot with the given assetId already exists.
 * Used to skip re-processing assets that were already imported.
 */
export async function shotExistsByAssetId(assetId: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM shots WHERE assetId = ?',
    assetId
  );
  return row !== null;
}

/**
 * Delete a shot row (local record only — does NOT touch the photo library).
 * Photo-library deletion requires explicit user confirmation and goes through
 * expo-media-library in the Buried cleanup view (FR-10).
 */
export async function deleteShotById(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM shots WHERE id = ?', id);
}

/**
 * Delete all shot rows and clear the FTS index.
 * Used by "Delete all my data" in Settings (FR-10 / design.md §5).
 * Does NOT touch the photo library.
 */
export async function deleteAllShots(): Promise<void> {
  const db = await getDb();
  await db.execAsync('DELETE FROM shots; DELETE FROM shots_fts;');
}
