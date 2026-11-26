/**
 * Photo-library permission state machine (FR-1).
 *
 * Pure reducer: no side effects, no React/Expo imports — fully unit
 * testable with Jest alone.
 *
 * Statuses
 * ────────
 *   idle        — user has not been asked yet (or state was reset)
 *   requesting  — native permission dialog is in-flight
 *   granted     — full permission granted → UI should start the scan
 *   denied      — user declined → calm state, "Open Settings" + "Try demo"
 *   limited     — iOS Limited Photos (partial access)
 *   demo        — user chose Demo mode (bypasses permission handling)
 *
 * The `limitedNoAlbum` flag covers FR-1.4: on iOS, limited access where
 * the Screenshots album is not accessible. The UI must explain that
 * full access (or selecting more screenshots) is needed, with buttons
 * for settings and demo.
 *
 * Actions
 * ───────
 *   REQUEST     — open the native permission dialog (idle → requesting)
 *   RESULT      — dialog returned: granted | denied | limited
 *   RETRY       — from denied/limited back to idle so REQUEST can run again
 *   OPEN_SETTINGS — user tapped "Open Settings"; state is unchanged (the
 *                  caller performs the Linking.openSettings side effect)
 *   CHOOSE_DEMO — user tapped "Try demo" (any state → demo)
 *   RESET       — back to the pristine idle state
 *   ALBUM_CHECK — after a scan attempt, whether the Screenshots album
 *                 was reachable (drives limitedNoAlbum)
 */

export type PermissionStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'limited'
  | 'demo';

export type PermissionResult = 'granted' | 'denied' | 'limited';

export type PermissionAction =
  | { type: 'REQUEST' }
  | { type: 'RESULT'; result: PermissionResult }
  | { type: 'RETRY' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CHOOSE_DEMO' }
  | { type: 'RESET' }
  | { type: 'ALBUM_CHECK'; screenshotsAlbumAvailable: boolean };

export interface PermissionReducerState {
  status: PermissionStatus;
  /**
   * iOS Limited Photos where the Screenshots album is not accessible
   * (FR-1.4). Only meaningful when status is 'limited'.
   */
  limitedNoAlbum: boolean;
  /** True once the user chose Demo mode (survives RESET off — see CHOOSE_DEMO). */
  demoMode: boolean;
}

export const INITIAL_PERMISSION_STATE: PermissionReducerState = {
  status: 'idle',
  limitedNoAlbum: false,
  demoMode: false,
};

/** What the onboarding UI should render, derived from the state. */
export type PermissionView =
  | 'explainer' // idle
  | 'requesting' // requesting
  | 'scan' // granted — start scan, leave onboarding
  | 'denied' // denied
  | 'limited-explanation' // limited (with or without album)
  | 'demo'; // demo

/**
 * Map the machine state onto the view the UI should show.
 * `limited-explanation` is shown whenever status is 'limited'; the UI
 * reads `limitedNoAlbum` to decide which copy variant to render.
 */
export function permissionView(state: PermissionReducerState): PermissionView {
  switch (state.status) {
    case 'idle':
      return 'explainer';
    case 'requesting':
      return 'requesting';
    case 'granted':
      return 'scan';
    case 'denied':
      return 'denied';
    case 'limited':
      return 'limited-explanation';
    case 'demo':
      return 'demo';
  }
}

/**
 * Pure reducer for photo-library permission.
 * Unrecognised actions return the state unchanged.
 */
export function permissionReducer(
  state: PermissionReducerState,
  action: PermissionAction,
): PermissionReducerState {
  switch (action.type) {
    case 'REQUEST':
      // Only valid from idle; any other status stays put.
      if (state.status !== 'idle') return state;
      return { ...state, status: 'requesting' };

    case 'RESULT': {
      switch (action.result) {
        case 'granted':
          return { ...state, status: 'granted', limitedNoAlbum: false };
        case 'denied':
          return { ...state, status: 'denied', limitedNoAlbum: false };
        case 'limited':
          return { ...state, status: 'limited', limitedNoAlbum: false };
      }
      return state;
    }

    case 'RETRY':
      // Retry makes sense from a blocked state (denied / limited / demo).
      if (state.status === 'granted' || state.status === 'requesting') return state;
      return { ...INITIAL_PERMISSION_STATE };

    case 'OPEN_SETTINGS':
      // No state change — the caller performs Linking.openSettings().
      // The permission is re-checked (RESULT) when the app returns to
      // the foreground.
      return state;

    case 'CHOOSE_DEMO':
      return { status: 'demo', limitedNoAlbum: false, demoMode: true };

    case 'RESET':
      return { ...INITIAL_PERMISSION_STATE };

    case 'ALBUM_CHECK':
      // FR-1.4: limited access and the Screenshots album is not reachable
      // → the UI must explain that full access is needed.
      if (state.status !== 'limited') return state;
      return { ...state, limitedNoAlbum: !action.screenshotsAlbumAvailable };

    default:
      return state;
  }
}
