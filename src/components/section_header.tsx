/**
 * section_header.tsx [COMPONENT]
 * ─────────────────────────────────────────────────────────
 * Reusable section header with a title and optional action button.
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FontSize, FontWeight, Spacing } from '../themes/palette';
import { useAppTheme } from '../themes/AppThemeContext';

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, actionLabel, onActionPress }) => {
  const { colors } = useAppTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {actionLabel && (
        <Pressable onPress={onActionPress} hitSlop={8}>
          <Text style={[styles.actionText, { color: colors.accent }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default SectionHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
