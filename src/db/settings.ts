/**
 * Settings repository — reads/writes the singleton settings row.
 * See design.md §2 for the Settings data model.
 */
import { getDb } from './schema';

export interface Settings {
  id: 1;
  lastScanAt: string | null;
  smartSortingEnabled: boolean;
  smartSortingNoticeSeen: boolean;
  reminderLeadHours: number;
  dailyNudgeTime: string;
  notificationsEnabled: boolean;
  demoMode: boolean;
}

/** Row shape as stored in SQLite (integers for booleans). */
interface SettingsRow {
  id: number;
  lastScanAt: string | null;
  smartSortingEnabled: number;
  smartSortingNoticeSeen: number;
  reminderLeadHours: number;
  dailyNudgeTime: string;
  notificationsEnabled: number;
  demoMode: number;
}

function rowToSettings(row: SettingsRow): Settings {
  return {
    id: 1,
    lastScanAt: row.lastScanAt ?? null,
    smartSortingEnabled: row.smartSortingEnabled === 1,
    smartSortingNoticeSeen: row.smartSortingNoticeSeen === 1,
    reminderLeadHours: row.reminderLeadHours,
    dailyNudgeTime: row.dailyNudgeTime,
    notificationsEnabled: row.notificationsEnabled === 1,
    demoMode: row.demoMode === 1,
  };
}

/**
 * Read the singleton settings row.
 * The row is guaranteed to exist after `initDb()`.
 */
export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const row = await db.getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = 1');
  if (!row) {
    // Defensive: insert the row if it somehow doesn't exist.
    await db.runAsync('INSERT OR IGNORE INTO settings (id) VALUES (1)');
    return {
      id: 1,
      lastScanAt: null,
      smartSortingEnabled: false,
      smartSortingNoticeSeen: false,
      reminderLeadHours: 24,
      dailyNudgeTime: '09:00',
      notificationsEnabled: false,
      demoMode: false,
    };
  }
  return rowToSettings(row);
}

/**
 * Update `lastScanAt` after a successful scan pass.
 * @param iso ISO 8601 timestamp string.
 */
export async function updateLastScanAt(iso: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE settings SET lastScanAt = ? WHERE id = 1', iso);
}

/**
 * Update any subset of settings fields.
 */
export async function updateSettings(patch: Partial<Omit<Settings, 'id'>>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic patch map
  const values: any[] = [];

  if (patch.lastScanAt !== undefined) {
    fields.push('lastScanAt = ?');
    values.push(patch.lastScanAt);
  }
  if (patch.smartSortingEnabled !== undefined) {
    fields.push('smartSortingEnabled = ?');
    values.push(patch.smartSortingEnabled ? 1 : 0);
  }
  if (patch.smartSortingNoticeSeen !== undefined) {
    fields.push('smartSortingNoticeSeen = ?');
    values.push(patch.smartSortingNoticeSeen ? 1 : 0);
  }
  if (patch.reminderLeadHours !== undefined) {
    fields.push('reminderLeadHours = ?');
    values.push(patch.reminderLeadHours);
  }
  if (patch.dailyNudgeTime !== undefined) {
    fields.push('dailyNudgeTime = ?');
    values.push(patch.dailyNudgeTime);
  }
  if (patch.notificationsEnabled !== undefined) {
    fields.push('notificationsEnabled = ?');
    values.push(patch.notificationsEnabled ? 1 : 0);
  }
  if (patch.demoMode !== undefined) {
    fields.push('demoMode = ?');
    values.push(patch.demoMode ? 1 : 0);
  }

  if (fields.length === 0) return;

  await db.runAsync(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`, values);
}
