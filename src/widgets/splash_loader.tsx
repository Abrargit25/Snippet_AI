/**
 * SplashLoader.tsx  [WIDGET — Composed]
 * ─────────────────────────────────────────────────────────
 * Animated spinner + status message block shown at the
 * bottom of the splash screen during app initialization.
 * Fades in on mount via reanimated.
 * ─────────────────────────────────────────────────────────
 */
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, FontSize, FontWeight, Spacing } from '../themes/palette';

// ─── Props ────────────────────────────────────────────────
interface SplashLoaderProps {
  /** Status message shown beneath the spinner */
  message: string;
}

// ─── Component ────────────────────────────────────────────
const SplashLoader: React.FC<SplashLoaderProps> = ({ message }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  // Fade + slide up on mount
  useEffect(() => {
    opacity.value    = withTiming(1, { duration: 600, easing: Easing.out(Easing.exp) });
    translateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.exp) });
  }, []);

  // Re-animate message text whenever it changes
  const msgOpacity = useSharedValue(1);
  useEffect(() => {
    msgOpacity.value = withTiming(0, { duration: 150 }, () => {
      msgOpacity.value = withTiming(1, { duration: 300 });
    });
  }, [message]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const msgStyle = useAnimatedStyle(() => ({
    opacity: msgOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <ActivityIndicator size="small" color={Colors.accent} />
      <Animated.Text style={[styles.message, msgStyle]}>
        {message}
      </Animated.Text>
    </Animated.View>
  );
};

export default SplashLoader;

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap:        Spacing.md,
    paddingBottom: Spacing.xl,
  },
  message: {
    fontSize:    FontSize.sm,
    fontWeight:  FontWeight.medium,
    color:       Colors.textSecondary,
    textAlign:   'center',
    letterSpacing: 0.2,
  },
});
