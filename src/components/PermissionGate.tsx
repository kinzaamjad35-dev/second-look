/**
 * PermissionGate — presentational component (FR-1.3, FR-1.4).
 *
 * Renders the denied or limited-photos state with:
 *   • calm copy explaining what's needed
 *   • "Open Settings" button (caller performs Linking.openSettings)
 *   • "Try demo" button (caller dispatches CHOOSE_DEMO)
 *
 * This component is purely presentational: it receives handlers and
 * state as props, dispatches nothing itself.
 */
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/src/components/ThemedText';
import { Tombstone } from '@/src/components/Tombstone';
import { colors, radii, spacing } from '@/src/theme/tokens';

// ─── Denied state ─────────────────────────────────────────────────────────────

interface DeniedProps {
  onOpenSettings: () => void;
  onTryDemo: () => void;
}

/**
 * Calm empty state shown when the user has denied photo-library access.
 * Per FR-1.3: "Open Settings" + "Try demo" (no aggressive copy).
 */
export function DeniedPermissionGate({ onOpenSettings, onTryDemo }: DeniedProps) {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Tombstone size={72} epitaph="No access" />

          <ThemedText type="heading" style={styles.heading}>
            Photo access denied
          </ThemedText>

          <ThemedText type="small" style={styles.body}>
            Second Look needs access to your photo library to find your screenshots. You can
            change this at any time in Settings.
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Open Settings"
            accessibilityHint="Opens device Settings so you can grant photo access to Second Look"
          >
            <ThemedText type="label" style={styles.primaryBtnText}>
              Open Settings
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.ghostBtn, pressed && styles.ghostBtnPressed]}
            onPress={onTryDemo}
            accessibilityRole="button"
            accessibilityLabel="Try demo"
            accessibilityHint="Explore Second Look with pre-loaded sample screenshots"
          >
            <ThemedText type="label" style={styles.ghostBtnText}>
              Try demo
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Limited Photos state (iOS FR-1.4) ────────────────────────────────────────

interface LimitedProps {
  /** True when limited access AND the Screenshots album is not reachable (FR-1.4). */
  noAlbum: boolean;
  onOpenSettings: () => void;
  onTryDemo: () => void;
  /** Optional retry handler — resets to idle so the user can re-request. */
  onRetry?: () => void;
}

/**
 * Explanation shown when the user granted Limited Photos access.
 * When `noAlbum` is true (FR-1.4): Screenshots album isn't accessible —
 * copy is stronger, explaining full access is required.
 */
export function LimitedPermissionGate({ noAlbum, onOpenSettings, onTryDemo, onRetry }: LimitedProps) {
  const isIos = Platform.OS === 'ios';

  const bodyText = noAlbum
    ? isIos
      ? "Second Look can't see your Screenshots album with the current access level. Go to Settings → Privacy & Security → Photos → Second Look and choose Full Access."
      : "Second Look has limited access and can't reach your screenshots. Grant full access in Settings."
    : isIos
      ? "You've given Second Look access to only some photos. For full screenshot scanning, choose Full Access in Settings → Privacy & Security → Photos → Second Look."
      : "Second Look has limited photo access. Grant full access in Settings to find all your screenshots.";

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Tombstone size={72} epitaph="Limited" />

          <ThemedText type="heading" style={styles.heading}>
            {noAlbum ? 'Screenshots not accessible' : 'Limited photos access'}
          </ThemedText>

          <ThemedText type="small" style={styles.body}>
            {bodyText}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Open Settings"
            accessibilityHint="Opens device Settings to upgrade photo access to Full"
          >
            <ThemedText type="label" style={styles.primaryBtnText}>
              Open Settings
            </ThemedText>
          </Pressable>

          {onRetry ? (
            <Pressable
              style={({ pressed }) => [styles.ghostBtn, pressed && styles.ghostBtnPressed]}
              onPress={onRetry}
              accessibilityRole="button"
              accessibilityLabel="Try again"
              accessibilityHint="Re-opens the photo permission dialog"
            >
              <ThemedText type="label" style={styles.ghostBtnText}>
                Try again
              </ThemedText>
            </Pressable>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.ghostBtn, pressed && styles.ghostBtnPressed]}
            onPress={onTryDemo}
            accessibilityRole="button"
            accessibilityLabel="Try demo"
            accessibilityHint="Explore Second Look with pre-loaded sample screenshots"
          >
            <ThemedText type="label" style={styles.ghostBtnText}>
              Try demo
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  heading: {
    textAlign: 'center',
    color: colors.text,
  },
  body: {
    textAlign: 'center',
    color: colors.textMuted,
    maxWidth: 340,
  },
  actions: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryBtnPressed: {
    backgroundColor: colors.accentDark,
  },
  primaryBtnText: {
    color: colors.background,
  },
  ghostBtn: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  ghostBtnPressed: {
    backgroundColor: colors.surfaceRaised,
  },
  ghostBtnText: {
    color: colors.textMuted,
  },
});
