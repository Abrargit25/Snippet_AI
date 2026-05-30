import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SafeContainer from '../../widgets/safe_container';
import { useAppTheme } from '../../themes/AppThemeContext';
import { FontSize, FontWeight, Spacing, Radius } from '../../themes/palette';
import { getSessionEmail, clearSession } from '../../services/storage';
import { listSnippets } from '../../database/snippet_repo';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  const [email, setEmail] = useState('developer@devsnippets.ai');
  const [snippetCount, setSnippetCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    (async () => {
      const e = await getSessionEmail();
      if (e) setEmail(e);
      const items = await listSnippets();
      setSnippetCount(items.length);
      setFavoriteCount(items.filter((i) => i.isFavorited).length);
    })();
  }, []);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearSession();
          router.replace('/auth_screen');
        },
      },
    ]);
  };

  const username = email.split('@')[0] || 'Developer';

  return (
    <SafeContainer edges={['top']} style={[styles.screen, { backgroundColor: colors.bg }]}>
      {/* Header bar */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surfaceAlt }]} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Developer Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.overlay }]}>
          <View style={[styles.avatarWrapper, { borderColor: colors.accent }]}>
            <Ionicons name="person" size={54} color={colors.accent} />
          </View>
          <Text style={[styles.nameText, { color: colors.textPrimary }]}>{username}</Text>
          <Text style={[styles.emailText, { color: colors.textSecondary }]}>{email}</Text>

          <View style={[styles.badge, { backgroundColor: 'rgba(124, 58, 237, 0.15)', borderColor: colors.overlay }]}>
            <Ionicons name="shield-checkmark" size={14} color={colors.accentLight} />
            <Text style={[styles.badgeText, { color: colors.accentLight }]}>Cohort RN Developer</Text>
          </View>
        </View>

        {/* Stats Row */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Local Workspace Stats</Text>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.overlay }]}>
            <Ionicons name="code-slash" size={24} color={colors.accent} style={styles.statIcon} />
            <Text style={[styles.statCount, { color: colors.textPrimary }]}>{snippetCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Snippets</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.overlay }]}>
            <Ionicons name="star" size={24} color="#FFD60A" style={styles.statIcon} />
            <Text style={[styles.statCount, { color: colors.textPrimary }]}>{favoriteCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favorites</Text>
          </View>
        </View>

        {/* Options List */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account Actions</Text>

        <View style={[styles.optionsGroup, { backgroundColor: colors.surface, borderColor: colors.overlay }]}>
          <Pressable
            style={[styles.optionRow, { borderBottomColor: colors.overlay }]}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.optionText, { color: colors.textPrimary }]}>System Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.optionChevron} />
          </Pressable>

          <Pressable
            style={styles.optionRow}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.red} />
            <Text style={[styles.optionText, { color: colors.red }]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.optionChevron} />
          </Pressable>
        </View>

      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  scroll: {
    padding: Spacing.xl,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  profileCard: {
    padding: 24,
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    gap: 10,
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  nameText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  emailText: {
    fontSize: FontSize.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: 4,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    marginBottom: 4,
  },
  statCount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.heavy,
  },
  statLabel: {
    fontSize: FontSize.xs,
  },
  optionsGroup: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    marginLeft: 12,
  },
  optionChevron: {
    marginLeft: 'auto',
  },
});
