import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/src/components/ThemedText';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';
import type { Shot } from './types';

// ─── Category badge config ───────────────────────────────────────────────────

type Category = NonNullable<Shot['category']>;

const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  deal: { bg: '#1A3A2A', text: colors.deal },
  event: { bg: '#3A2D0A', text: colors.event },
  place: { bg: '#1A2A3A', text: '#7EC8E3' },
  recipe: { bg: '#2A1A3A', text: '#C9A0DC' },
  receipt: { bg: '#2A2A1A', text: '#D4C57A' },
  note: { bg: '#1E1E2A', text: colors.stone },
  junk: { bg: '#252527', text: colors.junk },
};

const CATEGORY_LABEL: Record<Category, string> = {
  deal: '🏷 deal',
  event: '📅 event',
  place: '📍 place',
  recipe: '🍴 recipe',
  receipt: '🧾 receipt',
  note: '📝 note',
  junk: '🗑 junk',
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Shot['status'] }) {
  if (status === 'active') return null;

  const isDone = status === 'done';
  return (
    <View style={[styles.statusBadge, isDone ? styles.statusDone : styles.statusBuried]}>
      <ThemedText type="caption" style={isDone ? styles.statusDoneText : styles.statusBuriedText}>
        {isDone ? '✓ Done' : '⚰ Buried'}
      </ThemedText>
    </View>
  );
}

// ─── Category badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: Category | undefined }) {
  if (!category) return null;
  const palette = CATEGORY_COLORS[category];
  return (
    <View style={[styles.categoryBadge, { backgroundColor: palette.bg }]}>
      <ThemedText type="caption" style={[styles.categoryText, { color: palette.text }]}>
        {CATEGORY_LABEL[category]}
      </ThemedText>
    </View>
  );
}

// ─── ShotCard ─────────────────────────────────────────────────────────────────

interface ShotCardProps {
  shot: Shot;
  onPress?: (shot: Shot) => void;
}

export function ShotCard({ shot, onPress }: ShotCardProps) {
  const displayTitle = shot.title ?? shot.fileName;
  const isBuried = shot.status === 'buried';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, isBuried && styles.cardBuried]}
      onPress={() => onPress?.(shot)}
      accessibilityRole="button"
      accessibilityLabel={`${displayTitle}, ${shot.category ?? 'uncategorised'}, ${shot.status}`}
    >
      {/* Thumbnail */}
      <View style={styles.thumbWrap}>
        <Image
          source={{ uri: shot.thumbPath }}
          style={[styles.thumb, isBuried && styles.thumbBuried]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        {/* Status badge overlaid on thumbnail */}
        <View style={styles.statusOverlay}>
          <StatusBadge status={shot.status} />
        </View>
      </View>

      {/* Info section */}
      <View style={styles.info}>
        <CategoryBadge category={shot.category} />

        <ThemedText
          type="caption"
          style={isBuried ? [styles.title, styles.textMuted] : styles.title}
          numberOfLines={2}
        >
          {displayTitle}
        </ThemedText>

        {shot.reason ? (
          <ThemedText type="caption" style={styles.reason} numberOfLines={2}>
            {shot.reason}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_WIDTH = 164;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.75,
  },
  cardBuried: {
    opacity: 0.6,
    borderColor: colors.junk,
  },
  thumbWrap: {
    width: '100%',
    height: CARD_WIDTH, // square thumbnail area
    backgroundColor: colors.surface,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbBuried: {
    opacity: 0.5,
  },
  statusOverlay: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  statusDone: {
    backgroundColor: 'rgba(127, 209, 168, 0.18)',
    borderWidth: 1,
    borderColor: colors.success,
  },
  statusDoneText: {
    ...typography.caption,
    color: colors.success,
  },
  statusBuried: {
    backgroundColor: 'rgba(110, 114, 128, 0.25)',
    borderWidth: 1,
    borderColor: colors.junk,
  },
  statusBuriedText: {
    ...typography.caption,
    color: colors.junk,
  },
  info: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginBottom: spacing.xs,
  },
  categoryText: {
    ...typography.caption,
  },
  title: {
    color: colors.text,
    fontWeight: '600',
  },
  reason: {
    color: colors.textMuted,
  },
  textMuted: {
    color: colors.textMuted,
  },
});
