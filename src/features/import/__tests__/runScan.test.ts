import { runScan, type ImportedShotRow, type ScanDeps } from '../runScan';
import { filterNewAssets } from '../screenshotDetection';
import type { MediaAsset } from '../mediaLibrary';

const T0 = Date.parse('2026-11-20T10:00:00.000Z');

function mkAsset(i: number): MediaAsset {
  return {
    id: `asset-${i}`,
    filename: `IMG_${i}.PNG`,
    uri: `ph://asset-${i}`,
    width: 1170,
    height: 2532,
    creationTime: T0 + i * 1000,
    mediaSubtypes: ['screenshot'],
  };
}

/** Fake photo library + DB. `library` can grow between scans. */
function fakeDeps(library: MediaAsset[], opts: { failIds?: string[] } = {}) {
  const db = new Map<string, ImportedShotRow>();
  let lastScanAt: string | null = null;
  const thumbs: string[] = [];
  const deps: ScanDeps = {
    getLastScanAt: async () => lastScanAt,
    setLastScanAt: async (iso) => {
      lastScanAt = iso;
    },
    scan: async (last, limit) => filterNewAssets(library, last).slice(0, limit),
    exists: async (assetId) => [...db.values()].some((r) => r.assetId === assetId),
    makeThumbnail: async (a) => {
      if (opts.failIds?.includes(a.id)) throw new Error('thumb failed');
      thumbs.push(a.id);
      return `file:///thumbs/${a.id}.jpg`;
    },
    upsert: async (row) => {
      db.set(row.id, row);
    },
    now: () => new Date('2026-11-26T12:00:00.000Z'),
  };
  return { deps, db, thumbs, getLast: () => lastScanAt };
}

describe('runScan', () => {
  it('imports every screenshot on the first scan and records lastScanAt', async () => {
    const lib = [1, 2, 3].map(mkAsset);
    const { deps, db, getLast } = fakeDeps(lib);
    const res = await runScan(deps);
    expect(res.imported).toBe(3);
    expect(db.size).toBe(3);
    expect(getLast()).toBe(new Date(T0 + 3000).toISOString());
    const row = db.get('asset_asset-1')!;
    expect(row).toMatchObject({
      assetId: 'asset-1',
      fileName: 'IMG_1.PNG',
      width: 1170,
      height: 2532,
      takenAt: new Date(T0 + 1000).toISOString(),
      thumbPath: 'file:///thumbs/asset-1.jpg',
    });
  });

  it('is incremental: a second scan only imports new assets', async () => {
    const lib = [1, 2].map(mkAsset);
    const { deps, db, thumbs } = fakeDeps(lib);
    await runScan(deps);
    lib.push(mkAsset(3));
    const res = await runScan(deps);
    expect(res.imported).toBe(1);
    expect(db.size).toBe(3);
    expect(thumbs).toEqual(['asset-1', 'asset-2', 'asset-3']);
  });

  it('re-scanning with nothing new changes nothing', async () => {
    const { deps, db, getLast } = fakeDeps([1, 2].map(mkAsset));
    await runScan(deps);
    const before = getLast();
    const res = await runScan(deps);
    expect(res).toMatchObject({ imported: 0, skipped: 0, failed: 0 });
    expect(db.size).toBe(2);
    expect(getLast()).toBe(before);
  });

  it('full rescan upserts by asset id without duplicating or re-thumbnailing', async () => {
    const { deps, db, thumbs } = fakeDeps([1, 2].map(mkAsset));
    await runScan(deps);
    const res = await runScan(deps, { full: true });
    expect(res.skipped).toBe(2);
    expect(db.size).toBe(2);
    expect(thumbs).toHaveLength(2);
  });

  it('pages through large libraries in batches', async () => {
    const lib = Array.from({ length: 25 }, (_, i) => mkAsset(i + 1));
    const { deps, db } = fakeDeps(lib);
    const progress: number[] = [];
    deps.onProgress = (p) => progress.push(p.imported);
    const res = await runScan(deps, { batchSize: 10 });
    expect(res.imported).toBe(25);
    expect(db.size).toBe(25);
    expect(progress).toEqual([10, 20, 25]);
  });

  it('counts per-file failures and keeps going', async () => {
    const { deps, db } = fakeDeps([1, 2, 3].map(mkAsset), { failIds: ['asset-2'] });
    const res = await runScan(deps);
    expect(res).toMatchObject({ imported: 2, failed: 1 });
    expect(db.has('asset_asset-2')).toBe(false);
  });

  it('stops when cancelled', async () => {
    const { deps, db } = fakeDeps([1, 2, 3].map(mkAsset));
    deps.isCancelled = () => true;
    await runScan(deps);
    expect(db.size).toBe(0);
  });
});
