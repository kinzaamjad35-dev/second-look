import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, labels } from '@/src/theme/tokens';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  name: IoniconsName;
  focused: boolean;
}

function TabIcon({ name, focused }: TabIconProps) {
  return (
    <Ionicons
      name={name}
      size={24}
      color={focused ? colors.accent : colors.textMuted}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', color: colors.text },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: labels.library,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rising-soon"
        options={{
          title: labels.risingSoon,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'hourglass' : 'hourglass-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: labels.search,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: labels.ask,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="buried"
        options={{
          title: labels.buried,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'archive' : 'archive-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
