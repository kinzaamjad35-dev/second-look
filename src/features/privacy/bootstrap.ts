/**
 * Runs once at app start: open SQLite, read settings, check photo permission
 * (without prompting), decide the start route, and kick off the incremental scan.
 */
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

import { getSettings, initDb, updateSettings } from '@/src/db';
import { startScan } from '@/src/features/import';

import { decideStartRoute, setGateState, type StartPermission, type StartRoute } from './appGate';

async function readPermission(): Promise<StartPermission> {
  try {
    const res = await MediaLibrary.getPermissionsAsync();
    if (res.granted) return res.accessPrivileges === 'limited' ? 'limited' : 'granted';
    return res.status === 'denied' ? 'denied' : 'undetermined';
  } catch {
    return 'unavailable';
  }
}

export async function bootstrapApp(): Promise<StartRoute> {
  if (Platform.OS === 'web') {
    setGateState({ status: 'ready', route: 'demo' });
    return 'demo';
  }

  let demoMode = false;
  try {
    await initDb();
    demoMode = (await getSettings()).demoMode;
  } catch {
    // DB failure: still let the user through onboarding / demo.
  }

  const permission = await readPermission();
  const route = decideStartRoute({ platform: Platform.OS, permission, demoMode });

  if (route === 'library') {
    if (demoMode) await updateSettings({ demoMode: false }).catch(() => {});
    startScan();
  }
  setGateState({ status: 'ready', route });
  return route;
}

/** Re-check permission on foreground return; re-scan if allowed (FR-2.2). */
export async function onAppForeground(currentRoute: StartRoute): Promise<void> {
  if (Platform.OS === 'web' || currentRoute === 'demo') return;
  const permission = await readPermission();
  if (permission === 'granted' || permission === 'limited') {
    if (currentRoute !== 'library') setGateState({ status: 'ready', route: 'library' });
    startScan();
  }
}

/** Persist the onboarding choice and switch the gate. */
export async function completeOnboarding(choice: 'library' | 'demo'): Promise<void> {
  setGateState({ status: 'ready', route: choice });
  if (Platform.OS === 'web') return;
  try {
    await initDb();
    await updateSettings({ demoMode: choice === 'demo' });
  } catch {
    // Non-fatal: the choice still applies for this session.
  }
}
