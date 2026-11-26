import { useLocalSearchParams } from 'expo-router';
import { FlatList, ListRenderItem, Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/src/components/ThemedText';
import { ShotCard } from '@/src/features/library/ShotCard';
import { runScanOnce } from '@/src/features/import';
import { useScanState } from '@/src/features/import/useScanState';
import type { Shot } from '@/src/features/library/types';
import { useLibraryShots } from '@/src/features/library/useLibraryShots';
import { useGate } from '@/src/features/privacy/useGate';
import { colors, labels, layout, spacing } from '@/src/theme/tokens';

// Column width drives item width — keep it in sync with ShotCard's CARD_WIDTH.
const NUM_COLUMNS = layout.gridColumns; // 2
const GAP = layout.gridGap; // 12

function ListHeader({
  count,
  isDemo,
  scanning,
}: {
  count: number;
  isDemo: boolean;
  scanning: boolean;
}) {
  const meta = isDemo
    ? `${count} shots · demo`
    : scanning
      ? `${count} shots · raising more from the grave…`
      : `${count} shots`;
  return (
    <View style={styles.header}>
      <ThemedText type="heading" style={styles.headerTitle}>
        {labels.library}
      </ThemedText>
      <ThemedText type="caption" style={styles.headerMeta}>
        {meta}
      </ThemedText>
    </View>
  );
}

function EmptyState({ scanning }: { scanning: boolean }) {
  return (
    <View style={styles.empty}>
      <ThemedText type="body" style={styles.emptyText}>
        {scanning ? 'Looking for your screenshots…' : 'No screenshots yet.'}
      </ThemedText>
      <ThemedText type="small" style={styles.emptyMeta}>
        {scanning
          ? 'This can take a minute the first time.'
          : 'Take a screenshot, then pull down to refresh.'}
      </ThemedText>
    </View>
  );
}

const renderItem: ListRenderItem<Shot> = ({ item, index }) => (
  <View style={[styles.itemWrap, index % NUM_COLUMNS === 0 ? styles.itemFirst : null]}>
    <ShotCard shot={item} />
  </View>
);

const keyExtractor = (item: Shot) => item.id;

/**
 * Library screen. Real imported screenshots (task 5) when photo access is
 * granted; bundled demo shots in Demo mode and on web.
 */
export default function LibraryScreen() {
  const gate = useGate();
  const params = useLocalSearchParams<{ demo?: string }>();
  const isDemo = Platform.OS === 'web' || params.demo === '1' || gate.route !== 'library';
  const { shots } = useLibraryShots(isDemo);
  const scan = useScanState();
  const scanning = !isDemo && scan.running;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={shots}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          ListHeaderComponent={
            <ListHeader count={shots.length} isDemo={isDemo} scanning={scanning} />
          }
          ListEmptyComponent={<EmptyState scanning={scanning} />}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                if (!isDemo) void runScanOnce();
              }}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
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
  },
  listContent: {
    paddingHorizontal: GAP,
    paddingBottom: spacing.xxl,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  itemWrap: {
    flex: 1,
  },
  itemFirst: {
    // no extra style needed; gap handles spacing
  },
  header: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
  },
  headerMeta: {
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
  },
  emptyMeta: {
    color: colors.junk,
  },
});
