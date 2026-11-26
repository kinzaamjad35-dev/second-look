/**
 * Unit tests for the photo-library permission state machine (FR-1).
 *
 * The reducer is a pure function — no mocks, no device, no React.
 * Every action and transition is covered, including the iOS
 * limited-without-Screenshots-album case (FR-1.4).
 */
import {
  INITIAL_PERMISSION_STATE,
  permissionReducer,
  permissionView,
  type PermissionAction,
  type PermissionReducerState,
} from '../permissionReducer';

// ─── helpers ──────────────────────────────────────────────────────────────────

function reduce(
  state: PermissionReducerState,
  ...actions: PermissionAction[]
): PermissionReducerState {
  return actions.reduce((s, a) => permissionReducer(s, a), state);
}

const idle = (): PermissionReducerState => ({ ...INITIAL_PERMISSION_STATE });
const of = (status: PermissionReducerState['status']): PermissionReducerState => ({
  status,
  limitedNoAlbum: false,
  demoMode: false,
});

// ─── initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('starts idle with no album issue and demo off', () => {
    expect(INITIAL_PERMISSION_STATE).toEqual({
      status: 'idle',
      limitedNoAlbum: false,
      demoMode: false,
    });
  });
});

// ─── REQUEST ───────────────────────────────────────────────────────────────────

describe('REQUEST', () => {
  it('transitions idle → requesting', () => {
    expect(permissionReducer(idle(), { type: 'REQUEST' })).toEqual({
      status: 'requesting',
      limitedNoAlbum: false,
      demoMode: false,
    });
  });

  it('is a no-op when already requesting', () => {
    const s = of('requesting');
    expect(permissionReducer(s, { type: 'REQUEST' })).toEqual(s);
  });

  it('is a no-op from granted', () => {
    const s = of('granted');
    expect(permissionReducer(s, { type: 'REQUEST' })).toEqual(s);
  });

  it('is a no-op from denied', () => {
    const s = of('denied');
    expect(permissionReducer(s, { type: 'REQUEST' })).toEqual(s);
  });

  it('is a no-op from demo', () => {
    const s = of('demo');
    expect(permissionReducer(s, { type: 'REQUEST' })).toEqual(s);
  });
});

// ─── RESULT ────────────────────────────────────────────────────────────────────

describe('RESULT', () => {
  it('granted: requesting → granted', () => {
    const next = permissionReducer(of('requesting'), { type: 'RESULT', result: 'granted' });
    expect(next.status).toBe('granted');
    expect(next.limitedNoAlbum).toBe(false);
  });

  it('denied: requesting → denied', () => {
    const next = permissionReducer(of('requesting'), { type: 'RESULT', result: 'denied' });
    expect(next.status).toBe('denied');
  });

  it('limited: requesting → limited', () => {
    const next = permissionReducer(of('requesting'), { type: 'RESULT', result: 'limited' });
    expect(next.status).toBe('limited');
    expect(next.limitedNoAlbum).toBe(false);
  });

  it('granted clears a stale limitedNoAlbum flag', () => {
    const limited: PermissionReducerState = {
      status: 'limited',
      limitedNoAlbum: true,
      demoMode: false,
    };
    const next = permissionReducer(limited, { type: 'RESULT', result: 'granted' });
    expect(next).toEqual(of('granted'));
  });

  it('a result works from idle too (re-check after returning from Settings)', () => {
    const next = permissionReducer(idle(), { type: 'RESULT', result: 'granted' });
    expect(next.status).toBe('granted');
  });
});

// ─── RETRY ─────────────────────────────────────────────────────────────────────

