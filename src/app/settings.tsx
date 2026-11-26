import { PlaceholderScreen } from '@/src/components/PlaceholderScreen';
import { labels } from '@/src/theme/tokens';

/**
 * Settings screen.
 * Smart sorting toggle, notification prefs, "Delete all my data".
 * Full implementation in Task 21.
 */
export default function SettingsScreen() {
  return (
    <PlaceholderScreen
      title={labels.settings}
      note="Smart sorting, notification preferences and data management — coming in Phase 6."
    />
  );
}
