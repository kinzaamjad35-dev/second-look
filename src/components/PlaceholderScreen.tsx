import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Tombstone } from '@/src/components/Tombstone';
import { ThemedText } from '@/src/components/ThemedText';
import { colors, spacing } from '@/src/theme/tokens';

interface PlaceholderScreenProps {
  title: string;
  note: string;
  epitaph?: string;
}

/** Generic scaffold-level placeholder screen. */
export function PlaceholderScreen({ title, note, epitaph }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Tombstone size={96} epitaph={epitaph} />
        <ThemedText type="heading" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText type="small" style={styles.note}>
          {note}
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
  title: {
    textAlign: 'center',
  },
  note: {
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 360,
  },
});
