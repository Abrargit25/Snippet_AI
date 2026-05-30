/**
 * splash_screen.tsx  [WIDGET — Composed]
 * ─────────────────────────────────────────────────────────
 * Animated brand block for the Splash Screen.
 * Composes AppLogo + BrandTagline with a coordinated
 * fade-in + scale-up entrance animation on mount.
 * ─────────────────────────────────────────────────────────
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import AppLogo from '../components/app_logo';
import BrandTagline from '../components/brand_tagline';
import { Spacing } from '../themes/palette';

// ─── Props ────────────────────────────────────────────────
interface SplashScreenWidgetProps {
  title?:    string;
  subtitle?: string;
}

// ─── Component ────────────────────────────────────────────
const SplashScreenWidget: React.FC<SplashScreenWidgetProps> = ({
  title,
  subtitle,
}) => {
  const logoOpacity    = useSharedValue(0);
  const logoScale      = useSharedValue(0.6);
  const taglineOpacity = useSharedValue(0);
  const taglineY       = useSharedValue(16);

  useEffect(() => {
    // Logo enters first
    logoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.exp) });
    logoScale.value   = withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.5)) });

    // Tagline slides up after logo is visible
    taglineOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    taglineY.value       = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.exp) }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity:   logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity:   taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={logoStyle}>
        <AppLogo size={64} showGlow />
      </Animated.View>

      <Animated.View style={taglineStyle}>
        <BrandTagline title={title} subtitle={subtitle} align="center" />
      </Animated.View>
    </View>
  );
};

export default SplashScreenWidget;

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap:        Spacing.lg,
  },
});
