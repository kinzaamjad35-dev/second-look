import {
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/src/components/ThemedText';
import { ShotCard } from '@/src/features/library/ShotCard';
import { DEMO_SHOTS } from '@/src/features/library/demoShots';
import type { Shot } from '@/src/features/library/types';
import { colors, labels, layout, spacing } from '@/src/theme/tokens';

// Column width drives item width — keep it in sync with ShotCard's CARD_WIDTH.
const NUM_COLUMNS = layout.gridColumns; // 2
const GAP = layout.gridGap; // 12

function ListHeader() {
  return (
    <View style={styles.header}>
      <ThemedText type="heading" style={styles.headerTitle}>
        {labels.library}
      </ThemedText>
      <ThemedText type="caption" style={styles.headerMeta}>
        {DEMO_SHOTS.length} shots · demo
      </ThemedText>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <ThemedText type="body" style={styles.emptyText}>
        No screenshots yet.
      </ThemedText>
      <ThemedText type="small" style={styles.emptyMeta}>
        Grant photo access to start importing.
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
 * Library screen — Task 3: static grid with demo shots.
 * Will switch to real SQLite data in task 8.
 */
export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          data={DEMO_SHOTS}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                // pull-to-refresh stub — wired to real import in task 5
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
