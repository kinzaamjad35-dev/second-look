import { PlaceholderScreen } from '@/src/components/PlaceholderScreen';
import { labels } from '@/src/theme/tokens';

/** Instant search screen (FR-5). */
export default function SearchScreen() {
  return (
    <PlaceholderScreen
      title={labels.search}
      note="Full-text search across OCR text, titles and extracted fields — coming in Phase 3."
    />
  );
}