describe('RETRY', () => {
  it('resets denied → idle so REQUEST can run again', () => {
    const next = permissionReducer(of('denied'), { type: 'RETRY' });
    expect(next).toEqual(INITIAL_PERMISSION_STATE);
  });

  it('resets limited → idle', () => {
    const next = permissionReducer(of('limited'), { type: 'RETRY' });
    expect(next).toEqual(INITIAL_PERMISSION_STATE);
  });

  it('resets demo → idle (leaving demo mode)', () => {
    const demo: PermissionReducerState = {
      status: 'demo',
      limitedNoAlbum: false,
      demoMode: true,
    };
    const next = permissionReducer(demo, { type: 'RETRY' });
    expect(next.status).toBe('idle');
    expect(next.demoMode).toBe(false);
  });

  it('is a no-op from granted', () => {
    const s = of('granted');
    expect(permissionReducer(s, { type: 'RETRY' })).toEqual(s);
  });

  it('is a no-op while requesting', () => {
    const s = of('requesting');
    expect(permissionReducer(s, { type: 'RETRY' })).toEqual(s);
  });

  it('full retry loop: deny → retry → request → grant', () => {
    const final = reduce(
      idle(),
      { type: 'REQUEST' },
      { type: 'RESULT', result: 'denied' },
      { type: 'RETRY' },
      { type: 'REQUEST' },
      { type: 'RESULT', result: 'granted' },
    );
    expect(final.status).toBe('granted');
  });
});

// ─── OPEN_SETTINGS ─────────────────────────────────────────────────────────────

describe('OPEN_SETTINGS', () => {
  it('does not change state (side effect lives in the UI)', () => {
    for (const status of ['idle', 'denied', 'limited', 'demo'] as const) {
      const s = { ...of(status), limitedNoAlbum: status === 'limited' };
      expect(permissionReducer(s, { type: 'OPEN_SETTINGS' })).toEqual(s);
    }
  });
});

// ─── CHOOSE_DEMO ───────────────────────────────────────────────────────────────

describe('CHOOSE_DEMO', () => {
  it('sets demo mode from idle', () => {
    const next = permissionReducer(idle(), { type: 'CHOOSE_DEMO' });
    expect(next).toEqual({ status: 'demo', limitedNoAlbum: false, demoMode: true });
  });

  it('sets demo mode from denied', () => {
    const next = permissionReducer(of('denied'), { type: 'CHOOSE_DEMO' });
    expect(next.status).toBe('demo');
    expect(next.demoMode).toBe(true);
  });

  it('sets demo mode from limited (with stale album flag)', () => {
    const limited: PermissionReducerState = {
      status: 'limited',
      limitedNoAlbum: true,
      demoMode: false,
    };
    const next = permissionReducer(limited, { type: 'CHOOSE_DEMO' });
    expect(next).toEqual({ status: 'demo', limitedNoAlbum: false, demoMode: true });
  });
});

// ─── RESET ─────────────────────────────────────────────────────────────────────

describe('RESET', () => {
  it('resets every status back to idle', () => {
    for (const status of ['granted', 'denied', 'limited', 'demo'] as const) {
      const next = permissionReducer(of(status), { type: 'RESET' });
      expect(next).toEqual(INITIAL_PERMISSION_STATE);
    }
  });

  it('clears the limitedNoAlbum flag', () => {
    const limited: PermissionReducerState = {
      status: 'limited',
      limitedNoAlbum: true,
      demoMode: false,
    };
    expect(permissionReducer(limited, { type: 'RESET' }).limitedNoAlbum).toBe(false);
  });
});

// ─── ALBUM_CHECK (FR-1.4: iOS limited, Screenshots album missing) ─────────────

