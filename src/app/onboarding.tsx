/**
 * Onboarding + photo-permission screen (FR-1).
 *
 * State-machine views:
 *   explainer        → hero + 3 bullet points + "Grant access" + "Try demo"
 *   requesting       → same screen, button shows a spinner
 *   scan             → navigates to Library and starts the import pipeline
 *   denied           → DeniedPermissionGate (calm copy, Open Settings, Try demo)
 *   limited-explanation → LimitedPermissionGate (copy adapts to noAlbum flag)
 *   demo             → navigates to Library in demo mode
 */
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useReducer } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeniedPermissionGate, LimitedPermissionGate } from '@/src/components/PermissionGate';
import { ThemedText } from '@/src/components/ThemedText';
import { Tombstone } from '@/src/components/Tombstone';
import { startScan } from '@/src/features/import';
import {
  INITIAL_PERMISSION_STATE,
  permissionReducer,
  permissionView,
} from '@/src/features/privacy/permissionReducer';
import { requestPhotoPermission } from '@/src/features/privacy/requestPhotoPermission';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

export default function OnboardingScreen() {
  const router = useRouter();
  const [state, dispatch] = useReducer(permissionReducer, INITIAL_PERMISSION_STATE);
  const view = permissionView(state);

  // ── Grant → navigate + kick off scan ──────────────────────────────
  useEffect(() => {
    if (view !== 'scan') return;
    // Task 5 fills in the real pipeline; for now it's a safe no-op.
    const cancel = startScan();
    router.replace('/(tabs)');
    return cancel;
  }, [view, router]);

  // ── Demo → navigate ────────────────────────────────────────────────
  useEffect(() => {
    if (view !== 'demo') return;
    // Pass demo=1 so the Library tab knows to stay in demo mode.
    // Task 23 wires full demo data; for now the tab already shows demo shots.
    router.replace({ pathname: '/(tabs)', params: { demo: '1' } });
  }, [view, router]);

  // ── Handlers ───────────────────────────────────────────────────────
  const handleGrantPress = useCallback(async () => {
    if (state.status !== 'idle') return;
    dispatch({ type: 'REQUEST' });
    try {
      const action = await requestPhotoPermission();
      dispatch(action);
    } catch {
      // Native failure — reset to idle so the user can retry
      dispatch({ type: 'RESET' });
    }
  }, [state.status]);

  const handleOpenSettings = useCallback(() => {
    dispatch({ type: 'OPEN_SETTINGS' });
    Linking.openSettings();
  }, []);

  const handleTryDemo = useCallback(() => {
    dispatch({ type: 'CHOOSE_DEMO' });
  }, []);

  const handleRetry = useCallback(() => {
    dispatch({ type: 'RETRY' });
  }, []);

  // ── Render ─────────────────────────────────────────────────────────
  if (view === 'denied') {
    return (
      <DeniedPermissionGate
        onOpenSettings={handleOpenSettings}
        onTryDemo={handleTryDemo}
      />
    );
  }

  if (view === 'limited-explanation') {
    return (
      <LimitedPermissionGate
        noAlbum={state.limitedNoAlbum}
        onOpenSettings={handleOpenSettings}
        onTryDemo={handleTryDemo}
        onRetry={handleRetry}
      />
    );
  }

  // 'explainer' | 'requesting' | 'scan' | 'demo'
  // scan and demo trigger navigation via useEffect above; show explainer meanwhile.
  const isRequesting = view === 'requesting';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Hero */}
        <View style={styles.hero}>
          <Tombstone size={96} epitaph="R.I.P." />
          <ThemedText type="title" style={styles.appName}>
            Second Look
          </ThemedText>
          <ThemedText type="small" style={styles.tagline}>
            Give your screenshots a second look.
          </ThemedText>
        </View>

        {/* Explainer bullets */}
        <View style={styles.explainer}>
          <ExplainerItem
            emoji="📸"
            heading="Your screenshots, surfaced"
            body="Second Look finds the screenshots already in your phone — event tickets, deals, links, OTPs — and makes them searchable, actionable and time-aware."
          />
          <ExplainerItem
            emoji="🔒"
            heading="Private by design"
            body={
              Platform.OS === 'web'
                ? 'Demo mode is on. On a phone you grant access once and everything stays on-device.'
                : 'Everything stays on your device. With Smart sorting off, nothing ever leaves your phone.'
            }
          />
          <ExplainerItem
            emoji="⏰"
            heading="Rising soon"
            body="Deals expiring tomorrow, an event next week — Second Look reminds you before it's too late."
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={handleGrantPress}
            disabled={isRequesting}
            accessibilityRole="button"
            accessibilityLabel="Grant photo access"
            accessibilityHint="Opens the system permission dialog so Second Look can find your screenshots"
          >
            {isRequesting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <ThemedText type="label" style={styles.primaryBtnText}>
                Grant access
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.ghostBtn, pressed && styles.ghostBtnPressed]}
            onPress={handleTryDemo}
            accessibilityRole="button"
            accessibilityLabel="Try demo"
            accessibilityHint="Explore Second Look with pre-loaded sample screenshots, no permission needed"
          >
            <ThemedText type="label" style={styles.ghostBtnText}>
              Try demo
            </ThemedText>
          </Pressable>

          <ThemedText type="caption" style={styles.permNote}>
            Photo access is used only to find your screenshots. Originals stay in your camera
            roll.
          </ThemedText>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Explainer item ────────────────────────────────────────────────────────────

function ExplainerItem({
  emoji,
  heading,
  body,
}: {
  emoji: string;
  heading: string;
  body: string;
}) {
  return (
    <View style={styles.explainerItem}>
      <ThemedText type="body" style={styles.explainerEmoji}>
        {emoji}
      </ThemedText>
      <View style={styles.explainerText}>
        <ThemedText type="label" style={styles.explainerHeading}>
          {heading}
        </ThemedText>
        <ThemedText type="small" style={styles.explainerBody}>
          {body}
        </ThemedText>
      </View>
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
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  appName: {
    color: colors.text,
    textAlign: 'center',
  },
  tagline: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  explainer: {
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  explainerItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  explainerEmoji: {
    fontSize: 24,
    lineHeight: 30,
    minWidth: 32,
    textAlign: 'center',
  },
  explainerText: {
    flex: 1,
    gap: spacing.xs,
  },
  explainerHeading: {
    color: colors.text,
  },
  explainerBody: {
    color: colors.textMuted,
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
    ...typography.label,
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
  permNote: {
    color: colors.junk,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
