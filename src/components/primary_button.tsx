/**
 * PrimaryButton.tsx  [COMPONENT — Atomic]
 * ─────────────────────────────────────────────────────────
 * Full-width pressable button with two variants:
 *  - 'solid'   → filled purple background
 *  - 'outline' → transparent with purple border
 * Includes subtle scale animation on press.
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../themes/palette';

// ─── Props ────────────────────────────────────────────────
interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────
const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  variant = 'solid',
  loading = false,
  disabled = false,
  style,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withTiming(0.96, { duration: 80 }); };
  const handlePressOut = () => { scale.value = withTiming(1.00, { duration: 120 }); };

  const isSolid = variant === 'solid';

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.base,
          isSolid ? styles.solid : styles.outline,
          (disabled || loading) && styles.disabled,
          isSolid && Shadow.accent,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={isSolid ? Colors.textPrimary : Colors.accent} />
        ) : (
          <Text style={[styles.label, !isSolid && styles.labelOutline]}>
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default PrimaryButton;

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  solid: {
    backgroundColor: Colors.accent,
  },
  outline: {
    backgroundColor: Colors.transparent,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  labelOutline: {
    color: Colors.accentLight,
  },
});
