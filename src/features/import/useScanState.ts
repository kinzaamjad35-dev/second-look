import { useSyncExternalStore } from 'react';

import { getScanState, subscribeScanState, type ScanState } from './scanEvents';

/** Live scan state (running, imported count, version bump per batch). */
export function useScanState(): ScanState {
  return useSyncExternalStore(subscribeScanState, getScanState, getScanState);
}
