import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppLogo from '../components/app_logo';
import BrandTagline from '../components/brand_tagline';
import PrimaryButton from '../components/primary_button';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '../themes/palette';
import { setSession } from '../services/storage';

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async () => {
    const e = email.trim();
    if (!e || !e.includes('@') || password.length < 4) {
      setError('Enter a valid email and password (4+ chars).');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await setSession(e);
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  }, [email, password, router]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.md }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <AppLogo size={48} color={Colors.accent} showGlow />
          <BrandTagline title="DevSnippets AI" subtitle="Secure Vault" align="center" />
        </View>

        <View style={styles.tabs}>
          {(['in', 'up'] as const).map((m) => (
            <Pressable key={m} style={[styles.tab, mode === m && styles.tabOn]} onPress={() => setMode(m)}>
              <Text style={[styles.tabText, mode === m && styles.tabTextOn]}>{m === 'in' ? 'Sign In' : 'Sign Up'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <PrimaryButton
            label={mode === 'in' ? 'Sign In' : 'Create account'}
            onPress={submit}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center', gap: Spacing.xl },
  header: { alignItems: 'center', gap: Spacing.md },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, padding: 4 },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm },
  tabOn: { backgroundColor: Colors.accent },
  tabText: { color: Colors.textMuted, fontWeight: FontWeight.semibold },
  tabTextOn: { color: Colors.textPrimary },
  form: { gap: Spacing.md },
  input: {
    height: 48, backgroundColor: Colors.surfaceAlt, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.overlay,
    paddingHorizontal: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base,
  },
  error: { color: Colors.red, fontSize: FontSize.sm },
});
