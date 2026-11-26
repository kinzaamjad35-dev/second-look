import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Tombstone } from '@/src/components/Tombstone';
import { ThemedText } from '@/src/components/ThemedText';
import { colors, labels, spacing } from '@/src/theme/tokens';

/**
 * Library screen — Phase 1 scaffold.
 * Will be replaced with real SQLite grid in task 3 / 8.
 */
export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Tombstone size={80} />
        <ThemedText type="title" style={styles.appName}>
          {labels.appName}
        </ThemedText>
        <ThemedText type="small" style={styles.tagline}>
          {labels.tagline}
        </ThemedText>

        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <ThemedText type="caption" style={styles.pillText}>
              📸 Screenshots
            </ThemedText>
          </View>
          <View style={[styles.pill, styles.pillAccent]}>
            <ThemedText type="caption" style={styles.pillTextAccent}>
              🪦 Buried
            </ThemedText>
          </View>
          <View style={[styles.pill, styles.pillWarning]}>
            <ThemedText type="caption" style={styles.pillTextWarning}>
              ⏳ Rising soon
            </ThemedText>
          </View>
        </View>

        <ThemedText type="caption" style={styles.scaffoldNote}>
          Scaffold — real screenshot grid in Task 3
        </ThemedText>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  appName: {
    color: colors.text,
    textAlign: 'center',
  },
  tagline: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    color: colors.text,
  },
  pillAccent: {
    borderColor: colors.accent,
    backgroundColor: 'transparent',
  },
  pillTextAccent: {
    color: colors.accent,
  },
  pillWarning: {
    borderColor: colors.warning,
    backgroundColor: 'transparent',
  },
  pillTextWarning: {
    color: colors.warning,
  },
  scaffoldNote: {
    color: colors.junk,
    marginTop: spacing.xl,
  },
});
