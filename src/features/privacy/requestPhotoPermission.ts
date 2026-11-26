/**
 * Side-effect wrapper around expo-media-library's permission API.
 * Maps native results onto the pure reducer's RESULT actions so the
 * onboarding screen can stay dumb. All side effects live here.
 */
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

import type { PermissionAction, PermissionResult } from './permissionReducer';

export interface MediaLibraryPermissionResult {
  granted: boolean;
  /** iOS: 'all' | 'limited' | 'none'. */
  accessPrivileges?: 'all' | 'limited' | 'none';
  canAskAgain: boolean;
}

/**
 * Maps an expo-media-library permission result onto the reducer's
 * PermissionResult.
 *
 * iOS can return `granted: true` with `accessPrivileges: 'limited'` —
 * that is the Limited Photos case (FR-1.4).
 */
export function mapPermissionResult(
  result: MediaLibraryPermissionResult,
): PermissionResult {
  // iOS: granted + limited privileges → Limited Photos
  if (Platform.OS === 'ios' && result.accessPrivileges === 'limited') {
    return 'limited';
  }
  if (result.granted) {
    // Some platforms report 'limited' meaning partial access
    if (result.accessPrivileges === 'limited') {
      return 'limited';
    }
    return 'granted';
  }
  return 'denied';
}

/**
 * Requests (or re-checks) photo-library permission and returns the
 * reducer action to dispatch. Does NOT dispatch — the caller owns
 * the reducer.
 */
export async function requestPhotoPermission(): Promise<PermissionAction> {
  const result = await MediaLibrary.requestPermissionsAsync();
  return { type: 'RESULT', result: mapPermissionResult(result as MediaLibraryPermissionResult) };
}

/**
 * Checks the current permission state without showing a dialog.
 * Use when returning from system Settings (after OPEN_SETTINGS) to
 * re-check without prompting.
 */
export async function checkPhotoPermission(): Promise<PermissionAction> {
  const result = await MediaLibrary.getPermissionsAsync();
  if (result.granted === false && result.canAskAgain === false) {
    return { type: 'RESULT', result: 'denied' as PermissionResult };
  }
  if (result.granted === false) {
    // Not decided yet / can ask again — caller should REQUEST
    return { type: 'REQUEST' };
  }
  return { type: 'RESULT', result: mapPermissionResult(result as MediaLibraryPermissionResult) };
}
