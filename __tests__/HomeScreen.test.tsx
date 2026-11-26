/**
 * Smoke test: Library (home) screen renders without crashing.
 *
 * Validates the Library screen renders with the demo shot grid,
 * header, and at least one ShotCard from the demo data.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

// Mock expo-router so the component doesn't need a full router context.
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

// expo-splash-screen is a no-op in tests.
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// react-native-safe-area-context needs a provider — supply a lightweight mock.
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

import LibraryScreen from '@/src/app/(tabs)/index';
import { labels } from '@/src/theme/tokens';
import { DEMO_SHOTS } from '@/src/features/library/demoShots';

describe('LibraryScreen (home)', () => {
  it('renders without crashing', async () => {
    await expect(render(<LibraryScreen />)).resolves.toBeDefined();
  });

  it('shows the Library section header', async () => {
    const { getByText } = await render(<LibraryScreen />);
    expect(getByText(labels.library)).toBeTruthy();
  });

  it('shows the demo shot count in the header meta', async () => {
    const { getByText } = await render(<LibraryScreen />);
    expect(getByText(`${DEMO_SHOTS.length} shots · demo`)).toBeTruthy();
  });

  it('renders at least one ShotCard title from demo data', async () => {
    const { getByText } = await render(<LibraryScreen />);
    // The first shot in demoShots has title 'Sitewide 50% sale'
    expect(getByText('Sitewide 50% sale')).toBeTruthy();
  });
});
