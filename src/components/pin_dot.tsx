/**
 * PinDot.tsx  [COMPONENT — Atomic]
 * ─────────────────────────────────────────────────────────
 * A single PIN circle indicator. Shows filled (entered)
 * or empty (awaiting) state.
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Shadow } from '../themes/palette';

// ─── Props ────────────────────────────────────────────────
interface PinDotProps {
  /** Whether this position has been filled by the user */
  filled: boolean;
  /** Optional size override. Defaults to 16 */
  size?: number;
}

// ─── Component ────────────────────────────────────────────
const PinDot: React.FC<PinDotProps> = ({ filled, size = 16 }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(filled ? 1.15 : 1, { damping: 10, stiffness: 200 }) }],
    backgroundColor: filled ? Colors.pinFilled : Colors.pinEmpty,
    ...( filled ? Shadow.accent : {} ),
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
      ]}
    />
  );
};

export default PinDot;

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  dot: {
    borderWidth: 1.5,
    borderColor: Colors.overlay,
  },
});
