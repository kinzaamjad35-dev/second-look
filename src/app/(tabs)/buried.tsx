import { PlaceholderScreen } from '@/src/components/PlaceholderScreen';
import { labels } from '@/src/theme/tokens';

/** "Buried" cleanup view — OTPs, duplicates, expired deals (FR-10). */
export default function BuriedScreen() {
  return (
    <PlaceholderScreen
      title={labels.buried}
      note="Junk, duplicates and expired items listed here with their total size — coming in Phase 2."
      epitaph="R.I.P."
    />
  );
}
