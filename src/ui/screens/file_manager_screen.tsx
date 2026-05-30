/**
 * file_manager_screen.tsx [SCREEN]
 * ─────────────────────────────────────────────────────────────────────────────
 * A state-of-the-art local File Explorer satisfying all storage & file manager
 * requirements using legacy expo-file-system:
 *   • Dynamic browsing: Tabs for Code Exports (exports/) & Snippet Screenshots (screenshots/)
 *   • Safe Area Top & Bottom styling with integrated premium AppBar navigation.
 *   • Tactile quick actions: Attach screenshot, view templates, download all templates.
 *   • Viewer Modal: Custom code text view / fit-to-screen image preview.
 *   • Cross-platform Rename: In-app prompt to rename files dynamically.
 *   • File Operations: Move/Copy files between folders and delete files safely.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  Modal, ScrollView, TextInput, ActivityIndicator,
  Alert, RefreshControl, Image, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeContainer from '../../widgets/safe_container';
import AppBar from '../../components/app_bar';
import { useAppTheme } from '../../themes/AppThemeContext';
import { FontSize, FontWeight, Spacing, Radius } from '../../themes/palette';
import {
  ensureAppDirs, listFolder, getFolderStats,
  deleteEntry, copyEntry, moveEntry,
  readTextFile, saveScreenshot,
  downloadTemplate, downloadAllTemplates,
  TEMPLATE_CATALOG,
  fmtBytes, fmtDate,
  type FileEntry, type FolderKey, type Template,
} from '../../services/files';

// ─────────────────────────────────────────────────────────────────────────────
// Folder Meta & Themes
// ─────────────────────────────────────────────────────────────────────────────

const FOLDER_META: Record<FolderKey, { label: string; icon: string; color: string }> = {
  exports:     { label: 'Saved Code',    icon: 'code-slash',      color: '#7C3AED' },
  screenshots: { label: 'Screenshots',   icon: 'image-outline',   color: '#0A84FF' },
};

const LANG_COLORS: Record<string, string> = {
  '.js':  '#F7DF1E', '.ts':  '#3178C6', '.tsx': '#3178C6',
  '.py':  '#3776AB', '.sql': '#336791', '.dart':'#00B4D8',
  '.go':  '#00ADD8', '.java':'#ED8B00', '.cs':  '#512BD4',
  '.php': '#8892BF', '.rb':  '#CC342D', '.txt': '#9CA3AF',
};

function fileExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}
function fileColor(name: string): string {
  return LANG_COLORS[fileExt(name)] ?? '#7C3AED';
}
function fileIcon(name: string): string {
  const ext = fileExt(name);
  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) return 'image';
  if (['.js', '.ts', '.tsx', '.py', '.dart', '.go', '.java', '.cs', '.php', '.rb'].includes(ext)) return 'code-slash';
  if (ext === '.sql') return 'server';
  if (ext === '.json') return 'list';
  return 'document-text';
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Single file explorer list card */
function FileRow({
  entry,
  onPress,
  onLongPress,
}: {
  entry: FileEntry;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors, fontSize } = useAppTheme();
  const color = fileColor(entry.name);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.fileRow,
        { backgroundColor: pressed ? colors.surfaceAlt : colors.surface, borderColor: colors.overlay },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={[styles.fileIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={fileIcon(entry.name) as any} size={20} color={color} />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={[styles.fileName, { color: colors.textPrimary, fontSize: fontSize.sm }]}>
          {entry.name}
        </Text>
        <View style={styles.fileMeta}>
          <Text style={[styles.fileMetaText, { color: colors.textMuted, fontSize: fontSize.xs }]}>
            {fmtBytes(entry.size)}
          </Text>
          {!!entry.modTime && (
            <Text style={[styles.fileMetaText, { color: colors.textMuted, fontSize: fontSize.xs }]}>
              · {fmtDate(entry.modTime)}
            </Text>
          )}
        </View>
      </View>

      <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

/** Directory Pill Navigation Tab */
function FolderTab({
  folderKey, active, onPress, count, bytes,
}: {
  folderKey: FolderKey; active: boolean; onPress: () => void; count: number; bytes: number;
}) {
  const { colors, fontSize } = useAppTheme();
  const meta = FOLDER_META[folderKey];
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.folderTab,
        {
          backgroundColor: active ? meta.color : colors.surface,
          borderColor: active ? meta.color : colors.overlay,
        },
      ]}
    >
      <Ionicons name={meta.icon as any} size={14} color={active ? '#FFF' : colors.textSecondary} />
      <View>
        <Text style={[styles.folderTabLabel, { color: active ? '#FFF' : colors.textSecondary, fontSize: fontSize.xs }]}>
          {meta.label}
        </Text>
        <Text style={[{ color: active ? 'rgba(255,255,255,0.7)' : colors.textMuted, fontSize: 9 }]}>
          {count} files ({fmtBytes(bytes)})
        </Text>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen component
// ─────────────────────────────────────────────────────────────────────────────

export default function FileManagerScreen() {
  const { colors, fontSize } = useAppTheme();
  const insets = useSafeAreaInsets();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeFolder, setActiveFolder]  = useState<FolderKey>('exports');
  const [files,        setFiles]         = useState<FileEntry[]>([]);
  const [loading,      setLoading]       = useState(true);
  const [refreshing,   setRefreshing]    = useState(false);
  const [stats,        setStats]         = useState<Record<FolderKey, { count: number; bytes: number }>>({
    exports:     { count: 0, bytes: 0 },
    screenshots: { count: 0, bytes: 0 },
  });

  // Modals state
  const [selectedFile,       setSelectedFile]      = useState<FileEntry | null>(null);
  const [showFileMenu,       setShowFileMenu]       = useState(false);
  const [showViewModal,      setShowViewModal]      = useState(false);
  const [fileContent,        setFileContent]        = useState('');
  const [showMoveModal,      setShowMoveModal]      = useState(false);
  const [moveMode,           setMoveMode]           = useState<'copy' | 'move'>('copy');
  const [showRenameModal,    setShowRenameModal]   = useState(false);
  const [renameValue,        setRenameValue]       = useState('');
  const [showTemplates,      setShowTemplates]      = useState(false);
  const [downloadingAll,     setDownloadingAll]     = useState(false);
  const [downloadingId,      setDownloadingId]      = useState<string | null>(null);
  const [search,             setSearch]             = useState('');

  // ── Load entries ───────────────────────────────────────────────────────────
  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    try {
      await ensureAppDirs();
      const [entries, exStats, scStats] = await Promise.all([
        listFolder(activeFolder),
        getFolderStats('exports'),
        getFolderStats('screenshots'),
      ]);
      setFiles(entries);
      setStats({ exports: exStats, screenshots: scStats });
    } catch (e) {
      Alert.alert('Error loading files', String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFolder]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [activeFolder]); // reload when switching folders

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((entry: FileEntry) => {
    Alert.alert('Delete File', `Delete "${entry.name}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntry(entry.uri);
            setShowFileMenu(false);
            load();
          } catch (e) {
            Alert.alert('Delete failed', String(e));
          }
        },
      },
    ]);
  }, [load]);

  // ── Copy / Move ────────────────────────────────────────────────────────────
  const handleMoveOrCopy = useCallback(async (targetFolder: FolderKey) => {
    if (!selectedFile) return;
    setShowMoveModal(false);
    setShowFileMenu(false);
    try {
      if (moveMode === 'copy') {
        await copyEntry(selectedFile.uri, targetFolder, selectedFile.name);
        Alert.alert('Copied', `"${selectedFile.name}" copied to ${FOLDER_META[targetFolder].label}`);
      } else {
        await moveEntry(selectedFile.uri, targetFolder, selectedFile.name);
        Alert.alert('Moved', `"${selectedFile.name}" moved to ${FOLDER_META[targetFolder].label}`);
      }
      load();
    } catch (e) {
      Alert.alert(`${moveMode === 'copy' ? 'Copy' : 'Move'} failed`, String(e));
    }
  }, [selectedFile, moveMode, load]);

  // ── View file ──────────────────────────────────────────────────────────────
  const handleViewFile = useCallback(async (entry: FileEntry) => {
    setShowFileMenu(false);
    const imgExts = ['.png', '.jpg', '.jpeg', '.webp'];
    if (imgExts.includes(fileExt(entry.name))) {
      setFileContent('');
      setShowViewModal(true);
      return;
    }
    try {
      const txt = await readTextFile(entry.uri);
      setFileContent(txt);
      setShowViewModal(true);
    } catch {
      Alert.alert('Cannot read', 'Binary or unsupported file format.');
    }
  }, []);

  // ── Rename ─────────────────────────────────────────────────────────────────
  const handleRename = useCallback(async () => {
    if (!selectedFile || !renameValue.trim()) return;
    setShowRenameModal(false);
    setShowFileMenu(false);
    try {
      await moveEntry(selectedFile.uri, selectedFile.folder, renameValue.trim());
      Alert.alert('Success', `Renamed to "${renameValue.trim()}"`);
      load();
    } catch (e) {
      Alert.alert('Rename failed', String(e));
    }
  }, [selectedFile, renameValue, load]);

  // ── Pick image (screenshot) ────────────────────────────────────────────────
  const handlePickScreenshot = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Allow photo access to save screenshots.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      try {
        await saveScreenshot(result.assets[0].uri, 'screenshot');
        Alert.alert('Saved', `Screenshot saved in local explorer`);
        load();
      } catch (e) {
        Alert.alert('Save failed', String(e));
      }
    }
  }, [load]);

  // ── Download template ──────────────────────────────────────────────────────
  const handleDownloadTemplate = useCallback(async (template: Template) => {
    setDownloadingId(template.id);
    try {
      await downloadTemplate(template);
      Alert.alert('Saved', `"${template.filename}" saved to Saved Code`);
      if (activeFolder === 'exports') load();
    } catch (e) {
      Alert.alert('Download failed', String(e));
    } finally {
      setDownloadingId(null);
    }
  }, [activeFolder, load]);

  const handleDownloadAll = useCallback(async () => {
    setDownloadingAll(true);
    try {
      await downloadAllTemplates();
      Alert.alert('Done', 'All templates saved to Saved Code');
      if (activeFolder === 'exports') load();
    } catch (e) {
      Alert.alert('Failed', String(e));
    } finally {
      setDownloadingAll(false);
    }
  }, [activeFolder, load]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = files.filter((f) =>
    !search || f.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── AppBar right action ─────────────────────────────────────────────────────
  const rightButtons = (
    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
      {/* Attach image button */}
      <Pressable
        style={[styles.headerBtn, { backgroundColor: '#0A84FF18', borderColor: '#0A84FF33' }]}
        onPress={handlePickScreenshot}
        hitSlop={8}
      >
        <Ionicons name="camera-outline" size={18} color="#0A84FF" />
      </Pressable>

      {/* Templates sheet button */}
      <Pressable
        style={[styles.headerBtn, { backgroundColor: '#7C3AED18', borderColor: '#7C3AED33' }]}
        onPress={() => setShowTemplates(true)}
        hitSlop={8}
      >
        <Ionicons name="download-outline" size={18} color="#7C3AED" />
      </Pressable>
    </View>
  );

  return (
    <SafeContainer edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.bg }]}>
      <AppBar title="File Explorer" rightAction={rightButtons} />

      {/* ── Directory Info Panel ── */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.overlay }]}>
        
        {/* Toggle Folder Tabs */}
        <View style={styles.tabsRow}>
          {(Object.keys(FOLDER_META) as FolderKey[]).map((key) => (
            <FolderTab
              key={key}
              folderKey={key}
              active={activeFolder === key}
              onPress={() => setActiveFolder(key)}
              count={stats[key].count}
              bytes={stats[key].bytes}
            />
          ))}
        </View>

        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.overlay }]}>
          <Ionicons name="search" size={15} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary, fontSize: fontSize.sm }]}
            placeholder={`Search in ${FOLDER_META[activeFolder].label}…`}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={15} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── File Explorer List ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.uri}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.accent}
            />
          }
          contentContainerStyle={[
            styles.list,
            filtered.length === 0 && { flex: 1 },
            { paddingBottom: insets.bottom + 24 },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons
                  name={FOLDER_META[activeFolder].icon as any}
                  size={38}
                  color={colors.textMuted}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontSize: fontSize.md }]}>
                {search ? 'No matches found' : 'Folder is empty'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted, fontSize: fontSize.sm }]}>
                {activeFolder === 'exports'
                  ? 'Save a snippet or download a template to populate this folder.'
                  : 'Tap the camera icon in the top header to save screenshot files.'}
              </Text>
              {activeFolder === 'exports' && !search && (
                <Pressable
                  onPress={() => setShowTemplates(true)}
                  style={[styles.emptyBtn, { backgroundColor: colors.accent }]}
                >
                  <Ionicons name="download" size={16} color="#FFF" />
                  <Text style={[styles.emptyBtnText, { fontSize: fontSize.sm }]}>Get Starters</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <FileRow
              entry={item}
              onPress={() => {
                setSelectedFile(item);
                handleViewFile(item);
              }}
              onLongPress={() => {
                setSelectedFile(item);
                setShowFileMenu(true);
              }}
            />
          )}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL — Actions Bottom Sheet Menu
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showFileMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFileMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFileMenu(false)}>
          <Pressable
            style={[styles.bottomSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + Spacing.lg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.dragBar, { backgroundColor: colors.overlay }]} />

            {/* File info header */}
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetFileIcon, { backgroundColor: fileColor(selectedFile?.name ?? '') + '18' }]}>
                <Ionicons name={fileIcon(selectedFile?.name ?? '') as any} size={22} color={fileColor(selectedFile?.name ?? '')} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.sheetTitle, { color: colors.textPrimary, fontSize: fontSize.base }]}>
                  {selectedFile?.name}
                </Text>
                <Text style={[{ color: colors.textMuted, fontSize: fontSize.xs }]}>
                  {fmtBytes(selectedFile?.size)} · {fmtDate(selectedFile?.modTime)}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.overlay }]} />

            {/* Action buttons */}
            {[
              { icon: 'eye-outline',          label: 'View Contents',  color: colors.accent,  action: () => selectedFile && handleViewFile(selectedFile) },
              { icon: 'pencil-outline',       label: 'Rename',         color: '#30D158',       action: () => { if (selectedFile) { setRenameValue(selectedFile.name); setShowRenameModal(true); } } },
              { icon: 'copy-outline',         label: 'Copy to Folder', color: '#0A84FF',       action: () => { setMoveMode('copy'); setShowMoveModal(true); } },
              { icon: 'arrow-forward-outline',label: 'Move to Folder', color: '#FF9F0A',       action: () => { setMoveMode('move'); setShowMoveModal(true); } },
              { icon: 'trash-outline',        label: 'Delete File',    color: '#FF453A',       action: () => selectedFile && handleDelete(selectedFile) },
            ].map((a) => (
              <Pressable
                key={a.label}
                style={[styles.sheetAction, { backgroundColor: colors.surfaceAlt }]}
                onPress={a.action}
              >
                <View style={[styles.sheetActionIcon, { backgroundColor: a.color + '18' }]}>
                  <Ionicons name={a.icon as any} size={18} color={a.color} />
                </View>
                <Text style={[styles.sheetActionLabel, { color: colors.textPrimary, fontSize: fontSize.base }]}>
                  {a.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
              </Pressable>
            ))}

            <Pressable style={styles.sheetCancel} onPress={() => setShowFileMenu(false)}>
              <Text style={[{ color: colors.textMuted, fontSize: fontSize.base, fontWeight: FontWeight.semibold }]}>
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL — Move / Copy Destination Picker
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showMoveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoveModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMoveModal(false)}>
          <Pressable
            style={[styles.bottomSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + Spacing.lg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.dragBar, { backgroundColor: colors.overlay }]} />
            <Text style={[styles.sheetSectionTitle, { color: colors.textPrimary, fontSize: fontSize.md }]}>
              {moveMode === 'copy' ? 'Copy to…' : 'Move to…'}
            </Text>
            <Text style={[{ color: colors.textMuted, fontSize: fontSize.xs, marginBottom: Spacing.md }]}>
              Choose a destination folder for "{selectedFile?.name}"
            </Text>

            {(Object.keys(FOLDER_META) as FolderKey[])
              .filter((k) => k !== selectedFile?.folder)
              .map((k) => (
                <Pressable
                  key={k}
                  style={[styles.sheetAction, { backgroundColor: colors.surfaceAlt }]}
                  onPress={() => handleMoveOrCopy(k)}
                >
                  <View style={[styles.sheetActionIcon, { backgroundColor: FOLDER_META[k].color + '18' }]}>
                    <Ionicons name={FOLDER_META[k].icon as any} size={18} color={FOLDER_META[k].color} />
                  </View>
                  <Text style={[styles.sheetActionLabel, { color: colors.textPrimary, fontSize: fontSize.base }]}>
                    {FOLDER_META[k].label}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                </Pressable>
              ))}

            <Pressable style={styles.sheetCancel} onPress={() => setShowMoveModal(false)}>
              <Text style={[{ color: colors.textMuted, fontSize: fontSize.base, fontWeight: FontWeight.semibold }]}>
                Cancel
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL — View File Contents
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showViewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewModal(false)}
      >
        <View style={[styles.viewModalOverlay, { backgroundColor: 'rgba(0,0,0,0.82)' }]}>
          <View style={[styles.viewModalCard, { backgroundColor: colors.surface }]}>
            
            {/* Modal Header */}
            <View style={styles.viewModalHeader}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.viewModalTitle, { color: colors.textPrimary, fontSize: fontSize.base }]}>
                  {selectedFile?.name}
                </Text>
                <Text style={[{ color: colors.textMuted, fontSize: fontSize.xs }]}>
                  {fmtBytes(selectedFile?.size)}
                </Text>
              </View>
              <Pressable onPress={() => setShowViewModal(false)} hitSlop={10}
                style={[styles.viewModalClose, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* Modal Body: Custom Image or Text Code Scroll */}
            {selectedFile && ['.png', '.jpg', '.jpeg', '.webp'].includes(selectedFile.name.slice(selectedFile.name.lastIndexOf('.')).toLowerCase()) ? (
              <View style={[styles.viewModalImageContainer, { backgroundColor: colors.bg }]}>
                <Image
                  source={{ uri: selectedFile.uri }}
                  style={styles.viewModalImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <ScrollView style={[styles.codeScroll, { backgroundColor: colors.bg }]}
                horizontal
                contentContainerStyle={{ minWidth: '100%' }}>
                <ScrollView>
                  <Text style={[styles.codeText, { color: colors.textSecondary, fontSize: fontSize.xs }]}>
                    {fileContent}
                  </Text>
                </ScrollView>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL — Rename File
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowRenameModal(false)}>
          <Pressable
            style={[styles.bottomSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + Spacing.lg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.dragBar, { backgroundColor: colors.overlay }]} />
            <Text style={[styles.sheetSectionTitle, { color: colors.textPrimary, fontSize: fontSize.md, marginBottom: 4 }]}>
              Rename File
            </Text>
            <Text style={[{ color: colors.textMuted, fontSize: fontSize.xs, marginBottom: Spacing.md }]}>
              Enter a new name for "{selectedFile?.name}"
            </Text>

            <View style={[styles.renameInputContainer, { backgroundColor: colors.surfaceAlt, borderColor: colors.overlay }]}>
              <TextInput
                style={[styles.renameInput, { color: colors.textPrimary, fontSize: fontSize.sm }]}
                value={renameValue}
                onChangeText={setRenameValue}
                autoFocus
                selectTextOnFocus
              />
            </View>

            <View style={styles.renameActions}>
              <Pressable
                style={[styles.renameBtn, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={[{ color: colors.textPrimary, fontWeight: FontWeight.semibold }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.renameBtn, { backgroundColor: colors.accent }]}
                onPress={handleRename}
              >
                <Text style={[{ color: '#FFF', fontWeight: FontWeight.semibold }]}>Rename</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL — Code Templates Library catalog
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showTemplates}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTemplates(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTemplates(false)}>
          <Pressable
            style={[styles.templatesSheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 8 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.dragBar, { backgroundColor: colors.overlay }]} />

            {/* Header */}
            <View style={styles.templatesHeader}>
              <View style={styles.templatesIconWrap}>
                <Ionicons name="code-working" size={20} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetSectionTitle, { color: colors.textPrimary, fontSize: fontSize.md }]}>
                  Code Templates
                </Text>
                <Text style={[{ color: colors.textMuted, fontSize: fontSize.xs }]}>
                  {TEMPLATE_CATALOG.length} premium templates
                </Text>
              </View>
              <Pressable
                onPress={handleDownloadAll}
                disabled={downloadingAll}
                style={[styles.dlAllBtn, { backgroundColor: colors.accent, opacity: downloadingAll ? 0.6 : 1 }]}
              >
                {downloadingAll
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <><Ionicons name="download" size={13} color="#FFF" />
                    <Text style={[styles.dlAllText, { fontSize: fontSize.xs }]}>Save All</Text></>}
              </Pressable>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.overlay }]} />

            {/* Template lists scroll container */}
            <FlatList
              data={TEMPLATE_CATALOG}
              keyExtractor={(t) => t.id}
              style={{ maxHeight: 420 }}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
              contentContainerStyle={{ padding: Spacing.md }}
              renderItem={({ item }) => {
                const isDone = downloadingId === item.id;
                return (
                  <View style={[styles.templateCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.overlay }]}>
                    <View style={styles.templateTop}>
                      <View style={[styles.templateLang, { backgroundColor: colors.overlay }]}>
                        <Text style={[styles.templateLangText, { color: colors.textSecondary, fontSize: fontSize.xs }]}>
                          {item.language}
                        </Text>
                      </View>
                      <Text style={[styles.templateName, { color: colors.textPrimary, fontSize: fontSize.sm }]}>
                        {item.name}
                      </Text>
                    </View>
                    <Text style={[styles.templateDesc, { color: colors.textMuted, fontSize: fontSize.xs }]}>
                      {item.description}
                    </Text>
                    <View style={styles.templateFooter}>
                      <Text style={[styles.templateFilename, { color: colors.accent, fontSize: fontSize.xs }]}>
                        {item.filename}
                      </Text>
                      <Pressable
                        onPress={() => handleDownloadTemplate(item)}
                        disabled={isDone}
                        style={[styles.downloadBtn, {
                          backgroundColor: isDone ? colors.overlay : colors.accent,
                          opacity: isDone ? 0.7 : 1,
                        }]}
                      >
                        {isDone
                          ? <ActivityIndicator size="small" color="#FFF" />
                          : <><Ionicons name="download-outline" size={13} color="#FFF" />
                            <Text style={[styles.downloadBtnText, { fontSize: fontSize.xs }]}>Download</Text></>}
                      </Pressable>
                    </View>
                  </View>
                );
              }}
            />

            <Pressable style={[styles.sheetCancel, { marginHorizontal: Spacing.base }]} onPress={() => setShowTemplates(false)}>
              <Text style={[{ color: colors.textMuted, fontSize: fontSize.base, fontWeight: FontWeight.semibold }]}>
                Done
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stylesheet
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // header and layout
  header: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  folderTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  folderTabLabel: { fontWeight: FontWeight.bold },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 42,
  },
  searchInput: { flex: 1 },

  // file list card UI
  list: { padding: Spacing.base },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  fileIcon: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  fileName: { fontWeight: FontWeight.semibold },
  fileMeta: { flexDirection: 'row', gap: 4 },
  fileMetaText: {},

  // empty placeholder screen
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: 40,
  },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:    { fontWeight: FontWeight.bold, textAlign: 'center' },
  emptySub:      { textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    marginTop: Spacing.sm,
  },
  emptyBtnText: { color: '#FFF', fontWeight: FontWeight.bold },

  // modal overlays
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },

  // bottom sheets
  bottomSheet: {
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.base, gap: Spacing.sm,
  },
  dragBar:    { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.sm },
  divider:    { height: StyleSheet.hairlineWidth, marginVertical: Spacing.sm },
  sheetHeader:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sheetFileIcon:{ width: 44, height: 44, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontWeight: FontWeight.bold },
  sheetSectionTitle: { fontWeight: FontWeight.bold },
  sheetAction:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: 4,
  },
  sheetActionIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  sheetActionLabel:{ fontWeight: FontWeight.semibold },
  sheetCancel:{ alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.sm },

  // view modal
  viewModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  viewModalCard: {
    width: '100%', maxHeight: '82%',
    borderRadius: Radius.xl, overflow: 'hidden',
  },
  viewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  viewModalTitle: { fontWeight: FontWeight.bold },
  viewModalClose: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  codeScroll:     { flex: 1 },
  codeText:       { padding: Spacing.md, fontFamily: 'monospace', lineHeight: 20 },

  // image viewer containers
  viewModalImageContainer: {
    width: '100%',
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  viewModalImage: {
    width: '100%',
    height: '100%',
  },

  // rename details
  renameInputContainer: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  renameInput: { width: '100%' },
  renameActions: { flexDirection: 'row', gap: Spacing.md, justifyContent: 'flex-end', marginTop: Spacing.sm },
  renameBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },

  // templates sheet details
  templatesSheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  templatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  templatesIconWrap: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  dlAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  dlAllText: { color: '#FFF', fontWeight: FontWeight.bold },
  templateCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm },
  templateTop:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  templateLang:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  templateLangText:{ fontWeight: FontWeight.bold },
  templateName:    { fontWeight: FontWeight.semibold, flex: 1 },
  templateDesc:    { lineHeight: 18 },
  templateFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  templateFilename:{ fontWeight: FontWeight.medium, fontFamily: 'monospace' },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  downloadBtnText: { color: '#FFF', fontWeight: FontWeight.bold },
});
