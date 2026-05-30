/**
 * palette.ts
 * ─────────────────────────────────────────────────────────
 * Single source of truth for all design tokens.
 * Import this file anywhere — NEVER hard-code raw color values.
 * ─────────────────────────────────────────────────────────
 */

// ─── Core Background Layers ───────────────────────────────
export const Colors = {
  // Backgrounds
  bg: '#080A10',   // Deep midnight navy background
  surface: '#11141D',   // Dark card surface
  surfaceAlt: '#1A1E2C',   // Lighter surface inputs
  overlay: '#22283A',   // Borders and dividers

  // Brand / Accent
  accent: '#7C3AED',   // Primary purple accent
  accentLight: '#9B59F5',   // Lighter purple
  accentGlow: 'rgba(124, 58, 237, 0.25)',

  green: '#00E676',   // Online / success
  greenGlow: 'rgba(0, 230, 118, 0.20)',

  red: '#FF453A',   // Error
  amber: '#FF9F0A',   // Warning

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#4E4E54',
  textAccent: '#9B59F5',

  // PIN Dots
  pinFilled: '#7C3AED',
  pinEmpty: '#22283A',

  // Transparent
  transparent: 'transparent',
} as const;

// ─── Typography Scale ──────────────────────────────────────
export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  logo: 56,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
} as const;

// ─── Spacing Scale ─────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ─── Border Radius ─────────────────────────────────────────
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 100,
  circle: 9999,
} as const;

// ─── Shadows ───────────────────────────────────────────────
export const Shadow = {
  accent: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  green: {
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;
