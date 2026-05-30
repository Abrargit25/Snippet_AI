import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider, useAppTheme } from '../themes/AppThemeContext';

function AppNavigator() {
  const { colors } = useAppTheme();
  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.bg },
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.textPrimary,
      headerTitleStyle: { fontWeight: '600' },
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth_screen" />
      <Stack.Screen name="(drawer)" />
      <Stack.Screen name="settings/ai-providers" options={{ headerShown: true, title: 'AI Providers' }} />
      <Stack.Screen name="settings/ai-provider-edit" options={{ headerShown: true, title: 'AI Provider' }} />
      <Stack.Screen
        name="snippet/create"
        options={{ presentation: 'modal', headerShown: true, title: 'New Snippet' }}
      />
      <Stack.Screen name="snippet/[id]" options={{ headerShown: true, title: 'Code Viewer' }} />
      <Stack.Screen name="snippet/ai-insight" options={{ headerShown: true, title: 'AI Insights' }} />
      <Stack.Screen name="snippet/ai-explain-pick" options={{ headerShown: true, title: 'AI Explain' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AppNavigator />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
