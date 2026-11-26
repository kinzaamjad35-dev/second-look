/**
 * Web stub: there is no photo library on web, and the web build runs in Demo
 * mode only, so expo-sqlite (which needs extra wasm/metro setup on web) is not
 * bundled. Any accidental DB call on web fails loudly instead.
 */
type WebDb = never;

export async function getDb(): Promise<WebDb> {
  throw new Error('SQLite is not used on web (Demo mode only).');
}

export async function initDb(): Promise<void> {
  // no-op on web
}