describe('ALBUM_CHECK', () => {
  it('sets limitedNoAlbum=true when limited and album unavailable', () => {
    const next = permissionReducer(of('limited'), {
      type: 'ALBUM_CHECK',
      screenshotsAlbumAvailable: false,
    });
    expect(next.status).toBe('limited');
    expect(next.limitedNoAlbum).toBe(true);
  });

  it('keeps limitedNoAlbum=false when limited and album available', () => {
    const next = permissionReducer(of('limited'), {
      type: 'ALBUM_CHECK',
      screenshotsAlbumAvailable: true,
    });
    expect(next.limitedNoAlbum).toBe(false);
  });

  it('clears a previous limitedNoAlbum once the album becomes available', () => {
    const limited: PermissionReducerState = {
      status: 'limited',
      limitedNoAlbum: true,
      demoMode: false,
    };
    const next = permissionReducer(limited, {
      type: 'ALBUM_CHECK',
      screenshotsAlbumAvailable: true,
    });
    expect(next.limitedNoAlbum).toBe(false);
  });

  it('is a no-op from any non-limited status', () => {
    for (const status of ['idle', 'requesting', 'granted', 'denied', 'demo'] as const) {
      const s = of(status);
      expect(
        permissionReducer(s, { type: 'ALBUM_CHECK', screenshotsAlbumAvailable: false }),
      ).toEqual(s);
    }
  });
});

// ─── permissionView (UI mapping) ───────────────────────────────────────────────

describe('permissionView', () => {
  it('maps every status to its UI view', () => {
    expect(permissionView(of('idle'))).toBe('explainer');
    expect(permissionView(of('requesting'))).toBe('requesting');
    expect(permissionView(of('granted'))).toBe('scan');
    expect(permissionView(of('denied'))).toBe('denied');
    expect(permissionView(of('limited'))).toBe('limited-explanation');
    expect(permissionView(of('demo'))).toBe('demo');
  });

  it('denied + OPEN_SETTINGS still renders the denied view', () => {
    const s = permissionReducer(of('denied'), { type: 'OPEN_SETTINGS' });
    expect(permissionView(s)).toBe('denied');
  });
});

// ─── Full flows ────────────────────────────────────────────────────────────────

describe('full flows', () => {
  it('happy path: request → granted → scan', () => {
    const final = reduce(idle(), { type: 'REQUEST' }, { type: 'RESULT', result: 'granted' });
    expect(final.status).toBe('granted');
    expect(permissionView(final)).toBe('scan');
  });

  it('denied path: request → denied → settings (no change) → demo', () => {
    const final = reduce(
      idle(),
      { type: 'REQUEST' },
      { type: 'RESULT', result: 'denied' },
      { type: 'OPEN_SETTINGS' },
      { type: 'CHOOSE_DEMO' },
    );
    expect(final.status).toBe('demo');
    expect(final.demoMode).toBe(true);
  });

  it('limited path: request → limited → album missing → full-access explanation', () => {
    const final = reduce(
      idle(),
      { type: 'REQUEST' },
      { type: 'RESULT', result: 'limited' },
      { type: 'ALBUM_CHECK', screenshotsAlbumAvailable: false },
    );
    expect(final.status).toBe('limited');
    expect(final.limitedNoAlbum).toBe(true);
    expect(permissionView(final)).toBe('limited-explanation');
  });

  it('limited path with album still usable: no album flag', () => {
    const final = reduce(
      idle(),
      { type: 'REQUEST' },
      { type: 'RESULT', result: 'limited' },
      { type: 'ALBUM_CHECK', screenshotsAlbumAvailable: true },
    );
    expect(final.limitedNoAlbum).toBe(false);
  });
});

// ─── Invariants ─────────────────────────────────────────────────────────────────

describe('invariants', () => {
  it('is pure: same input always yields an equal, new object', () => {
    const a = permissionReducer(idle(), { type: 'REQUEST' });
    const b = permissionReducer(idle(), { type: 'REQUEST' });
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('never mutates the input state (works on frozen objects)', () => {
    const frozen = Object.freeze({ ...idle() });
    expect(() => permissionReducer(frozen, { type: 'REQUEST' })).not.toThrow();
    expect(frozen.status).toBe('idle');
  });

  it('every result action clears requesting (status leaves the requesting state)', () => {
    for (const result of ['granted', 'denied', 'limited'] as const) {
      const next = permissionReducer(of('requesting'), { type: 'RESULT', result });
      expect(next.status).not.toBe('requesting');
    }
  });
});
