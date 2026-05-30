import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/primary_button';
import { setOnboardingComplete } from '../../services/storage';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../themes/palette';

const SLIDES = [
  { icon: 'code-slash' as const, title: 'Save snippets offline', body: 'Store code on your device. Works without internet.' },
  { icon: 'pricetags' as const, title: 'Tags & languages', body: 'Organize snippets so you can find them fast.' },
  { icon: 'sparkles' as const, title: 'AI explanations', body: 'Get simple explanations for any saved snippet.' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const last = index === SLIDES.length - 1;

  const finish = async () => {
    await setOnboardingComplete();
    router.replace('/auth_screen');
  };

  const next = () => {
    if (last) finish();
    else listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.md }]}>
      <Pressable onPress={finish} style={styles.skip} hitSlop={12}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={56} color={Colors.accent} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <PrimaryButton label={last ? 'Sign in or Sign up' : 'Next'} onPress={next} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  skip: { alignSelf: 'flex-end', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  skipText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  iconWrap: {
    width: 120, height: 120, borderRadius: Radius.circle, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.overlay,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  body: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: Spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.overlay },
  dotActive: { backgroundColor: Colors.accent, width: 20 },
  footer: { paddingHorizontal: Spacing.xl },
});
