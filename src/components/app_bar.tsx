import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useAppTheme } from '../themes/AppThemeContext';
import { FontSize, FontWeight, Spacing, Radius } from '../themes/palette';

interface AppBarProps {
  title: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export default function AppBar({ title, leftAction, rightAction }: AppBarProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const { colors } = useAppTheme();

  const handleMenu = useCallback(() => {
    navigation.dispatch(DrawerActions.openDrawer());
  }, [navigation]);

  const handleProfile = useCallback(() => {
    router.push('/profile');
  }, [router]);

  return (
    <View style={[styles.topBarContent, { borderBottomColor: colors.overlay }]}>
      {leftAction ?? (
        <Pressable onPress={handleMenu} style={[styles.iconBtn, { backgroundColor: colors.surfaceAlt, borderColor: colors.overlay }]} hitSlop={8}>
          <Ionicons name="menu-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      )}
      
      <Text style={[styles.appTitle, { color: colors.textPrimary }]}>{title}</Text>
      
      {rightAction ?? (
        <Pressable onPress={handleProfile} style={styles.profileBtn} hitSlop={8}>
          <View style={[styles.profileCircle, { backgroundColor: colors.surfaceAlt, borderColor: colors.overlay }]}>
            <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBarContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  appTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, letterSpacing: 0.5 },
  profileBtn: { alignItems: 'center', justifyContent: 'center' },
  profileCircle: {
    width: 38, height: 38, borderRadius: Radius.circle,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
});
