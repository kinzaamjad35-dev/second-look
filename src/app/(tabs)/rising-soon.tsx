import { PlaceholderScreen } from '@/src/components/PlaceholderScreen';
import { labels } from '@/src/theme/tokens';

/** "Rising soon" — items with upcoming dates/expiries (FR-6). */
export default function RisingSoonScreen() {
  return (
    <PlaceholderScreen
      title={labels.risingSoon}
      note="Deals and events rising within 14 days will appear here, soonest first."
      epitaph="rising soon"
    />
  );
}
