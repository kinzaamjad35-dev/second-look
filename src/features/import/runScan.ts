/**
 * Import pipeline core (FR-2): scan → thumbnail → SQLite upsert → lastScanAt.
 *
 * Dependencies are injected so the loop is unit-testable without native modules.
 * startScan.ts wires the real expo-media-library / image-manipulator / SQLite deps.
 */
import { nextLastScanAt, shotIdForAsset } from './screenshotDetection';
import type { MediaAsset } from './mediaLibrary';

export interface ImportedShotRow {
  id: string;
  assetId: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
  takenAt: string;
  ingestedAt: string;
  thumbPath: string;
}

export interface ScanDeps {
  getLastScanAt(): Promise<string | null>;
  setLastScanAt(iso: string): Promise<void>;
  scan(lastScanAt: string | null, limit: number): Promise<MediaAsset[]>;
  exists(assetId: string): Promise<boolean>;
  makeThumbnail(asset: MediaAsset): Promise<string>;
  upsert(row: ImportedShotRow): Promise<void>;
  now(): Date;
  /** Called after every batch so the UI can refresh. */
  onProgress?(progress: ScanProgress): void;
  isCancelled?(): boolean;
}

export interface ScanProgress {
  imported: number;
  skipped: number;
  failed: number;
}

export interface ScanResult extends ScanProgress {
  lastScanAt: string | null;
}

/** Build the row we store for a newly imported asset. */
export function rowForAsset(asset: MediaAsset, thumbPath: string, now: Date): ImportedShotRow {
  return {
    id: shotIdForAsset(asset.id),
    assetId: asset.id,
    fileName: asset.filename,
    fileSize: 0, // not exposed by expo-media-library assets; filled later if needed
    width: asset.width,
    height: asset.height,
    takenAt: new Date(asset.creationTime).toISOString(),
    ingestedAt: now.toISOString(),
    thumbPath,
  };
}

/**
 * Import all screenshots newer than lastScanAt, in batches of `batchSize`
 * (oldest first). lastScanAt advances after each batch, so an interrupted
 * scan resumes where it stopped. Per-file failures are counted and skipped.
 */
export async function runScan(
  deps: ScanDeps,
  options: { full?: boolean; batchSize?: number; maxBatches?: number } = {}
): Promise<ScanResult> {
  const batchSize = options.batchSize ?? 200;
  const maxBatches = options.maxBatches ?? 50;
  let lastScanAt = options.full ? null : await deps.getLastScanAt();
  const progress: ScanProgress = { imported: 0, skipped: 0, failed: 0 };

  for (let batch = 0; batch < maxBatches; batch++) {
    if (deps.isCancelled?.()) break;
    const assets = await deps.scan(lastScanAt, batchSize);
    if (assets.length === 0) break;

    for (const asset of assets) {
      if (deps.isCancelled?.()) break;
      try {
        if (await deps.exists(asset.id)) {
          progress.skipped++;
          continue;
        }
        const thumbPath = await deps.makeThumbnail(asset);
        await deps.upsert(rowForAsset(asset, thumbPath, deps.now()));
        progress.imported++;
      } catch {
        progress.failed++;
      }
    }

    const next = nextLastScanAt(lastScanAt, assets);
    if (next && next !== lastScanAt) {
      lastScanAt = next;
      await deps.setLastScanAt(next);
    }
    deps.onProgress?.({ ...progress });

    if (assets.length < batchSize) break;
  }

  return { ...progress, lastScanAt };
}
