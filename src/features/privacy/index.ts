/**
 * Privacy feature barrel.
 * Exports the pure permission reducer and the side-effect wrapper.
 */
export {
  permissionReducer,
  permissionView,
  INITIAL_PERMISSION_STATE,
  type PermissionReducerState,
  type PermissionStatus,
  type PermissionResult,
  type PermissionAction,
  type PermissionView,
} from './permissionReducer';

export {
  requestPhotoPermission,
  checkPhotoPermission,
  mapPermissionResult,
  type MediaLibraryPermissionResult,
} from './requestPhotoPermission';
