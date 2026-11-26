/**
 * Pure screenshot-detection + incremental-scan helpers (FR-2.1, FR-2.2).
 *
 * No React / Expo imports, so everything here is unit-testable with Jest alone.
 * mediaLibrary.ts and scan.ts call these with real expo-media-library data.
 */

/** Minimal asset shape the helpers need (subset of MediaLibrary.Asset). */
export interface DetectableAsset {
  id: string;
  filename: string;
  /** Unix ms */
  creationTime: number;
  /** iOS only. */
  mediaSubtypes?: string[];
}

export type ScanPlatform = 'ios' | 'android' | 'web' | 'other';

/** iOS smart-album title (English). Non-English devices rely on mediaSubtypes. */
export const IOS_SCREENSHOTS_ALBUM = 'Screenshots';

/** Android album titles: "Screenshots", "Screenshot", "Screen shots", "Screen_Shots"... */
const ANDROID_ALBUM_PATTERN = /screen[\s_-]?shots?/i;

/**
 * Android filenames: "Screenshot_20250601-101400.png", "Screen Shot 2025-06-01 at ...png",
 * "screen-shot-1.jpg", "Screenshot 2025-06-01.png", "Screenshot_2025..._Chrome.jpg".
 */
const SCREENSHOT_FILENAME_PATTERN = /^screen[\s_-]?shot/i;

export function isScreenshotFilename(filename: string | null | undefined): boolean {
  if (!filename) return false;
  return SCREENSHOT_FILENAME_PATTERN.test(filename.trim());
}

export function isScreenshotAlbumTitle(
  title: string | null | undefined,
  platform: ScanPlatform
): boolean {
  if (!title) return false;
  if (platform === 'ios') return title === IOS_SCREENSHOTS_ALBUM;
  return ANDROID_ALBUM_PATTERN.test(title);
}

/**
 * Whether an asset (already fetched) is a screenshot.
 * iOS: mediaSubtypes includes 'screenshot'.
 * Android: filename match.
 */
export function isScreenshotAsset(asset: DetectableAsset, platform: ScanPlatform): boolean {
  if (platform === 'ios') {
    return (asset.mediaSubtypes ?? []).includes('screenshot');
  }
  return isScreenshotFilename(asset.filename);
}

/** Pick the screenshot albums out of a full album list. */
export function selectScreenshotAlbums<T extends { title: string }>(
  albums: T[],
  platform: ScanPlatform
): T[] {
  return albums.filter((a) => isScreenshotAlbumTitle(a.title, platform));
}

/** lastScanAt (ISO or null) → epoch ms, or null for "never scanned"/invalid. */
export function lastScanAtToMs(lastScanAt: string | null | undefined): number | null {
  if (!lastScanAt) return null;
  const ms = Date.parse(lastScanAt);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Keep only assets strictly newer than lastScanAt (null = keep all),
 * de-duplicated by asset id and sorted oldest → newest so a capped batch
 * never skips older assets.
 */
export function filterNewAssets<T extends DetectableAsset>(
  assets: T[],
  lastScanAt: string | null | undefined
): T[] {
  const after = lastScanAtToMs(lastScanAt);
  const seen = new Set<string>();
  const out: T[] = [];
  for (const a of assets) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    if (after !== null && !(a.creationTime > after)) continue;
    out.push(a);
  }
  return out.sort((x, y) => x.creationTime - y.creationTime || x.id.localeCompare(y.id));
}

/**
 * The next lastScanAt after importing `imported`: the newest creationTime
 * seen, never moving backwards. Returns the previous value when nothing new.
 */
export function nextLastScanAt(
  previous: string | null | undefined,
  imported: Pick<DetectableAsset, 'creationTime'>[]
): string | null {
  const prevMs = lastScanAtToMs(previous);
  let max = prevMs ?? -Infinity;
  for (const a of imported) {
    if (Number.isFinite(a.creationTime) && a.creationTime > max) max = a.creationTime;
  }
  if (max === -Infinity) return previous ?? null;
  if (prevMs !== null && max === prevMs) return previous ?? null;
  return new Date(max).toISOString();
}

/** Stable SQLite primary key for a media-library asset. */
export function shotIdForAsset(assetId: string): string {
  return `asset_${assetId}`;
}

/** Filesystem-safe thumbnail file name for an asset. */
export function thumbFileNameForAsset(assetId: string): string {
  return `${assetId.replace(/[^A-Za-z0-9_-]/g, '_')}.jpg`;
}
