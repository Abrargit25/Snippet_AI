import React, { useCallback, useState } from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import SafeContainer from '../../widgets/safe_container';
import SnippetCard from '../../components/snippet_card';
import AppBar from '../../components/app_bar';
import { FontSize, Spacing } from '../../themes/palette';
import { listSnippets, toggleFavorite } from '../../database/snippet_repo';
import type { SnippetListItem } from '../../models/snippetTypes';
import { useAppTheme } from '../../themes/AppThemeContext';

export default function FavoritesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [items, setItems] = useState<SnippetListItem[]>([]);

  const reload = useCallback(() => {
    listSnippets().then((all) => setItems(all.filter((s) => s.isFavorited)));
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  return (
    <SafeContainer edges={['top']} style={[styles.screen, { backgroundColor: colors.bg }]}>
      <AppBar title="Favorites" />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>No favorites yet</Text>}
        renderItem={({ item }) => (
          <SnippetCard
            {...item}
            onPress={() => router.push(`/snippet/${item.id}`)}
            onStarPress={async () => { await toggleFavorite(Number(item.id), false); reload(); }}
            onMorePress={() => router.push(`/snippet/${item.id}`)}
          />
        )}
      />
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: { fontSize: FontSize.xl, fontWeight: '700', padding: Spacing.base },
  list: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  empty: { textAlign: 'center', marginTop: 48 },
});
