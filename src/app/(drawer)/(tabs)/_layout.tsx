/**
 * (tabs)/_layout.tsx  [LAYOUT — Bottom Tab Navigator]
 * ─────────────────────────────────────────────────────────
 * Defines the 5-tab bottom navigation shell.
 * Tab screens: Home, Snippets, Favorites, Files, Settings
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../themes/AppThemeContext';

// ── Real vector icon helper (switches to outline state when unfocused)
const TabIcon = ({ name, focused, activeColor, inactiveColor }: { name: any; focused: boolean; activeColor: string; inactiveColor: string }) => (
  <Ionicons
    name={focused ? name : `${name}-outline`}
    size={22}
    color={focused ? activeColor : inactiveColor}
  />
);

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown:     false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor:  colors.overlay,
          borderTopWidth:  1,
          height:          56 + insets.bottom,
          paddingBottom:   insets.bottom + 6,
        },
        tabBarActiveTintColor:   colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:    'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} activeColor={colors.accent} inactiveColor={colors.textMuted} />,
        }}
      />
      <Tabs.Screen
        name="snippets"
        options={{
          title:    'Snippets',
          tabBarIcon: ({ focused }) => <TabIcon name="code-slash" focused={focused} activeColor={colors.accent} inactiveColor={colors.textMuted} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title:    'Favorites',
          tabBarIcon: ({ focused }) => <TabIcon name="heart" focused={focused} activeColor={colors.accent} inactiveColor={colors.textMuted} />,
        }}
      />
      <Tabs.Screen
        name="files"
        options={{
          title:    'Files',
          tabBarIcon: ({ focused }) => <TabIcon name="folder" focused={focused} activeColor={colors.accent} inactiveColor={colors.textMuted} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title:    'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} activeColor={colors.accent} inactiveColor={colors.textMuted} />,
        }}
      />
    </Tabs>
  );
}
