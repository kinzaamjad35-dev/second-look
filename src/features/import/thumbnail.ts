/**
 * ~300px JPEG thumbnail in the app's document directory (FR-2.3).
 * The original stays in the photo library; only this small copy is stored.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { thumbFileNameForAsset } from './screenshotDetection';

export const THUMB_WIDTH = 300;

function thumbsDir(): Directory {
  const dir = new Directory(Paths.document, 'thumbs');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Create (or replace) the thumbnail for an asset and return its file:// URI. */
export async function createThumbnail(assetId: string, sourceUri: string): Promise<string> {
  const context = ImageManipulator.manipulate(sourceUri);
  context.resize({ width: THUMB_WIDTH });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });

  const target = new File(thumbsDir(), thumbFileNameForAsset(assetId));
  // Only ever replaces our own previous thumbnail for the same asset.
  if (target.exists) target.delete();
  new File(result.uri).moveSync(target);
  return target.uri;
}
