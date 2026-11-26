import fc from 'fast-check';

import {
  filterNewAssets,
  isScreenshotAlbumTitle,
  isScreenshotAsset,
  isScreenshotFilename,
  nextLastScanAt,
  selectScreenshotAlbums,
  shotIdForAsset,
  thumbFileNameForAsset,
  type DetectableAsset,
} from '../screenshotDetection';

const asset = (id: string, creationTime: number, extra: Partial<DetectableAsset> = {}) => ({
  id,
  filename: `${id}.png`,
  creationTime,
  ...extra,
});

describe('isScreenshotFilename (Android)', () => {
  it.each([
    'Screenshot_20250601-101400.png',
    'Screenshot_2025-06-01-10-14-00-123_com.android.chrome.jpg',
    'Screen Shot 2025-06-01 at 10.14.00.png',
    'screen-shot-1.jpg',
    'screenshot.png',
    'SCREENSHOT_1.PNG',
  ])('matches %s', (name) => {
    expect(isScreenshotFilename(name)).toBe(true);
  });

  it.each(['IMG_0421.JPG', 'PXL_20250601.jpg', 'my screenshot.png', '', 'DSC0001.jpg'])(
    'rejects %s',
    (name) => {
      expect(isScreenshotFilename(name)).toBe(false);
    }
  );

  it('handles null/undefined', () => {
    expect(isScreenshotFilename(null)).toBe(false);
    expect(isScreenshotFilename(undefined)).toBe(false);
  });
});

describe('album detection', () => {
  it('iOS only accepts the Screenshots smart album', () => {
    expect(isScreenshotAlbumTitle('Screenshots', 'ios')).toBe(true);
    expect(isScreenshotAlbumTitle('Recents', 'ios')).toBe(false);
    expect(isScreenshotAlbumTitle('My screenshots', 'ios')).toBe(false);
  });

  it('Android accepts screenshot-like album titles', () => {
    for (const t of ['Screenshots', 'Screenshot', 'Screen shots', 'screen_shots']) {
      expect(isScreenshotAlbumTitle(t, 'android')).toBe(true);
    }
    expect(isScreenshotAlbumTitle('Camera', 'android')).toBe(false);
    expect(isScreenshotAlbumTitle('WhatsApp Images', 'android')).toBe(false);
  });

  it('selectScreenshotAlbums filters a list', () => {
    const albums = [{ title: 'Camera' }, { title: 'Screenshots' }, { title: 'Recents' }];
    expect(selectScreenshotAlbums(albums, 'ios')).toEqual([{ title: 'Screenshots' }]);
    expect(selectScreenshotAlbums(albums, 'android')).toEqual([{ title: 'Screenshots' }]);
  });
});

describe('isScreenshotAsset', () => {
  it('iOS uses mediaSubtypes, not the filename', () => {
    expect(isScreenshotAsset(asset('IMG_1', 1, { mediaSubtypes: ['screenshot'] }), 'ios')).toBe(
      true
    );
    expect(isScreenshotAsset(asset('IMG_2', 1, { mediaSubtypes: ['hdr'] }), 'ios')).toBe(false);
    expect(isScreenshotAsset(asset('IMG_3', 1, { filename: 'Screenshot_1.png' }), 'ios')).toBe(
      false
    );
  });

  it('Android uses the filename', () => {
    expect(isScreenshotAsset(asset('a', 1, { filename: 'Screenshot_1.png' }), 'android')).toBe(
      true
    );
    expect(isScreenshotAsset(asset('b', 1, { filename: 'IMG_1.jpg' }), 'android')).toBe(false);
  });
});

describe('filterNewAssets (incremental scan)', () => {
  const t0 = Date.parse('2026-11-20T10:00:00.000Z');

  it('keeps everything when never scanned, oldest first', () => {
    const out = filterNewAssets([asset('b', t0 + 2), asset('a', t0 + 1)], null);
    expect(out.map((a) => a.id)).toEqual(['a', 'b']);
  });

  it('drops assets at or before lastScanAt', () => {
    const last = new Date(t0).toISOString();
    const out = filterNewAssets(
      [asset('old', t0 - 1), asset('same', t0), asset('new', t0 + 1)],
      last
    );
    expect(out.map((a) => a.id)).toEqual(['new']);
  });

  it('de-duplicates by asset id (album + mediaSubtypes overlap)', () => {
    const out = filterNewAssets([asset('a', t0), asset('a', t0), asset('b', t0 + 5)], null);
    expect(out.map((a) => a.id)).toEqual(['a', 'b']);
  });

  it('treats an invalid lastScanAt as never scanned', () => {
    expect(filterNewAssets([asset('a', t0)], 'not-a-date')).toHaveLength(1);
  });

  it('property: every kept asset is newer than lastScanAt, unique and sorted', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 4 }),
            t: fc.integer({ min: 0, max: 1e12 }),
          })
        ),
        fc.option(fc.integer({ min: 0, max: 1e12 }), { nil: null }),
        (raw, lastMs) => {
          const last = lastMs === null ? null : new Date(lastMs).toISOString();
          const out = filterNewAssets(
            raw.map((r) => asset(r.id, r.t)),
            last
          );
          const ids = out.map((a) => a.id);
          expect(new Set(ids).size).toBe(ids.length);
          for (let i = 1; i < out.length; i++) {
            expect(out[i].creationTime).toBeGreaterThanOrEqual(out[i - 1].creationTime);
          }
          if (lastMs !== null) out.forEach((a) => expect(a.creationTime).toBeGreaterThan(lastMs));
        }
      )
    );
  });
});

describe('nextLastScanAt', () => {
  const t0 = Date.parse('2026-11-20T10:00:00.000Z');

  it('advances to the newest imported asset', () => {
    expect(nextLastScanAt(null, [{ creationTime: t0 }, { creationTime: t0 + 5000 }])).toBe(
      new Date(t0 + 5000).toISOString()
    );
  });

  it('keeps the previous value when nothing new was found', () => {
    expect(nextLastScanAt(null, [])).toBeNull();
    const prev = new Date(t0).toISOString();
    expect(nextLastScanAt(prev, [])).toBe(prev);
  });

  it('never moves backwards', () => {
    const prev = new Date(t0).toISOString();
    expect(nextLastScanAt(prev, [{ creationTime: t0 - 1000 }])).toBe(prev);
  });

  it('property: result is >= previous and >= every imported asset', () => {
    fc.assert(
      fc.property(
        fc.option(fc.integer({ min: 0, max: 1e12 }), { nil: null }),
        fc.array(fc.integer({ min: 0, max: 1e12 })),
        (prevMs, times) => {
          const prev = prevMs === null ? null : new Date(prevMs).toISOString();
          const next = nextLastScanAt(
            prev,
            times.map((creationTime) => ({ creationTime }))
          );
          if (next === null) {
            expect(prev).toBeNull();
            expect(times).toHaveLength(0);
            return;
          }
          const nextMs = Date.parse(next);
          if (prevMs !== null) expect(nextMs).toBeGreaterThanOrEqual(prevMs);
          times.forEach((t) => expect(nextMs).toBeGreaterThanOrEqual(t));
        }
      )
    );
  });
});

describe('ids and file names', () => {
  it('shot id is stable per asset', () => {
    expect(shotIdForAsset('ABC/L0/001')).toBe(shotIdForAsset('ABC/L0/001'));
    expect(shotIdForAsset('a')).not.toBe(shotIdForAsset('b'));
  });

  it('thumbnail file name is filesystem-safe', () => {
    expect(thumbFileNameForAsset('ABC-12/L0/001')).toBe('ABC-12_L0_001.jpg');
  });
});
