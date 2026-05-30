/**
 * quick_actions.tsx [WIDGET]
 * ─────────────────────────────────────────────────────────
 * A fixed row of high-fidelity quick action buttons for the home screen.
 * Exactly matches the reference design:
 *   • Fixed layout (no scrolling) using evenly spaced flex items.
 *   • Rounded colored squares with custom white vector symbols.
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, FontWeight, Spacing, Radius } from '../themes/palette';
import SectionHeader from '../components/section_header';
import { useAppTheme } from '../themes/AppThemeContext';

interface QuickActionProps {
  icon: string;
  label: string;
  bgColor: string;
  onPress: () => void;
}

const QuickActionButton: React.FC<QuickActionProps> = ({ icon, label, bgColor, onPress }) => {
  const { colors } = useAppTheme();
  return (
    <Pressable style={styles.actionButton} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={22} color="#FFFFFF" />
      </View>
      <Text style={[styles.actionLabel, { color: colors.textSecondary }]} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
};

export interface QuickActionsWidgetProps {
  actions: QuickActionProps[];
}

const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({ actions }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <View style={styles.container}>
      <SectionHeader title="Quick Actions" />
      <View style={styles.actionsRow}>
        {actions.map((action, index) => (
          <QuickActionButton
            key={index}
            {...action}
          />
        ))}
      </View>
    </View>
  );
};

export default QuickActionsWidget;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  actionButton: {
    alignItems: 'center',
    gap: Spacing.sm,
    width: 64, // Sleek bounds for equal column alignment
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg, // Matches reference design square radius
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
    marginTop: 2,
  },
});
