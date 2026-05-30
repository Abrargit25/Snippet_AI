/**
 * add_or_edit_snippet.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Create or edit a snippet with:
 *  • Title, language picker, code editor, tags
 *  • Screenshot: Take Photo (camera) or Choose from Library
 *  • Remove attached screenshot
 *  • Image copied into app's screenshots/ sandbox folder
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, Pressable, Modal,
  Alert, Image, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { saveScreenshot } from '../../services/files';
import PrimaryButton from '../../components/primary_button';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../../themes/palette';
import { normalizeLang } from '../../utils/language';
import { saveSnippet } from '../../database/snippet_repo';
import type { SnippetFormData } from '../../models/snippetTypes';

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'SQL', 'Python',
  'Dart', 'Go', 'Java', 'C#', 'PHP', 'Ruby', 'Other',
];

// ─────────────────────────────────────────────────────────────────────────────

export default function AddOrEditSnippetScreen({
  initialData,
  isEdit = false,
}: {
  initialData?: SnippetFormData;
  isEdit?: boolean;
}) {
  const router = useRouter();

  const [title,    setTitle]    = useState(initialData?.title ?? '');
  const [language, setLanguage] = useState(normalizeLang(initialData?.language) || '');
  const [code,     setCode]     = useState(initialData?.codeContent ?? '');
  const [tags,     setTags]     = useState(initialData?.tags?.join(', ') ?? '');
  const [showLang, setShowLang] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [imageUri, setImageUri] = useState(initialData?.imageUri ?? '');
  const [showImagePicker, setShowImagePicker] = useState(false);

  // ── Screenshot helpers ────────────────────────────────────────────────────

  /** Copy chosen image into the app sandbox and update state. */
  const storeImage = async (pickedUri: string) => {
    try {
      const savedUri = await saveScreenshot(pickedUri, `snippet-${Date.now()}`);
      setImageUri(savedUri);
    } catch (e) {
      Alert.alert('Error', 'Could not save the image: ' + String(e));
    }
  };

  const pickFromLibrary = async () => {
    setShowImagePicker(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach screenshots.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) await storeImage(res.assets[0].uri);
  };

  const takePhoto = async () => {
    setShowImagePicker(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take a screenshot.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) await storeImage(res.assets[0].uri);
  };

  const removeImage = () => {
    Alert.alert('Remove screenshot', 'Remove the attached screenshot?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setImageUri('') },
    ]);
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const t    = title.trim();
    const lang = normalizeLang(language);
    if (!t || !lang || !code.trim()) {
      Alert.alert('Missing fields', 'Title, language, and code are required.');
      return;
    }
    setLoading(true);
    try {
      await saveSnippet({
        id:          isEdit && initialData?.id ? Number(initialData.id) : undefined,
        title:       t,
        language:    lang,
        codeContent: code,
        tags:        tags.split(',').map((x) => x.trim()).filter(Boolean),
        isFavorite:  initialData?.isFavorited,
        imageUri:    imageUri || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Save failed', String(e));
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: 0 }]}>
      <StatusBar style="light" backgroundColor={Colors.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={styles.group}>
            <Text style={styles.label}>Snippet Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. React Native Auth Hook"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Language */}
          <View style={styles.group}>
            <Text style={styles.label}>Language</Text>
            <Pressable style={styles.dropdownTrigger} onPress={() => setShowLang(true)}>
              <Text style={language ? styles.dropdownText : styles.dropdownPlaceholder}>
                {language || 'Select Language'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
            </Pressable>
            <Modal visible={showLang} transparent animationType="fade" onRequestClose={() => setShowLang(false)}>
              <Pressable style={styles.modalOverlay} onPress={() => setShowLang(false)}>
                <Pressable style={styles.dropdownList} onPress={(e) => e.stopPropagation()}>
                  <ScrollView>
                    {LANGUAGES.map((lang) => (
                      <Pressable
                        key={lang}
                        style={[styles.dropdownItem, language === lang && styles.dropdownItemActive]}
                        onPress={() => { setLanguage(lang); setShowLang(false); }}
                      >
                        <Text style={[styles.dropdownItemText, language === lang && styles.dropdownItemTextActive]}>
                          {lang}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </Modal>
          </View>

          {/* Code */}
          <View style={styles.group}>
            <Text style={styles.label}>Code Content</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Paste or type your code here..."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
              value={code}
              onChangeText={setCode}
              spellCheck={false}
              autoCapitalize="none"
            />
          </View>

          {/* Screenshot */}
          <View style={styles.group}>
            <Text style={styles.label}>Screenshot (optional)</Text>

            {!imageUri ? (
              /* No image yet — show picker button */
              <Pressable style={styles.attachBtn} onPress={() => setShowImagePicker(true)}>
                <Ionicons name="camera-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.attachText}>Attach Screenshot</Text>
              </Pressable>
            ) : (
              /* Image attached */
              <View style={styles.previewWrapper}>
                <Image source={{ uri: imageUri }} style={styles.preview} />
                <View style={styles.previewActions}>
                  <TouchableOpacity
                    style={[styles.previewBtn, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
                    onPress={() => setShowImagePicker(true)}
                  >
                    <Ionicons name="refresh-outline" size={16} color="#FFF" />
                    <Text style={styles.previewBtnText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.previewBtn, { backgroundColor: 'rgba(255,69,58,0.75)' }]}
                    onPress={removeImage}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FFF" />
                    <Text style={styles.previewBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Tags */}
          <View style={styles.group}>
            <Text style={styles.label}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. react, api, hook"
              placeholderTextColor={Colors.textMuted}
              value={tags}
              onChangeText={setTags}
            />
          </View>

        </ScrollView>

        {/* ── Fixed save button — lives outside ScrollView, above system nav ── */}
        <View
          style={[
            styles.saveFooter,
            {
              paddingBottom: Math.max(insets.bottom, Spacing.base),
              borderTopColor: Colors.overlay,
            },
          ]}
        >
          <PrimaryButton
            label={isEdit ? 'Update Snippet' : 'Save Snippet'}
            onPress={handleSave}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>

      {/* ── Image source picker ── */}
      <Modal
        visible={showImagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setShowImagePicker(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Attach Screenshot</Text>

            <TouchableOpacity style={styles.pickerRow} onPress={takePhoto}>
              <View style={[styles.pickerIconBox, { backgroundColor: '#7C3AED22' }]}>
                <Ionicons name="camera" size={22} color="#7C3AED" />
              </View>
              <View>
                <Text style={styles.pickerRowTitle}>Take Photo</Text>
                <Text style={styles.pickerRowSub}>Open camera and snap a screenshot</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pickerRow} onPress={pickFromLibrary}>
              <View style={[styles.pickerIconBox, { backgroundColor: '#EC489922' }]}>
                <Ionicons name="images" size={22} color="#EC4899" />
              </View>
              <View>
                <Text style={styles.pickerRowTitle}>Choose from Library</Text>
                <Text style={styles.pickerRowSub}>Pick an existing photo or screenshot</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowImagePicker(false)}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex:      { flex: 1 },
  scroll:    { padding: Spacing.base, gap: Spacing.lg },
  saveFooter: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: Colors.bg,
  },
  group:     { gap: Spacing.xs },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  input: {
    height: 48,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.overlay,
    paddingHorizontal: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
  },
  codeInput: {
    minHeight: 220,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.overlay,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },


  // attach button (no image)
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.overlay,
    borderStyle: 'dashed',
  },
  attachText: { color: Colors.textPrimary, fontWeight: FontWeight.medium },

  // image preview
  previewWrapper: { borderRadius: Radius.lg, overflow: 'hidden', position: 'relative' },
  preview:        { width: '100%', height: 180, resizeMode: 'cover' },
  previewActions: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  previewBtnText: { color: '#FFF', fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  // language dropdown
  dropdownTrigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 48, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.overlay, paddingHorizontal: Spacing.md,
  },
  dropdownText:        { fontSize: FontSize.base, color: Colors.textPrimary },
  dropdownPlaceholder: { fontSize: FontSize.base, color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dropdownList: {
    width: '80%', maxHeight: 300,
    backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.overlay,
  },
  dropdownItem:         { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  dropdownItemActive:   { backgroundColor: Colors.overlay },
  dropdownItemText:     { fontSize: FontSize.base, color: Colors.textPrimary },
  dropdownItemTextActive: { fontWeight: FontWeight.bold, color: Colors.accent },

  // image source picker sheet
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.base, paddingBottom: 36, gap: Spacing.md,
  },
  pickerHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.overlay, alignSelf: 'center', marginBottom: 4,
  },
  pickerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  pickerIconBox: { width: 48, height: 48, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  pickerRowTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  pickerRowSub:   { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  pickerCancel: {
    alignItems: 'center', padding: Spacing.md,
    backgroundColor: Colors.surfaceAlt, borderRadius: Radius.lg, marginTop: 4,
  },
  pickerCancelText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
});
