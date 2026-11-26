/**
 * Screenshot scan entry point — placeholder for Task 5.
 *
 * Task 5 replaces this with the real import pipeline:
 *   expo-media-library → thumbnail → dHash → SQLite upsert → rules
 *
 * Keeping this decoupled lets onboarding (Task 4) wire the "grant →
 * scan" transition without a hard dependency on the unfinished pipeline.
 *
 * Privacy: no images or text leave the device here; this stub is a
 * no-op. Task 5 must follow the same constraints.
 */

export type ScanOptions = {
  /** If true, run a full rescan; otherwise import only assets newer than lastScanAt. */
  full?: boolean;
};

/**
 * Start (or resume) the screenshot import pipeline.
 *
 * Returns a cleanup / cancel function. Task 5 wires the real
 * implementation; until then it is a safe no-op.
 */
export function startScan(_options?: ScanOptions): () => void {
  // No-op placeholder — Task 5 fills this in.
  return () => {
    /* no-op cancel */
  };
}
