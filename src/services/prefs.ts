import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActiveProviderId, setActiveProviderId } from './ai_providers';

const THEME_KEY = 'theme_preference';
const FONT_KEY = 'font_size_preference';

export type ThemePreference = 'dark' | 'light';
export type FontSizePreference = 'small' | 'medium' | 'large';

export async function getTheme(): Promise<ThemePreference> {
  const v = await AsyncStorage.getItem(THEME_KEY);
  return v === 'light' ? 'light' : 'dark';
}

export async function setTheme(theme: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, theme);
}

export async function getFontSize(): Promise<FontSizePreference> {
  const v = await AsyncStorage.getItem(FONT_KEY);
  if (v === 'small' || v === 'large') return v;
  return 'medium';
}

export async function setFontSize(size: FontSizePreference): Promise<void> {
  await AsyncStorage.setItem(FONT_KEY, size);
}

/** @deprecated Use ai_providers service — kept so older bundles do not crash */
export type AiProvider = 'groq' | 'openai';

export async function getAiProvider(): Promise<AiProvider> {
  const id = await getActiveProviderId();
  return id === 'openai' ? 'openai' : 'groq';
}

export async function setAiProvider(provider: AiProvider): Promise<void> {
  await setActiveProviderId(provider);
}
