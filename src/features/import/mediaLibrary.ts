/**
 * Screenshot scanner: reads screenshot asset metadata from the photo library.
 *
 * FR-2.1: iOS: "Screenshots" smart album + mediaSubtypes 'screenshot'.
 *         Android: album title or filename matching Screenshot patterns.
 * FR-2.2: Incremental: only assets created after lastScanAt.
 *
 * Uses `expo-media-library/legacy`: in SDK 58 the root export is the new
 * object API, and the old getAssetsAsync/getAlbumsAsync throw at runtime there.
 *
 * Privacy: only metadata and local URIs are read; nothing leaves the device.
 */
import * as MediaLibrary from 'expo-media-library/legacy';
import { Platform } from 'react-native';

import {
  filterNewAssets,
  isScreenshotAsset,
  lastScanAtToMs,
  selectScreenshotAlbums,
  type ScanPlatform,
} from './screenshotDetection';

/** Subset of MediaLibrary.Asset we care about downstream. */
export interface MediaAsset {
  id: string;
  filename: string;
  uri: string; // local ph:// or file:// URI, never sent to network
  width: number;
  height: number;
  /** Unix ms */
  creationTime: number;
  mediaSubtypes?: string[];
}

const PAGE_SIZE = 100;

function currentPlatform(): ScanPlatform {
  if (Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web') {
    return Platform.OS;
  }
  return 'other';
}

function toMediaAsset(asset: MediaLibrary.Asset): MediaAsset {
  return {
    id: asset.id,
    filename: asset.filename,
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    creationTime: asset.creationTime,
    mediaSubtypes: asset.mediaSubtypes,
  };
}

/**
 * Page through one query, oldest first, until `limit` matching assets are
 * collected or the query is exhausted.
 */
async function collect(
  options: MediaLibrary.AssetsOptions,
  limit: number,
  filter?: (asset: MediaAsset) => boolean
): Promise<MediaAsset[]> {
  const out: MediaAsset[] = [];
  let after: string | undefined;
  while (true) {
    const page = await MediaLibrary.getAssetsAsync({
      ...options,
      first: PAGE_SIZE,
      ...(after ? { after } : {}),
    });
    for (const raw of page.assets) {
      const asset = toMediaAsset(raw);
      if (filter && !filter(asset)) continue;
      out.push(asset);
      if (out.length >= limit) return out;
    }
    if (!page.hasNextPage || !page.endCursor || page.assets.length === 0) return out;
    after = page.endCursor;
  }
}

/**
 * Whether the iOS Screenshots album (or an Android screenshot album) is reachable.
 * Drives the Limited-Photos "no album" copy (FR-1.4).
 */
export async function hasScreenshotAlbum(): Promise<boolean> {
  const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
  return selectScreenshotAlbums(albums, currentPlatform()).length > 0;
}

/**
 * Find screenshot assets newer than `lastScanAt`, oldest first, at most `limit`.
 * The caller imports them and advances lastScanAt to the newest one, then calls
 * again until fewer than `limit` come back.
 */
export async function scanScreenshots(
  lastScanAt: string | null,
  limit = 200
): Promise<MediaAsset[]> {
  const platform = currentPlatform();
  if (platform === 'web' || platform === 'other') return [];

  const afterMs = lastScanAtToMs(lastScanAt);
  const baseOptions: MediaLibrary.AssetsOptions = {
    mediaType: 'photo',
    sortBy: [['creationTime', true]], // oldest first so a capped batch never skips
    ...(afterMs !== null ? { createdAfter: afterMs } : {}),
  };

  const albums = selectScreenshotAlbums(
    await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true }),
    platform
  );

  const found: MediaAsset[] = [];
  for (const album of albums) {
    found.push(...(await collect({ ...baseOptions, album }, limit)));
  }

  if (platform === 'ios') {
    // mediaSubtypes catches screenshots outside the album (non-English album
    // title, Limited Photos selections).
    found.push(
      ...(await collect({ ...baseOptions, mediaSubtypes: ['screenshot'] }, limit, (a) =>
        isScreenshotAsset(a, 'ios')
      ))
    );
  } else if (albums.length === 0) {
    // Android without a screenshot album: filename match across all photos.
    found.push(...(await collect(baseOptions, limit, (a) => isScreenshotAsset(a, 'android'))));
  }

  // Each source is oldest-first and capped at `limit`, so the oldest `limit`
  // of the merged, de-duplicated list are exactly right.
  return filterNewAssets(found, lastScanAt).slice(0, limit);
}
