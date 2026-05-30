/**
 * AppLogo.tsx  [COMPONENT — Atomic]
 * ─────────────────────────────────────────────────────────
 * Renders the "</>" brand logo with optional purple glow.
 * Fully stateless — driven by props only.
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight } from '../themes/palette';

// ─── Props ────────────────────────────────────────────────
interface AppLogoProps {
  /** Size of the logo glyph in px. Defaults to FontSize.logo (56) */
  size?: number;
  /** Color of the logo glyph. Defaults to Colors.green */
  color?: string;
  /** Whether to show a soft glow beneath the logo */
  showGlow?: boolean;
}

// ─── Component ────────────────────────────────────────────
const AppLogo: React.FC<AppLogoProps> = ({
  size    = FontSize.logo,
  color   = Colors.green,
  showGlow = true,
}) => {
  return (
    <View style={styles.wrapper}>
      {showGlow && (
        <View
          style={[
            styles.glow,
            { width: size * 1.6, height: size * 1.6, borderRadius: size, backgroundColor: `${color}18` },
          ]}
        />
      )}
      <Text style={[styles.logo, { fontSize: size, color }]}>
        {'</>'}
      </Text>
    </View>
  );
};

export default AppLogo;

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  logo: {
    fontWeight:  FontWeight.bold,
    fontFamily:  'monospace',
    letterSpacing: 2,
  },
});
