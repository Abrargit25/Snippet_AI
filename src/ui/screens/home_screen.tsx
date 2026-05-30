import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import SafeContainer from '../../widgets/safe_container';
import Dashboard from './dashboard';
import AppBar from '../../components/app_bar';
import { Spacing } from '../../themes/palette';
import { useAppTheme } from '../../themes/AppThemeContext';

export default function HomeScreen() {
  const { colors } = useAppTheme();

  return (
    <SafeContainer edges={['top']} style={[styles.shell, { backgroundColor: colors.bg }]}>
      <AppBar title="DevSnippet" />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Dashboard />
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  scrollArea: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxl },
});
