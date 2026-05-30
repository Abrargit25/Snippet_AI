/**
 * PinKey.tsx  [COMPONENT — Atomic]
 * ─────────────────────────────────────────────────────────
 * A single PIN keypad key — either a digit (0-9) or the
 * backspace delete key. Press animation via reanimated.
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Colors, FontSize, FontWeight, Radius } from '../themes/palette';

// ─── Props ────────────────────────────────────────────────
type PinKeyValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'del' | '';

interface PinKeyProps {
  value:   PinKeyValue;
  onPress: (value: PinKeyValue) => void;
}

// ─── Component ────────────────────────────────────────────
const PinKey: React.FC<PinKeyProps> = ({ value, onPress }) => {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  const handlePressIn = () => {
    scale.value   = withTiming(0.88, { duration: 60 });
    opacity.value = withTiming(0.75, { duration: 60 });
  };

  const handlePressOut = () => {
    scale.value   = withTiming(1, { duration: 100 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  // Empty slot — rendered as invisible spacer
  if (value === '') {
    return <Animated.View style={styles.key} />;
  }

  const isDelete = value === 'del';

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => onPress(value)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.key, styles.keyActive]}
      >
        <Text style={[styles.keyText, isDelete && styles.deleteText]}>
          {isDelete ? '⌫' : value}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export default PinKey;

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  key: {
    width:          76,
    height:         76,
    borderRadius:   Radius.circle,
    alignItems:     'center',
    justifyContent: 'center',
  },
  keyActive: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth:     1,
    borderColor:     Colors.overlay,
  },
  keyText: {
    fontSize:    FontSize.xl,
    fontWeight:  FontWeight.semibold,
    color:       Colors.textPrimary,
    letterSpacing: 0.5,
  },
  deleteText: {
    fontSize:  FontSize.lg,
    color:     Colors.textSecondary,
  },
});
