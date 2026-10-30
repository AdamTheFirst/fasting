import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../components/Icon';
import { useStore } from '../../state/store';
import { type IconName } from '../../components/Icon';
import { radius, useColors } from '../../theme';

export default function TabsLayout() {
  const c = useColors();
  const { running } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.bg,
          borderTopColor: c.border,
          height: 64 + insets.bottom,
          paddingTop: 6,
        },
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: running ? 'Fasting' : 'Fast',
          tabBarIcon: ({ focused }) => <TabIcon name="fast" focused={focused} />,
          tabBarBadge: running ? '' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: c.period,
            minWidth: 8,
            maxHeight: 8,
            borderRadius: 4,
            top: 2,
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => <TabIcon name="history" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

/** Periodiary's active tab: the icon sits in a pastel pill. */
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const c = useColors();
  return (
    <View
      style={{
        width: 56,
        height: 30,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? c.accent : 'transparent',
      }}
    >
      <Icon name={name} color={focused ? c.onAccent : c.textMuted} size={22} />
    </View>
  );
}
