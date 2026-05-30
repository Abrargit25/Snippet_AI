/**
 * StatusBadge.tsx  [COMPONENT — Atomic]
 * ─────────────────────────────────────────────────────────
 * Small pill badge with a coloured dot indicator.
 * Used for "Offline Ready", "Online", "Syncing" states.
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { FontSize, FontWeight, Radius, Spacing } from '../themes/palette';
import { useAppTheme } from '../themes/AppThemeContext';

// ─── Props ────────────────────────────────────────────────
interface StatusBadgeProps {
  label: string;
  dotColor?: string;
  style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────
const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  dotColor,
  style,
}) => {
  const { colors } = useAppTheme();
  const defaultDotColor = dotColor ?? colors.green;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.overlay }, style]}>
      <View style={[styles.dot, { backgroundColor: defaultDotColor }]} />
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

export default StatusBadge;

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radius.circle,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
});
