import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, Alert, ActivityIndicator, Modal, Dimensions,
  TouchableOpacity, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../widgets/safe_container';
import { useAppTheme } from '../../themes/AppThemeContext';
import { getSnippet, toggleFavorite, deleteSnippet } from '../../database/snippet_repo';
import type { SnippetListItem, ExportFormat } from '../../models/snippetTypes';
import { exportAndShare, saveCodeToFiles } from '../../services/export_snippet';
import { Spacing, Radius, FontSize, FontWeight } from '../../themes/palette';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Toast helper ──────────────────────────────────────────────────────────────

function useToast() {
  const [visible, setVisible]   = useState(false);
  const [message, setMessage]   = useState('');
  const opacity = React.useRef(new Animated.Value(0)).current;

  const show = (msg: string) => {
    setMessage(msg);
    setVisible(true);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const Toast = visible ? (
    <Animated.View style={[toastStyles.toast, { opacity }]}>
      <Ionicons name="checkmark-circle" size={18} color="#FFF" />
      <Text style={toastStyles.toastText}>{message}</Text>
    </Animated.View>
  ) : null;

  return { show, Toast };
}

const toastStyles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1A1E2C', paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 100, shadowColor: '#000', shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 10,
  },
  toastText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});

// ── Main component ────────────────────────────────────────────────────────────

