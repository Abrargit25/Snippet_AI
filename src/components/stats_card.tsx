/**
 * stats_card.tsx  [COMPONENT — Atomic]
 * ─────────────────────────────────────────────────────────
 * Individual metric card showing a count + label + icon.
 * Supports 4 distinct mini-graph types per card:
 *   • 'bar'  — vertical bar sparkline (Snippets)
 *   • 'wave' — connected dot wave line (Favorites)
 *   • 'dot'  — scatter dot plot (Languages)
 *   • 'area' — filled trapezoid area chart (Files)
 * ─────────────────────────────────────────────────────────
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  FontSize,
  FontWeight,
  Radius,
  Shadow,
  Spacing,
} from '../themes/palette';
import { useAppTheme } from '../themes/AppThemeContext';

// ─── Types ────────────────────────────────────────────────
export type GraphType = 'bar' | 'wave' | 'dot' | 'area';

export interface StatsCardProps {
  icon:          string;
  count:         number;
  label:         string;
  accentColor:   string;
  /** Which mini-graph style to render. Defaults to 'bar'. */
  graphType?:    GraphType;
  /** Height values 0.0–1.0 for the graph (7 points recommended) */
  sparklineData?: number[];
  onPress?:      () => void;
  style?:        any;
}

// ─── Graph: Bar Sparkline ─────────────────────────────────
const BarGraph = ({ data, color }: { data: number[]; color: string }) => (
  <View style={g.row}>
    {data.map((h, i) => (
      <View
        key={i}
        style={[
          g.bar,
          {
            height:          h * GRAPH_H,
            backgroundColor: color,
            opacity:         0.45 + h * 0.55,
          },
        ]}
      />
    ))}
  </View>
);

// ─── Graph: Connected Wave Dot Line ───────────────────────
const WaveGraph = ({ data, color }: { data: number[]; color: string }) => {
  const gap   = 2;
  const diam  = 4;
  const count = data.length;

  return (
    <View style={[g.row, { position: 'relative', gap: 0 }]}>
      {data.map((h, i) => {
        const top   = GRAPH_H - h * GRAPH_H - diam / 2;
        const right = i < count - 1 ? data[i + 1] : null;

        return (
          <View key={i} style={{ width: 14, height: GRAPH_H, position: 'relative' }}>
            {/* Connecting bar to next point */}
            {right !== null && (
              <View
                style={{
                  position:        'absolute',
                  left:            diam,
                  width:           14 - diam + gap,
                  height:          2,
                  top:             top + diam / 2 - 1,
                  backgroundColor: color,
                  opacity:         0.35,
                }}
              />
            )}
            {/* Dot */}
            <View
              style={{
                position:        'absolute',
                top,
                left:            0,
                width:           diam,
                height:          diam,
                borderRadius:    diam / 2,
                backgroundColor: color,
              }}
            />
          </View>
        );
      })}
    </View>
  );
};

// ─── Graph: Scatter Dot Plot ──────────────────────────────
const DotGraph = ({ data, color }: { data: number[]; color: string }) => (
  <View style={[g.row, { alignItems: 'flex-end' }]}>
    {data.map((h, i) => (
      <View key={i} style={{ flex: 1, alignItems: 'center' }}>
        <View
          style={{
            width:           h > 0.6 ? 6 : 4,
            height:          h > 0.6 ? 6 : 4,
            borderRadius:    4,
            backgroundColor: color,
            opacity:         0.4 + h * 0.6,
            marginBottom:    h * (GRAPH_H - 6),
          }}
        />
      </View>
    ))}
  </View>
);

// ─── Graph: Filled Area Chart ─────────────────────────────
const AreaGraph = ({ data, color }: { data: number[]; color: string }) => {
  const slotW = 14;
  return (
    <View style={[g.row, { gap: 0, alignItems: 'flex-end' }]}>
      {data.map((h, i) => {
        const nextH = i < data.length - 1 ? data[i + 1] : h;
        const barH  = h * GRAPH_H;
        const nextBarH = nextH * GRAPH_H;
        const avgH  = (barH + nextBarH) / 2;

        return (
          <View
            key={i}
            style={{
              width:           slotW,
              height:          GRAPH_H,
              justifyContent:  'flex-end',
            }}
          >
            {/* Filled area trapezoid approximation */}
            <View
              style={{
                width:           '100%',
                height:          avgH,
                backgroundColor: color,
                opacity:         0.25 + h * 0.25,
                borderTopLeftRadius:  i === 0 ? 3 : 0,
                borderTopRightRadius: i === data.length - 1 ? 3 : 0,
              }}
            />
            {/* Top ridge line */}
            <View
              style={{
                position:        'absolute',
                bottom:          avgH - 2,
                width:           '100%',
                height:          2,
                backgroundColor: color,
                opacity:         0.85,
                borderRadius:    1,
              }}
            />
          </View>
        );
      })}
    </View>
  );
};

// ─── Graph height constant ────────────────────────────────
const GRAPH_H = 20;

// ─── Graph dispatcher ────────────────────────────────────
const MiniGraph = ({
  type,
  data,
  color,
}: {
  type: GraphType;
  data: number[];
  color: string;
}) => {
  switch (type) {
    case 'wave': return <WaveGraph data={data} color={color} />;
    case 'dot':  return <DotGraph  data={data} color={color} />;
    case 'area': return <AreaGraph data={data} color={color} />;
    default:     return <BarGraph  data={data} color={color} />;
  }
};

// ─── StatsCard Component ──────────────────────────────────
const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  count,
  label,
  accentColor,
  graphType    = 'bar',
  sparklineData,
  onPress,
  style,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn  = () => { scale.value = withTiming(0.94, { duration: 80 }); };
  const handlePressOut = () => { scale.value = withTiming(1.00, { duration: 120 }); };

  const data = sparklineData ?? [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 1.0];

  const { colors } = useAppTheme();

  return (
    <Animated.View style={[animatedStyle, { width: 88 }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.card, Shadow.card, { width: '100%', backgroundColor: colors.surface, borderColor: colors.overlay }]}
      >
        {/* Icon badge */}
        <View style={[styles.iconBadge, { backgroundColor: `${accentColor}22` }]}>
          <Ionicons name={icon as any} size={18} color={accentColor} />
        </View>

        {/* Count */}
        <Text style={[styles.count, { color: colors.textPrimary }]}>
          {count}
        </Text>

        {/* Label */}
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>

        {/* Mini graph – unique type per card */}
        <View style={styles.graphContainer}>
          <MiniGraph type={graphType} data={data} color={accentColor} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default StatsCard;

// ─── Shared Graph Styles ──────────────────────────────────
const g = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    gap:           2,
    flex:          1,
  },
  bar: {
    flex:         1,
    borderRadius: 2,
    minHeight:    3,
  },
});

// ─── Card Styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius:    Radius.lg,
    borderWidth:     1,
    padding:         Spacing.md,
    gap:             Spacing.xs,
  },
  iconBadge: {
    width:          32,
    height:         32,
    borderRadius:   Radius.sm,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing.xs,
  },
  count: {
    fontSize:      FontSize.lg,
    fontWeight:    FontWeight.heavy,
    letterSpacing: -0.5,
  },
  label: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  graphContainer: {
    height:    GRAPH_H,
    marginTop: Spacing.xs,
  },
});
