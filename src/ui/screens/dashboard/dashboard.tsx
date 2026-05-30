import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import StatsCard, { StatsCardProps } from '../../../components/stats_card';
import QuickActionsWidget from '../../../widgets/quick_actions';
import SnippetCard from '../../../components/snippet_card';
import SectionHeader from '../../../components/section_header';
import { FontSize, FontWeight, Spacing, Radius } from '../../../themes/palette';
import { listSnippets, toggleFavorite } from '../../../database/snippet_repo';
import type { SnippetListItem } from '../../../models/snippetTypes';
import { getSessionEmail } from '../../../services/storage';
import { useAppTheme } from '../../../themes/AppThemeContext';

function sparkline(items: SnippetListItem[]): number[] {
  const bins = [0, 0, 0, 0, 0, 0, 0];
  const now = Date.now();
  items.forEach((s) => {
    const day = Math.floor((now - new Date(s.createdAt).getTime()) / 86400000);
    if (day >= 0 && day < 7) bins[6 - day]++;
  });
  const max = Math.max(...bins, 1);
  return bins.map((n) => n / max);
}

function buildStats(items: SnippetListItem[]): StatsCardProps[] {
  const line = sparkline(items);
  const langs = new Set(items.map((i) => i.languageFull)).size;
  const tags = new Set(items.flatMap((i) => i.tags)).size;
  const favs = items.filter((i) => i.isFavorited).length;
  return [
    { icon: 'code-slash', count: items.length, label: 'Snippets', accentColor: '#7C3AED', graphType: 'bar', sparklineData: line },
    { icon: 'heart', count: favs, label: 'Favorites', accentColor: '#FF453A', graphType: 'wave', sparklineData: line },
    { icon: 'terminal', count: langs, label: 'Languages', accentColor: '#0A84FF', graphType: 'dot', sparklineData: line },
    { icon: 'pricetags', count: tags, label: 'Tags', accentColor: '#00E676', graphType: 'area', sparklineData: line },
  ];
}

function FavoriteCard({ item, onPress, themeColors }: { item: SnippetListItem; onPress: () => void; themeColors: any }) {
  const subtitle = item.tags[0] ?? item.codeContent.split('\n')[0]?.slice(0, 24) ?? '';
  
  const getLanguageStyle = (lang: string) => {
    switch (lang.toUpperCase()) {
      case 'JS':
      case 'JAVASCRIPT': return { bg: '#E5C158', text: '#000000', label: 'JS' };
      case 'TS':
      case 'TYPESCRIPT': return { bg: '#0A84FF', text: '#FFFFFF', label: 'TS' };
      case 'SQL': return { bg: '#30D158', text: '#FFFFFF', label: 'SQL' };
      default:
        return { bg: themeColors.surfaceAlt, text: themeColors.textSecondary, label: lang.toUpperCase().slice(0, 3) };
    }
  };

  const { bg, text, label } = getLanguageStyle(item.language);

  return (
    <Pressable style={[styles.favCard, { backgroundColor: themeColors.surface, borderColor: themeColors.overlay }]} onPress={onPress}>
      <View style={styles.favCardHeader}>
        <View style={[styles.favLangBadge, { backgroundColor: bg }]}>
          <Text style={[styles.favLangText, { color: text }]}>{label}</Text>
        </View>
        <Ionicons name="star" size={16} color="#FFD60A" />
      </View>
      <Text style={[styles.favTitle, { color: themeColors.textSecondary }]} numberOfLines={1}>{item.title}</Text>
      <Text style={[styles.favSubtitle, { color: themeColors.textPrimary }]} numberOfLines={1}>{subtitle}</Text>
    </Pressable>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Dashboard() {
  const router = useRouter();
  const { colors, fontSize } = useAppTheme();
  
  const [items, setItems] = useState<SnippetListItem[]>([]);
  const [userName, setUserName] = useState('Developer');

  const reload = useCallback(() => {
    listSnippets().then(setItems);
    getSessionEmail().then((e) => { if (e) setUserName(e.split('@')[0]); });
  }, []);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const stats = useMemo(() => buildStats(items), [items]);
  const recent = items.slice(0, 3);
  const favorites = items.filter((i) => i.isFavorited);

  const onStar = async (id: string, fav: boolean) => {
    await toggleFavorite(Number(id), !fav);
    reload();
  };

  const quickActions = [
    { icon: 'document-text', label: 'New Snippet', bgColor: '#7C3AED', onPress: () => router.push('/snippet/create') },
    { icon: 'code-slash', label: 'All Snippets', bgColor: '#0A84FF', onPress: () => router.push('/snippets' as any) },
    { icon: 'folder', label: 'Files', bgColor: '#30D158', onPress: () => router.push('/files' as any) },
    { icon: 'sparkles', label: 'AI Explain', bgColor: '#FF9F0A', onPress: () => router.push('/snippet/ai-explain-pick') },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.greetingContainer}>
        <Text style={[styles.greetingText, { color: colors.textPrimary }]}>
          👋 {greeting()}, <Text style={{ color: colors.textPrimary }}>{userName}</Text>
        </Text>
        <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
          {items.length === 0 ? 'No snippets yet — tap + on Snippets to add one.' : `${items.length} snippets stored locally.`}
        </Text>
      </View>

      <View style={styles.gridContainer}>
        {stats.map((card, i) => (
          <StatsCard key={i} {...card} style={styles.gridCard} />
        ))}
      </View>

      <View style={styles.section}>
        <QuickActionsWidget actions={quickActions} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recent Snippets" actionLabel="View all" onActionPress={() => router.push('/snippets' as any)} />
        <View style={styles.recentList}>
          {recent.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>No recent snippets</Text>
          ) : (
            recent.map((s) => (
              <SnippetCard
                key={s.id}
                {...s}
                onPress={() => router.push(`/snippet/${s.id}`)}
                onStarPress={() => onStar(s.id, s.isFavorited)}
                onMorePress={() => router.push({ pathname: '/snippet/create', params: { initialData: JSON.stringify({ id: s.id, title: s.title, language: s.languageFull, codeContent: s.codeContent, tags: s.tags, isFavorited: s.isFavorited, imageUri: s.imageUri }), isEdit: 'true' } })}
              />
            ))
          )}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Favorite Snippets" actionLabel="View all" onActionPress={() => router.push('/snippets' as any)} />
        {favorites.length === 0 ? (
          <Text style={[styles.empty, styles.recentList, { color: colors.textMuted }]}>No favorites yet — star a snippet to add it here.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favScrollContent}>
            {favorites.map((item) => (
              <FavoriteCard key={item.id} item={item} onPress={() => router.push(`/snippet/${item.id}`)} themeColors={colors} />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 16, gap: 16 },
  greetingContainer: { gap: 4, paddingHorizontal: 16 },
  greetingText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  greetingSub: { fontSize: FontSize.sm },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, rowGap: 12 },
  gridCard: { width: '48%' },
  section: { paddingHorizontal: 0 },
  recentList: { paddingHorizontal: 16, gap: 8 },
  empty: { fontSize: FontSize.sm, paddingVertical: Spacing.md },
  favScrollContent: { paddingHorizontal: 16, gap: 12 },
  favCard: {
    width: 140, borderWidth: 1,
    borderRadius: Radius.lg, padding: 12, gap: 6,
  },
  favCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  favLangBadge: { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  favLangText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  favTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  favSubtitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
