import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { FontSize as BaseFontSize } from './palette';
import { ColorsDark, ColorsLight, type ColorTokens } from './colors';
import { getFontSize, getTheme, setFontSize as saveFontSize, setTheme as saveTheme, type FontSizePreference, type ThemePreference } from '../services/prefs';

type ScaledFontSize = { [K in keyof typeof BaseFontSize]: number };

type AppThemeValue = {
  colors: ColorTokens;
  fontSize: ScaledFontSize;
  theme: ThemePreference;
  fontPreference: FontSizePreference;
  setTheme: (t: ThemePreference) => Promise<void>;
  setFontPreference: (f: FontSizePreference) => Promise<void>;
  refresh: () => Promise<void>;
};

const AppThemeContext = createContext<AppThemeValue | null>(null);

function scaleFonts(scale: number): ScaledFontSize {
  return {
    xs: Math.round(BaseFontSize.xs * scale),
    sm: Math.round(BaseFontSize.sm * scale),
    base: Math.round(BaseFontSize.base * scale),
    md: Math.round(BaseFontSize.md * scale),
    lg: Math.round(BaseFontSize.lg * scale),
    xl: Math.round(BaseFontSize.xl * scale),
    xxl: Math.round(BaseFontSize.xxl * scale),
    logo: Math.round(BaseFontSize.logo * scale),
  };
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>('dark');
  const [fontPreference, setFontPrefState] = useState<FontSizePreference>('medium');

  const load = useCallback(async () => {
    setThemeState(await getTheme());
    setFontPrefState(await getFontSize());
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync(theme === 'light' ? 'dark' : 'light').catch(() => {});
    }
  }, [theme]);

  const setTheme = useCallback(async (t: ThemePreference) => {
    await saveTheme(t);
    setThemeState(t);
  }, []);

  const setFontPreference = useCallback(async (f: FontSizePreference) => {
    await saveFontSize(f);
    setFontPrefState(f);
  }, []);

  const value = useMemo<AppThemeValue>(() => {
    const scale = fontPreference === 'small' ? 0.9 : fontPreference === 'large' ? 1.12 : 1;
    return {
      colors: theme === 'light' ? ColorsLight : ColorsDark,
      fontSize: scaleFonts(scale),
      theme,
      fontPreference,
      setTheme,
      setFontPreference,
      refresh: load,
    };
  }, [theme, fontPreference, setTheme, setFontPreference, load]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    return {
      colors: ColorsDark,
      fontSize: BaseFontSize,
      theme: 'dark',
      fontPreference: 'medium',
      setTheme: async () => {},
      setFontPreference: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}
