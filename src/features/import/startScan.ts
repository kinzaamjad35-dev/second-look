/**
 * Screenshot scan entry point (FR-2). Wires runScan to the real modules.
 *
 * Called on grant (onboarding), on cold start and on foreground return
 * (root layout), and on pull-to-refresh. Only one scan runs at a time.
 *
 * Privacy: images are read and thumbnailed on device only.
 */
import { Platform } from 'react-native';

import { getSettings, initDb, shotExistsByAssetId, updateLastScanAt, upsertShot } from '@/src/db';

import { scanScreenshots } from './mediaLibrary';
import { runScan, type ScanResult } from './runScan';
import { getScanState, setScanState } from './scanEvents';
import { createThumbnail } from './thumbnail';

export type ScanOptions = {
  /** If true, run a full rescan; otherwise import only assets newer than lastScanAt. */
  full?: boolean;
};

let inFlight: Promise<ScanResult | null> | null = null;

/** Run a scan (or join the one already running). Never throws. */
export function runScanOnce(options?: ScanOptions): Promise<ScanResult | null> {
  if (Platform.OS === 'web') return Promise.resolve(null);
  if (inFlight) return inFlight;

  let cancelled = false;
  cancelCurrent = () => {
    cancelled = true;
  };

  setScanState({ running: true, lastError: undefined });
  inFlight = (async () => {
    try {
      await initDb();
      const result = await runScan(
        {
          getLastScanAt: async () => (await getSettings()).lastScanAt,
          setLastScanAt: updateLastScanAt,
          scan: scanScreenshots,
          exists: shotExistsByAssetId,
          makeThumbnail: (asset) => createThumbnail(asset.id, asset.uri),
          upsert: (row) =>
            upsertShot({
              ...row,
              ocrStatus: 'pending',
              classifyStatus: 'pending',
              status: 'active',
            }),
          now: () => new Date(),
          onProgress: (p) =>
            setScanState({
              imported: p.imported,
              failed: p.failed,
              version: getScanState().version + 1,
            }),
          isCancelled: () => cancelled,
        },
        { full: options?.full }
      );
      return result;
    } catch (e) {
      setScanState({ lastError: e instanceof Error ? e.message : String(e) });
      return null;
    } finally {
      inFlight = null;
      setScanState({ running: false, version: getScanState().version + 1 });
    }
  })();
  return inFlight;
}

let cancelCurrent: () => void = () => {};

/**
 * Start (or join) the import pipeline in the background.
 * Returns a cancel function (stops after the current file).
 */
export function startScan(options?: ScanOptions): () => void {
  void runScanOnce(options);
  return () => cancelCurrent();
}
