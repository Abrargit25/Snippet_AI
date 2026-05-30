import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { useAppTheme } from '../../themes/AppThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

export default function DrawerLayout() {
  const { colors } = useAppTheme();

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: colors.surface,
          width: 260,
        },
        drawerActiveBackgroundColor: colors.surfaceAlt,
        drawerActiveTintColor: colors.accent,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: {
          fontWeight: '600',
          fontSize: 14,
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Home Dashboard',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="apps-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: 'Developer Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
