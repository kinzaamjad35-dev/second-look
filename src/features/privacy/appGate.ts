/**
 * App start gate (FR-1.1): decides whether to show onboarding or the Library.
 * Pure decision + a tiny store, no React/Expo imports.
 */

export type StartPermission = 'granted' | 'limited' | 'denied' | 'undetermined' | 'unavailable';

export type StartRoute = 'onboarding' | 'library' | 'demo';

/**
 * - Web (no media library): Demo mode.
 * - Permission granted or limited: Library with real screenshots (scan runs).
 * - Demo mode chosen earlier: Demo.
 * - Otherwise (first launch, denied, undetermined): onboarding.
 */
export function decideStartRoute(input: {
  platform: string;
  permission: StartPermission;
  demoMode: boolean;
}): StartRoute {
  if (input.platform === 'web' || input.permission === 'unavailable') return 'demo';
  if (input.permission === 'granted' || input.permission === 'limited') return 'library';
  if (input.demoMode) return 'demo';
  return 'onboarding';
}

export interface GateState {
  status: 'loading' | 'ready';
  route: StartRoute;
}

let gate: GateState = { status: 'loading', route: 'demo' };
const listeners = new Set<() => void>();

export function getGateState(): GateState {
  return gate;
}

export function setGateState(next: GateState): void {
  gate = next;
  listeners.forEach((l) => l());
}

export function subscribeGate(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
