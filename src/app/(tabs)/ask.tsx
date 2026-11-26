import { PlaceholderScreen } from '@/src/components/PlaceholderScreen';
import { labels } from '@/src/theme/tokens';

/** "Ask Second Look" natural-language query screen (FR-8). */
export default function AskScreen() {
  return (
    <PlaceholderScreen
      title={labels.ask}
      note={'Ask "where\'s that flight booking?" and Second Look will find it \u2014 coming in Phase 3.'}
    />
  );
}
