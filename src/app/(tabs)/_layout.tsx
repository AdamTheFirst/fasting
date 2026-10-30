import { Tabs } from 'expo-router';

import { Icon } from '../../components/Icon';
import { useStore } from '../../state/store';
import { useColors } from '../../theme';

export default function TabsLayout() {
  const c = useColors();
  const { running } = useStore();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border },
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: running ? 'Fasting' : 'Fast',
          tabBarIcon: ({ color }) => <Icon name="fast" color={String(color)} size={24} />,
          tabBarBadge: running ? '' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: c.milestone,
            minWidth: 8,
            maxHeight: 8,
            borderRadius: 4,
            top: 4,
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <Icon name="history" color={String(color)} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Icon name="settings" color={String(color)} size={24} />,
        }}
      />
    </Tabs>
  );
}
