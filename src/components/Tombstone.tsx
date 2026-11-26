import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/src/components/ThemedText';
import { colors, radii, spacing } from '@/src/theme/tokens';

interface TombstoneProps {
  /** Width in px; height is ~1.2× width. Default 96. */
  size?: number;
  /** Epitaph engraved under the arch. */
  epitaph?: string;
}

/**
 * Vector-free tombstone mark: an arched stone (rounded top) with a
 * moss sprig, drawn with plain Views so it runs on iOS, Android and
 * web with zero extra dependencies (NFR-3).
 */
export function Tombstone({ size = 96, epitaph }: TombstoneProps) {
  const width = size;
  const height = Math.round(size * 1.2);
  const archRadius = width / 2;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.stone,
          {
            width,
            height,
            borderTopLeftRadius: archRadius,
            borderTopRightRadius: archRadius,
          },
        ]}
      >
        <View style={styles.engravingColumn}>
          <View style={[styles.engraving, { width: width * 0.5 }]} />
          <View style={[styles.engraving, { width: width * 0.38, height: 2 }]} />
          <View style={[styles.engraving, { width: width * 0.42, height: 2 }]} />
        </View>
        <View
          style={[
            styles.moss,
            { width: width * 0.14, height: width * 0.14, left: width * 0.04 },
          ]}
        />
      </View>
      <View style={[styles.ground, { width: width * 1.5 }]} />
      {epitaph ? (
        <ThemedText type="caption" style={styles.epitaph}>
          {epitaph}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stone: {
    backgroundColor: colors.stone,
    justifyContent: 'center',
    alignItems: 'center',
  },
  engravingColumn: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  engraving: {
    height: 3,
    borderRadius: radii.pill,
    backgroundColor: '#3A3E47',
  },
  moss: {
    position: 'absolute',
    bottom: '10%',
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  ground: {
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    marginTop: -2,
  },
  epitaph: {
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
});
