/**
 * PinPadWidget.tsx  [WIDGET — Composed]
 * ─────────────────────────────────────────────────────────
 * Full PIN entry UI block:
 *   • 4 animated PinDot indicators (top)
 *   • 3x4 keypad grid using PinKey (bottom)
 *   • Shake animation on wrong PIN (via reanimated)
 *   • Calls onComplete(pin) when 4 digits are entered
 *   • Calls onError() if wrong PIN is submitted
 * ─────────────────────────────────────────────────────────
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import PinDot from '../components/pin_dot';
import PinKey from '../components/pin_key';
import { Spacing } from '../themes/palette';

// ─── Types ────────────────────────────────────────────────
type KeyValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'del' | '';

// ─── Keypad Layout (3 columns × 4 rows) ───────────────────
const KEYS: KeyValue[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['',  '0', 'del'],
];

const PIN_LENGTH = 4;

// ─── Props ────────────────────────────────────────────────
interface PinPadWidgetProps {
  /** Called with the full 4-digit PIN string when complete */
  onComplete: (pin: string) => void;
  /** Optional: called after a shake animation to signal a bad attempt */
  onError?: () => void;
}

// ─── Component ────────────────────────────────────────────
const PinPadWidget: React.FC<PinPadWidgetProps> = ({ onComplete, onError }) => {
  const [pin, setPin] = useState<string>('');

  // Shake animation value for dots row
  const shakeX = useSharedValue(0);
  const dotsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // ── Shake trigger (call on wrong PIN externally) ──────
  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming( 10, { duration: 60 }),
      withTiming( -8, { duration: 60 }),
      withTiming(  8, { duration: 60 }),
      withTiming(  0, { duration: 60 }),
    );
    onError?.();
  }, [onError]);

  // ── Key press handler ─────────────────────────────────
  const handleKeyPress = useCallback((value: KeyValue) => {
    if (value === '' ) return;

    if (value === 'del') {
      setPin(prev => prev.slice(0, -1));
      return;
    }

    setPin(prev => {
      const next = prev + value;
      if (next.length === PIN_LENGTH) {
        // Slight delay so last dot fills before callback fires
        setTimeout(() => onComplete(next), 120);
      }
      return next.length <= PIN_LENGTH ? next : prev;
    });
  }, [onComplete]);

  return (
    <View style={styles.wrapper}>
      {/* ── PIN Dots Row ── */}
      <Animated.View style={[styles.dotsRow, dotsStyle]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <PinDot key={i} filled={i < pin.length} size={18} />
        ))}
      </Animated.View>

      {/* ── Keypad Grid ── */}
      <View style={styles.keypad}>
        {KEYS.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.keyRow}>
            {row.map((key, colIdx) => (
              <PinKey
                key={`${rowIdx}-${colIdx}`}
                value={key}
                onPress={handleKeyPress}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default PinPadWidget;

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap:        Spacing.xxxl,
  },
  dotsRow: {
    flexDirection: 'row',
    gap:           Spacing.xl,
    alignItems:    'center',
  },
  keypad: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  keyRow: {
    flexDirection: 'row',
    gap:           Spacing.lg,
  },
});
