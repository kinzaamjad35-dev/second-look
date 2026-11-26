import { useSyncExternalStore } from 'react';

import { getGateState, subscribeGate, type GateState } from './appGate';

/** Current app start gate (loading / onboarding / library / demo). */
export function useGate(): GateState {
  return useSyncExternalStore(subscribeGate, getGateState, getGateState);
}
