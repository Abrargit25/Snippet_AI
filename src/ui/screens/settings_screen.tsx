import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../widgets/safe_container';
import AppBar from '../../components/app_bar';
import { FontWeight, Spacing, Radius } from '../../themes/palette';
import { useAppTheme } from '../../themes/AppThemeContext';
import { clearSession } from '../../services/storage';
import type { FontSizePreference } from '../../services/prefs';

function Row({ label, onPress, right }: { label: string; onPress?: () => void; right?: React.ReactNode }) {
  const { colors, fontSize } = useAppTheme();
  return (
    <Pressable style={[styles.row, { backgroundColor: colors.surfaceAlt, borderColor: colors.overlay }]} onPress={onPress} disabled={!onPress}>
      <Text style={[styles.rowLabel, { color: colors.textPrimary, fontSize: fontSize.base }]}>{label}</Text>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={20} color={colors.textMuted} /> : null)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, fontSize, theme, fontPreference, setTheme, setFontPreference } = useAppTheme();

  const fontOptions: FontSizePreference[] = ['small', 'medium', 'large'];

  return (
    <SafeContainer edges={['top']} style={styles.screen}>
      <AppBar title="Settings" />
      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={[styles.section, { color: colors.textSecondary }]}>Appearance</Text>
        <Row
          label="Light theme"
          right={<Switch value={theme === 'light'} onValueChange={(v) => setTheme(v ? 'light' : 'dark')} trackColor={{ true: colors.accent }} />}
        />
        <View style={[styles.fontRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.overlay }]}>
          <Text style={{ color: colors.textPrimary, fontSize: fontSize.base }}>Font size</Text>
          <View style={styles.fontChips}>
            {fontOptions.map((f) => (
              <Pressable
                key={f}
                style={[styles.chip, fontPreference === f && { backgroundColor: colors.accent }]}
                onPress={() => setFontPreference(f)}
              >
                <Text style={{ color: fontPreference === f ? colors.textPrimary : colors.textMuted, fontSize: fontSize.sm, textTransform: 'capitalize' }}>{f}</Text>
              </Pressable>
            ))}
          </View>
        </View>
 
        <Text style={[styles.section, { color: colors.textSecondary }]}>AI</Text>
        <Row label="AI Mode / Provider" onPress={() => router.push('/settings/ai-providers')} />

        <Pressable
          style={[styles.signOut, { backgroundColor: colors.surfaceAlt }]}
          onPress={async () => { await clearSession(); router.replace('/auth_screen'); }}
        >
          <Text style={{ color: colors.textPrimary, fontWeight: FontWeight.semibold }}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  title: { fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  section: { fontSize: 13, fontWeight: FontWeight.semibold, marginTop: Spacing.md, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1 },
  rowLabel: { fontWeight: FontWeight.medium },
  fontRow: { padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, gap: Spacing.sm },
  fontChips: { flexDirection: 'row', gap: Spacing.sm },
  chip: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm },
  signOut: { marginTop: Spacing.xl, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
});
