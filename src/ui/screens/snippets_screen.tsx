import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  Pressable, 
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeContainer from '../../widgets/safe_container';
import SnippetCard from '../../components/snippet_card';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../themes/palette';
import { listSnippets, deleteSnippet } from '../../database/snippet_repo';
import type { SnippetListItem } from '../../models/snippetTypes';

const LANGUAGES = ['All', 'JavaScript', 'TypeScript', 'SQL', 'Python', 'Dart', 'Go', 'Java', 'C#', 'PHP', 'Ruby'];

export default function SnippetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<SnippetListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('All');

  const reload = useCallback(() => { listSnippets().then(setItems); }, []);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const handleAddSnippet = useCallback(() => {
    router.push('/snippet/create');
  }, [router]);

  const handleCalendarPress = useCallback(() => {
    console.log('[Snippets] Open Calendar Filter');
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const [selectedSnippetForActions, setSelectedSnippetForActions] = useState<SnippetListItem | null>(null);
  const [showSnippetActionsModal, setShowSnippetActionsModal] = useState(false);

  const handleSnippetMorePress = useCallback((snippet: SnippetListItem) => {
    setSelectedSnippetForActions(snippet);
    setShowSnippetActionsModal(true);
  }, []);

  const handleEditSnippet = useCallback(() => {
    if (selectedSnippetForActions) {
      router.push({
        pathname: '/snippet/create',
        params: {
          initialData: JSON.stringify({
            id: selectedSnippetForActions.id,
            title: selectedSnippetForActions.title,
            language: selectedSnippetForActions.languageFull,
            codeContent: selectedSnippetForActions.codeContent,
            tags: selectedSnippetForActions.tags,
            isFavorited: selectedSnippetForActions.isFavorited,
          }),
          isEdit: 'true',
        },
      });
      setShowSnippetActionsModal(false);
    }
  }, [selectedSnippetForActions, router]);

  const handleDeleteSnippet = useCallback(async () => {
    if (!selectedSnippetForActions) return;
    await deleteSnippet(Number(selectedSnippetForActions.id));
    setShowSnippetActionsModal(false);
    reload();
  }, [selectedSnippetForActions, reload]);

  return (
    <>
    <SafeContainer style={styles.screen} edges={['top']}>
      {/* ── Header Section ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Snippets</Text>
        <Text style={styles.headerSub}>{items.length} snippets stored locally</Text>
      </View>

      {/* ── Search & Filter Row ── */}
      <View style={styles.filterBar}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search snippets..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
        
        <Pressable 
          style={styles.calendarBtn} 
          onPress={handleCalendarPress}
          hitSlop={8}
        >
          <Ionicons name="calendar-outline" size={22} color={Colors.textPrimary} />
        </Pressable>
      </View>

      {/* ── Language Horizontal Slider ── */}
      <View style={styles.langSliderContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.langScrollContent}
        >
          {LANGUAGES.map((lang) => {
            const isActive = selectedLang === lang;
            return (
              <Pressable
                key={lang}
                style={[styles.langPill, isActive && styles.langPillActive]}
                onPress={() => setSelectedLang(lang)}
              >
                <Text style={[styles.langText, isActive && styles.langTextActive]}>
                  {lang}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Snippets List ── */}
      <FlatList
        data={items.filter((s) => {
          const q = searchQuery.toLowerCase();
          const matchesSearch = !q || s.title.toLowerCase().includes(q)
            || s.tags.some((t) => t.toLowerCase().includes(q))
            || s.languageFull.toLowerCase().includes(q);
          const matchesLanguage = selectedLang === 'All' || s.languageFull === selectedLang;
          return matchesSearch && matchesLanguage;
        })}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SnippetCard
            {...item}
            onPress={() => router.push(`/snippet/${item.id}`)} // Navigate to snippet detail
            onStarPress={() => console.log('Star pressed', item.id)}
            onMorePress={() => handleSnippetMorePress(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={Colors.overlay} />
            <Text style={styles.emptyText}>No snippets found</Text>
          </View>
        }
      />

      {/* ── Floating Action Button ── */}
      <Pressable 
        style={[styles.fab, { bottom: 24 + insets.bottom }]} 
        onPress={handleAddSnippet}
      >
        <Ionicons name="add" size={32} color={Colors.textPrimary} />
      </Pressable>
    </SafeContainer>

      {/* Snippet Actions Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSnippetActionsModal}
        onRequestClose={() => setShowSnippetActionsModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSnippetActionsModal(false)}>
          <Pressable style={[styles.actionsModal, { paddingBottom: Spacing.xxl + insets.bottom }]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.actionsModalTitle}>
              {selectedSnippetForActions?.title}
            </Text>
            <Pressable style={styles.actionsModalButton} onPress={handleEditSnippet}>
              <Ionicons name="create-outline" size={20} color={Colors.textPrimary} />
              <Text style={styles.actionsModalButtonText}>Edit Snippet</Text>
            </Pressable>
            <Pressable style={[styles.actionsModalButton, styles.actionsModalButtonDanger]} onPress={handleDeleteSnippet}>
              <Ionicons name="trash-outline" size={20} color={Colors.red} />
              <Text style={[styles.actionsModalButtonText, { color: Colors.red }]}>Delete Snippet</Text>
            </Pressable>
            <Pressable style={styles.actionsModalCancelButton} onPress={() => setShowSnippetActionsModal(false)}>
              <Text style={styles.actionsModalCancelButtonText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative', // For absolute positioning of dropdown/modal
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.overlay,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  calendarBtn: {
    width: 46,
    height: 46,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.overlay,
  },
  langSliderContainer: {
    marginBottom: 16,
  },
  langScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  langPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.overlay,
  },
  langPillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  langText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  langTextActive: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: Spacing.xxl,
    paddingTop: Spacing.md, // Add some top padding to separate from dropdown
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.base,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionsModal: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl, // For safe area on bottom
  },
  actionsModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  actionsModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  actionsModalButtonDanger: {
    backgroundColor: `${Colors.red}10`, // Light red background
  },
  actionsModalButtonText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  actionsModalCancelButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  actionsModalCancelButtonText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});