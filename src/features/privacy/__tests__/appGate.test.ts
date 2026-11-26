import { decideStartRoute, getGateState, setGateState, subscribeGate } from '../appGate';

describe('decideStartRoute', () => {
  it('first launch on a phone (undetermined) shows onboarding', () => {
    expect(decideStartRoute({ platform: 'ios', permission: 'undetermined', demoMode: false })).toBe(
      'onboarding'
    );
  });

  it('denied without Demo mode shows onboarding', () => {
    expect(decideStartRoute({ platform: 'android', permission: 'denied', demoMode: false })).toBe(
      'onboarding'
    );
  });

  it('granted or limited goes to the real Library', () => {
    for (const permission of ['granted', 'limited'] as const) {
      for (const demoMode of [true, false]) {
        expect(decideStartRoute({ platform: 'ios', permission, demoMode })).toBe('library');
      }
    }
  });

  it('Demo mode chosen earlier skips onboarding', () => {
    expect(decideStartRoute({ platform: 'ios', permission: 'denied', demoMode: true })).toBe(
      'demo'
    );
  });

  it('web is always Demo mode', () => {
    expect(decideStartRoute({ platform: 'web', permission: 'granted', demoMode: false })).toBe(
      'demo'
    );
    expect(decideStartRoute({ platform: 'web', permission: 'undetermined', demoMode: false })).toBe(
      'demo'
    );
  });

  it('no media library available falls back to Demo mode', () => {
    expect(decideStartRoute({ platform: 'ios', permission: 'unavailable', demoMode: false })).toBe(
      'demo'
    );
  });
});

describe('gate store', () => {
  it('notifies subscribers and unsubscribes', () => {
    const calls: string[] = [];
    const unsub = subscribeGate(() => calls.push(getGateState().route));
    setGateState({ status: 'ready', route: 'onboarding' });
    unsub();
    setGateState({ status: 'ready', route: 'library' });
    expect(calls).toEqual(['onboarding']);
    expect(getGateState()).toEqual({ status: 'ready', route: 'library' });
  });
});
