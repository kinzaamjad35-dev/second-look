/**
 * Tiny pub/sub for scan state so screens can refresh while importing.
 * Pure (no React/Expo imports).
 */
export interface ScanState {
  running: boolean;
  imported: number;
  failed: number;
  lastError?: string;
  /** Bumps every time new rows may be in SQLite. */
  version: number;
}

let state: ScanState = { running: false, imported: 0, failed: 0, version: 0 };
const listeners = new Set<() => void>();

export function getScanState(): ScanState {
  return state;
}

export function setScanState(patch: Partial<ScanState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function subscribeScanState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
