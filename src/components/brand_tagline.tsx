/**
 * BrandTagline.tsx  [COMPONENT — Atomic]
 * ─────────────────────────────────────────────────────────
 * Renders the app title + optional version/subtitle line.
 * Fully stateless — driven by props only.
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Spacing } from '../themes/palette';

// ─── Props ────────────────────────────────────────────────
interface BrandTaglineProps {
  /** Main app title text */
  title?: string;
  /** Small version / subtitle below the title */
  subtitle?: string;
  /** Horizontal text alignment */
  align?: 'center' | 'left';
}

// ─── Component ────────────────────────────────────────────
const BrandTagline: React.FC<BrandTaglineProps> = ({
  title = 'DevSnippets AI',
  subtitle = 'v1.0.0 · Offline Mode',
  align = 'center',
}) => {
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.title, { textAlign: align }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { textAlign: align }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
};

export default BrandTagline;

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
});
