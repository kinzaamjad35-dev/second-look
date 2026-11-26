/**
 * SQLite schema definitions for Second Look.
 * See design.md §2 for the full data model.
 *
 * Run `initDb()` once at app startup (before any reads/writes).
 */
import * as SQLite from 'expo-sqlite';

let _db: Promise<SQLite.SQLiteDatabase> | null = null;
let _init: Promise<void> | null = null;

/** Open (or reuse) the SQLite database. Concurrent callers share one open. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = SQLite.openDatabaseAsync('second-look.db').catch((e) => {
      _db = null;
      throw e;
    });
  }
  return _db;
}

/**
 * Create all tables if they don't already exist.
 * Uses CREATE TABLE IF NOT EXISTS, so it's safe to call on every launch.
 */
export function initDb(): Promise<void> {
  if (!_init) {
    _init = createTables().catch((e) => {
      _init = null;
      throw e;
    });
  }
  return _init;
}

async function createTables(): Promise<void> {
  const db = await getDb();

  // shots table — mirrors the design.md §2 schema exactly
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS shots (
      id TEXT PRIMARY KEY,
      assetId TEXT,
      fileName TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      takenAt TEXT NOT NULL,
      ingestedAt TEXT NOT NULL,
      thumbPath TEXT NOT NULL,

      dHash TEXT NOT NULL DEFAULT '',

      ocrStatus TEXT NOT NULL DEFAULT 'pending',
      ocrText TEXT,

      isOtp INTEGER NOT NULL DEFAULT 0,
      otpValue TEXT,
      dates TEXT NOT NULL DEFAULT '[]',
      expiresAt TEXT,
      prices TEXT NOT NULL DEFAULT '[]',
      urls TEXT NOT NULL DEFAULT '[]',
      phones TEXT NOT NULL DEFAULT '[]',
      isDuplicate INTEGER NOT NULL DEFAULT 0,
      duplicateOf TEXT,

      category TEXT,
      title TEXT,
      reason TEXT,
      aiPrice TEXT,
      place TEXT,
      confidence REAL,
      classifyStatus TEXT NOT NULL DEFAULT 'pending',

      status TEXT NOT NULL DEFAULT 'active',
      notificationIds TEXT NOT NULL DEFAULT '[]'
    );

    -- One row per photo-library asset: re-scans upsert instead of duplicating.
    CREATE UNIQUE INDEX IF NOT EXISTS shots_assetId ON shots(assetId);
    CREATE INDEX IF NOT EXISTS shots_takenAt ON shots(takenAt);

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      lastScanAt TEXT,
      smartSortingEnabled INTEGER NOT NULL DEFAULT 0,
      smartSortingNoticeSeen INTEGER NOT NULL DEFAULT 0,
      reminderLeadHours INTEGER NOT NULL DEFAULT 24,
      dailyNudgeTime TEXT NOT NULL DEFAULT '09:00',
      notificationsEnabled INTEGER NOT NULL DEFAULT 0,
      demoMode INTEGER NOT NULL DEFAULT 0
    );

    -- Ensure the singleton settings row always exists.
    INSERT OR IGNORE INTO settings (id) VALUES (1);
  `);

  // Full-text index (search is task 11). Created separately so a SQLite build
  // without FTS5 cannot break import.
  try {
    await db.execAsync(`
    CREATE VIRTUAL TABLE IF NOT EXISTS shots_fts USING fts5(
      ocrText,
      title,
      reason,
      place,
      urls,
      content='shots',
      content_rowid='rowid'
    );
    `);
  } catch {
    // FTS5 unavailable; search falls back later.
  }
}
