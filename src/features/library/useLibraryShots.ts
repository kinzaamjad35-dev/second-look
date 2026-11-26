/**
 * Library data source: real imported screenshots from SQLite (refreshed as the
 * scan imports batches), or the bundled demo shots in Demo mode / on web.
 * Task 8 adds grouping by category on top of this.
 */
import { useEffect, useState } from 'react';

import { getAllShots } from '@/src/db';
import { useScanState } from '@/src/features/import/useScanState';

import { DEMO_SHOTS } from './demoShots';
import type { Shot } from './types';

export function useLibraryShots(isDemo: boolean): { shots: Shot[]; loaded: boolean } {
  const scan = useScanState();
  const [shots, setShots] = useState<Shot[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isDemo) return;
    let active = true;
    getAllShots()
      .then((rows) => {
        if (!active) return;
        setShots(rows.filter((s) => s.status !== 'buried'));
        setLoaded(true);
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [isDemo, scan.version]);

  if (isDemo) return { shots: DEMO_SHOTS, loaded: true };
  return { shots, loaded };
}
