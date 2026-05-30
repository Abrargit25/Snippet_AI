import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../widgets/safe_container';
import { useAppTheme } from '../../themes/AppThemeContext';
import { listSnippets } from '../../database/snippet_repo';
import type { SnippetListItem } from '../../models/snippetTypes';
import { FontSize, FontWeight, Spacing, Radius } from '../../themes/palette';

// ── Language badge colours ────────────────────────────────────────────────────

const LANG_DOT: Record<string, string> = {
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Python:     '#3776AB',
  SQL:        '#336791',
  Dart:       '#00B4D8',
  Go:         '#00ADD8',
  Java:       '#ED8B00',
  'C#':       '#512BD4',
  PHP:        '#8892BF',
  Ruby:       '#CC342D',
};

function langColor(lang: string): string {
  return LANG_DOT[lang] ?? '#7C3AED';
}

// ── Snippet row ───────────────────────────────────────────────────────────────

function SnippetRow({
  item,
  onPress,
}: {
  item: SnippetListItem;
  onPress: () => void;
}) {
  const { colors, fontSize } = useAppTheme();
  const dot = langColor(item.languageFull);
  const hasInsight = !!item.aiExplanation;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          borderColor: colors.overlay,
        },
      ]}
      onPress={onPress}
    >
      {/* Left accent bar */}
      <View style={[styles.langBar, { backgroundColor: dot }]} />

      <View style={{ flex: 1, gap: 3 }}>
        <Text
          style={[styles.rowTitle, { color: colors.textPrimary, fontSize: fontSize.base }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={[styles.rowLang, { color: dot, fontSize: fontSize.xs }]}>
            {item.languageFull}
          </Text>
          {item.tags.length > 0 && (
            <Text style={[styles.rowTag, { color: colors.textMuted, fontSize: fontSize.xs }]}>
              · #{item.tags[0]}
            </Text>
          )}
          <Text style={[{ color: colors.textMuted, fontSize: fontSize.xs }]}>
            · {item.timeAgo}
          </Text>
        </View>
      </View>

      {/* Status pill */}
      <View
        style={[
          styles.statusPill,
          {
            backgroundColor: hasInsight
              ? 'rgba(0,230,118,0.12)'
              : 'rgba(124,58,237,0.12)',
            borderColor: hasInsight
              ? 'rgba(0,230,118,0.25)'
              : 'rgba(124,58,237,0.25)',
          },
        ]}
      >
        <Ionicons
          name={hasInsight ? 'checkmark-circle' : 'sparkles'}
          size={13}
          color={hasInsight ? '#00E676' : '#9B59F5'}
        />
        <Text
          style={[
            styles.statusText,
            { color: hasInsight ? '#00E676' : '#9B59F5', fontSize: fontSize.xs },
          ]}
        >
          {hasInsight ? 'Done' : 'Explain'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AiExplainPickScreen() {
  const router = useRouter();
  const { colors, fontSize } = useAppTheme();

  const [items,   setItems]   = useState<SnippetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    listSnippets()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = items.filter((s) => {
    const q = query.toLowerCase();
    return (
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.languageFull.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const analysed  = items.filter((s) => !!s.aiExplanation).length;
  const pending   = items.length - analysed;

  return (
    <SafeContainer edges={['bottom']} style={[styles.screen, { backgroundColor: colors.bg }]}>

      {/* ── Hero header ── */}
      <View style={[styles.hero, { backgroundColor: colors.surface, borderBottomColor: colors.overlay }]}>
        <View style={styles.heroRow}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="sparkles" size={26} color="#9B59F5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary, fontSize: fontSize.lg }]}>
              AI Code Explain
            </Text>
            <Text style={[styles.heroSub, { color: colors.textMuted, fontSize: fontSize.xs }]}>
              Pick a snippet to generate AI insights
            </Text>
          </View>
        </View>

        {/* Stats row */}
        {!loading && items.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statChip, { backgroundColor: 'rgba(0,230,118,0.08)', borderColor: 'rgba(0,230,118,0.2)' }]}>
              <Ionicons name="checkmark-circle" size={13} color="#00E676" />
              <Text style={[styles.statText, { color: '#00E676', fontSize: fontSize.xs }]}>
                {analysed} Analysed
              </Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.2)' }]}>
              <Ionicons name="hourglass-outline" size={13} color="#9B59F5" />
              <Text style={[styles.statText, { color: '#9B59F5', fontSize: fontSize.xs }]}>
                {pending} Pending
              </Text>
            </View>
          </View>
        )}

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.overlay }]}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary, fontSize: fontSize.base }]}
            placeholder="Search snippets…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── List / Loading / Empty ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[styles.list, filtered.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="code-slash-outline" size={42} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontSize: fontSize.md }]}>
                {query ? 'No matches' : 'No snippets yet'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted, fontSize: fontSize.sm }]}>
                {query
                  ? 'Try a different search term.'
                  : 'Go to the Snippets tab and add your first snippet, then come back here to get AI insights.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <SnippetRow
              item={item}
              onPress={() =>
                router.push({ pathname: '/snippet/ai-insight', params: { id: item.id } })
              }
            />
          )}
        />
      )}
    </SafeContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // hero
  hero: {
    padding: Spacing.base,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroIconWrap: {
    width: 50, height: 50, borderRadius: 15,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontWeight: FontWeight.bold },
  heroSub:   { marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  statText: { fontWeight: FontWeight.semibold },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.md, height: 44,
  },
  searchInput: { flex: 1 },

  // list
  list:      { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  listEmpty: { flex: 1 },

  // row
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1,
  },
  langBar: { width: 4, height: 36, borderRadius: 2, flexShrink: 0 },
  rowTitle: { fontWeight: FontWeight.semibold },
  rowMeta:  { flexDirection: 'row', gap: 4, alignItems: 'center', flexWrap: 'wrap' },
  rowLang:  { fontWeight: FontWeight.bold },
  rowTag:   {},

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.pill, borderWidth: 1, flexShrink: 0,
  },
  statusText: { fontWeight: FontWeight.semibold },

  // empty
  emptyBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: {
    width: 84, height: 84, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  emptyTitle: { fontWeight: FontWeight.bold, textAlign: 'center' },
  emptySub:   { textAlign: 'center', lineHeight: 22 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