export default function SnippetDetailsScreen({ id }: { id: string }) {
  const router = useRouter();
  const { colors, fontSize } = useAppTheme();
  const { show: showToast, Toast } = useToast();

  const [snippet,      setSnippet]      = useState<SnippetListItem | null>(null);
  const [imagePreview, setImagePreview] = useState(false);
  const [saving,       setSaving]       = useState(false);

  const load = useCallback(async () => {
    const s = await getSnippet(Number(id));
    setSnippet(s);
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Actions ───────────────────────────────────────────────────────────────

  const onExport = async (format: ExportFormat) => {
    if (!snippet) return;
    try {
      await exportAndShare(snippet, format);
    } catch (e) {
      Alert.alert('Export failed', String(e));
    }
  };

  const onSaveToFiles = async () => {
    if (!snippet) return;
    setSaving(true);
    try {
      saveCodeToFiles(snippet.title, snippet.languageFull, snippet.codeContent);
      showToast('Saved to Files → exports/');
    } catch (e) {
      Alert.alert('Save failed', String(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Delete Snippet', 'Remove this snippet permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteSnippet(Number(snippet!.id));
          router.back();
        },
      },
    ]);
  };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (!snippet) {
    return (
      <SafeContainer edges={['bottom']} style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeContainer>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeContainer edges={['bottom']} style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Title ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>Title</Text>
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, { color: colors.textPrimary, fontSize: fontSize.lg }]}>
              {snippet.title}
            </Text>
            <Pressable
              onPress={async () => { await toggleFavorite(Number(snippet.id), !snippet.isFavorited); load(); }}
              hitSlop={8}
            >
              <Ionicons
                name={snippet.isFavorited ? 'star' : 'star-outline'}
                size={24}
                color={snippet.isFavorited ? '#FFD60A' : colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* ── Tags ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>Tags</Text>
          <View style={styles.tagsRow}>
            {snippet.tags.length > 0 ? (
              snippet.tags.map((t, i) => (
                <View key={i} style={[styles.tagBadge, { backgroundColor: colors.surfaceAlt, borderColor: colors.overlay }]}>
                  <Text style={[styles.tagText, { color: colors.accentLight, fontSize: fontSize.sm }]}>#{t}</Text>
                </View>
              ))
            ) : (
              <Text style={[styles.mutedText, { color: colors.textMuted, fontSize: fontSize.sm }]}>No tags</Text>
            )}
          </View>
        </View>

        {/* ── Code ── */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>Code</Text>
            <View style={[styles.langBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.langBadgeText}>{snippet.languageFull}</Text>
            </View>
          </View>
          <View style={[styles.codeBox, { backgroundColor: colors.surface, borderColor: colors.overlay }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={[styles.codeText, { color: colors.textPrimary, fontSize: fontSize.sm }]}>
                {snippet.codeContent}
              </Text>
            </ScrollView>
          </View>
        </View>

        {/* ── AI Explain ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>AI Explain</Text>
          <Pressable
            style={[styles.aiButton, { backgroundColor: colors.accent }]}
            onPress={() => router.push({ pathname: '/snippet/ai-insight', params: { id: snippet.id } })}
          >
            <Ionicons name="sparkles-sharp" size={16} color="#FFF" />
            <Text style={styles.aiButtonText}>
              {snippet.aiExplanation ? 'View AI Insights' : 'Generate AI Insights'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#FFF" style={{ marginLeft: 'auto' }} />
          </Pressable>
        </View>

        {/* ── Export & Save ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>
            Export / Save
          </Text>
          {/* Export chips */}
          <View style={styles.exportRow}>
            {(['txt', 'js', 'json'] as ExportFormat[]).map((f) => (
              <Pressable
                key={f}
                style={[styles.exportChip, { backgroundColor: colors.surface, borderColor: colors.overlay }]}
                onPress={() => onExport(f)}
              >
                <Ionicons name="share-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.exportChipText, { color: colors.textPrimary, fontSize: fontSize.sm }]}>
                  .{f}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Save to Files */}
          <TouchableOpacity
            style={[styles.saveFilesBtn, { backgroundColor: colors.surface, borderColor: colors.overlay }]}
            onPress={onSaveToFiles}
            disabled={saving}
            activeOpacity={0.7}
          >
            <View style={[styles.saveFilesIconBox, { backgroundColor: '#7C3AED22' }]}>
              <Ionicons name="folder-open" size={18} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.saveFilesTitle, { color: colors.textPrimary }]}>Save to Files</Text>
              <Text style={[styles.saveFilesSub, { color: colors.textMuted }]}>
                Copy code to exports/ in local storage
              </Text>
            </View>
            {saving
              ? <ActivityIndicator size="small" color={colors.accent} />
              : <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            }
          </TouchableOpacity>
        </View>

        {/* ── Screenshot ── */}
        {snippet.imageUri && (
          <View style={[styles.section, { marginBottom: Spacing.xl }]}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>
              Attachment
            </Text>
            <TouchableOpacity
              style={[styles.attachCard, { backgroundColor: colors.surface, borderColor: colors.overlay }]}
              onPress={() => setImagePreview(true)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: snippet.imageUri }} style={styles.attachImage} />
              <View style={styles.attachFooter}>
                <Ionicons name="image-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.attachLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>
                  Screenshot · tap to view full screen
                </Text>
                <Ionicons name="expand-outline" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Edit / Delete ── */}
        <View style={[styles.section, { marginBottom: Spacing.xxxl }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSize.xs }]}>Manage</Text>
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.overlay }]}
              onPress={() => router.push({
                pathname: '/snippet/create',
                params: {
                  initialData: JSON.stringify({
                    id: snippet.id, title: snippet.title,
                    language: snippet.languageFull, codeContent: snippet.codeContent,
                    tags: snippet.tags, isFavorited: snippet.isFavorited, imageUri: snippet.imageUri,
                  }),
                  isEdit: 'true',
                },
              })}
            >
              <Ionicons name="create-outline" size={16} color={colors.accentLight} />
              <Text style={[styles.actionBtnText, { color: colors.accentLight, fontSize: fontSize.sm }]}>Edit Snippet</Text>
            </Pressable>

            <Pressable
              style={[styles.actionBtn, { backgroundColor: 'rgba(255,69,58,0.1)', borderColor: 'rgba(255,69,58,0.2)' }]}
              onPress={onDelete}
            >
              <Ionicons name="trash-outline" size={16} color={colors.red} />
              <Text style={[styles.actionBtnText, { color: colors.red, fontSize: fontSize.sm }]}>Delete</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>

      {/* ── Toast ── */}
      {Toast}

      {/* ── Full-screen image preview ── */}
      <Modal
        visible={imagePreview}
        animationType="fade"
        transparent
        onRequestClose={() => setImagePreview(false)}
      >
        <Pressable style={styles.imgOverlay} onPress={() => setImagePreview(false)}>
          <Image
            source={{ uri: snippet.imageUri ?? '' }}
            style={styles.imgFull}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.imgClose} onPress={() => setImagePreview(false)}>
            <Ionicons name="close-circle" size={36} color="#FFF" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </SafeContainer>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex:   { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.base, gap: Spacing.lg },

  section:      { gap: 6 },
  sectionLabel: { fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.8 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  titleText: { flex: 1, fontWeight: 'bold' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.pill, borderWidth: 1 },
  tagText:  { fontWeight: '600' },
  mutedText: { fontStyle: 'italic' },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  langBadge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm },
  langBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: FontSize.xs },

  codeBox: { borderWidth: 1, borderRadius: Radius.md, padding: 12 },
  codeText: { fontFamily: 'monospace', lineHeight: 20 },

  aiButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: Radius.lg, gap: 8,
  },
  aiButtonText: { color: '#FFF', fontWeight: 'bold' },

  exportRow:     { flexDirection: 'row', gap: 10 },
  exportChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderRadius: Radius.md,
  },
  exportChipText: { fontWeight: 'bold' },

  // save to files
  saveFilesBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, marginTop: 6,
  },
  saveFilesIconBox: { width: 38, height: 38, borderRadius: Radius.sm, justifyContent: 'center', alignItems: 'center' },
  saveFilesTitle:   { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  saveFilesSub:     { fontSize: FontSize.xs, marginTop: 1 },

  // screenshot
  attachCard:  { borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  attachImage: { width: '100%', height: 200, resizeMode: 'cover' },
  attachFooter: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 6 },
  attachLabel:  { fontWeight: '500' },

  // edit/delete
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderWidth: 1, borderRadius: Radius.lg,
  },
  actionBtnText: { fontWeight: 'bold' },

  // full-screen image
  imgOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  imgFull:  { width: SCREEN_W, height: SCREEN_H * 0.8 },
  imgClose: { position: 'absolute', top: 56, right: 20 },
});
