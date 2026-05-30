import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import SafeContainer from '../../widgets/safe_container';
import { FontWeight, Spacing, Radius } from '../../themes/palette';
import { useAppTheme } from '../../themes/AppThemeContext';
import {
  getAllProviders, saveCustomProvider, deleteCustomProvider, setProviderApiKey, getProviderApiKey,
  newCustomProviderId, setActiveProviderId,
} from '../../services/ai_providers';

export default function AiProviderEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const { colors, fontSize } = useAppTheme();
  const isNew = params.mode === 'new';

  const [providerId, setProviderId] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('https://api.openai.com/v1/chat/completions');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [builtIn, setBuiltIn] = useState(false);
  const [saved, setSaved] = useState('');

  const load = useCallback(async () => {
    if (isNew) {
      setProviderId(newCustomProviderId());
      setName('');
      setUrl('https://');
      setModel('');
      setApiKey('');
      setBuiltIn(false);
      return;
    }
    const id = params.id ?? '';
    const p = (await getAllProviders()).find((x) => x.id === id);
    if (!p) return;
    setProviderId(p.id);
    setName(p.name);
    setUrl(p.url);
    setModel(p.model);
    setBuiltIn(!!p.builtIn);
    setApiKey((await getProviderApiKey(p.id)) ?? '');
  }, [isNew, params.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async () => {
    if (builtIn) {
      if (apiKey.trim()) await setProviderApiKey(providerId, apiKey);
      setSaved('API key saved.');
      router.back();
      return;
    }
    const n = name.trim();
    const u = url.trim();
    const m = model.trim();
    if (!n || !u || !m) {
      Alert.alert('Missing fields', 'Name, API URL, and model are required.');
      return;
    }
    if (!u.startsWith('http')) {
      Alert.alert('Invalid URL', 'Use a full https://... chat completions URL.');
      return;
    }
    await saveCustomProvider({ id: providerId, name: n, url: u, model: m, builtIn: false });
    if (apiKey.trim()) await setProviderApiKey(providerId, apiKey);
    if (isNew) await setActiveProviderId(providerId);
    router.back();
  };

  const remove = () => {
    if (builtIn) {
      Alert.alert('Built-in provider', 'Cannot delete built-in providers.');
      return;
    }
    Alert.alert('Delete provider', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteCustomProvider(providerId);
          router.back();
        },
      },
    ]);
  };

  const readonlyMeta = builtIn && !isNew;

  return (
    <SafeContainer edges={['bottom']} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: fontSize.lg }]}>
          {isNew ? 'Add AI provider' : name || 'Edit provider'}
        </Text>
        <Text style={[styles.hint, { color: colors.textMuted, fontSize: fontSize.xs }]}>
          OpenAI-compatible endpoint: POST with Bearer token and JSON body (model + messages).
        </Text>

        <Field label="Display name" colors={colors} fontSize={fontSize.base}>
          <TextInput style={inputStyle(colors)} value={name} onChangeText={setName} placeholder="My AI" placeholderTextColor={colors.textMuted} editable={!readonlyMeta} />
        </Field>
        <Field label="API URL" colors={colors} fontSize={fontSize.base}>
          <TextInput style={inputStyle(colors)} value={url} onChangeText={setUrl} autoCapitalize="none" placeholder="https://api.example.com/v1/chat/completions" placeholderTextColor={colors.textMuted} editable={!readonlyMeta} />
        </Field>
        <Field label="Model ID" colors={colors} fontSize={fontSize.base}>
          <TextInput style={inputStyle(colors)} value={model} onChangeText={setModel} autoCapitalize="none" placeholder="model-name" placeholderTextColor={colors.textMuted} editable={!readonlyMeta} />
        </Field>
        <Field label="API key (SecureStore)" colors={colors} fontSize={fontSize.base}>
          <TextInput style={inputStyle(colors)} value={apiKey} onChangeText={setApiKey} secureTextEntry autoCapitalize="none" placeholder="Your API key" placeholderTextColor={colors.textMuted} />
        </Field>

        {!!saved && <Text style={{ color: colors.green, fontSize: fontSize.sm }}>{saved}</Text>}

        <Pressable style={[styles.btn, { backgroundColor: colors.accent }]} onPress={save}>
          <Text style={{ color: colors.textPrimary, fontWeight: FontWeight.semibold }}>Save</Text>
        </Pressable>

        {!builtIn && !isNew && (
          <Pressable style={[styles.btn, { backgroundColor: colors.surfaceAlt }]} onPress={remove}>
            <Text style={{ color: colors.red, fontWeight: FontWeight.semibold }}>Delete provider</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeContainer>
  );
}

function Field({ label, children, colors, fontSize }: { label: string; children: React.ReactNode; colors: { textSecondary: string }; fontSize: number }) {
  return (
    <View style={styles.field}>
      <Text style={{ color: colors.textSecondary, fontSize: fontSize - 2 }}>{label}</Text>
      {children}
    </View>
  );
}

function inputStyle(colors: { surfaceAlt: string; overlay: string; textPrimary: string }) {
  return {
    height: 48,
    backgroundColor: colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.overlay,
    paddingHorizontal: Spacing.md,
    color: colors.textPrimary,
  };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { padding: Spacing.base, gap: Spacing.md },
  title: { fontWeight: FontWeight.bold },
  hint: { lineHeight: 18, marginBottom: Spacing.sm },
  field: { gap: 6 },
  btn: { padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.sm },
});
