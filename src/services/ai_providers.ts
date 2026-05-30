import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { AiProviderDefinition } from '../models/aiProvider';

const ACTIVE_ID = 'active_ai_provider_id';
const CUSTOM_KEY = 'custom_ai_providers';
const KEYS_STORE = 'ai_provider_keys';

export const BUILTIN_PROVIDERS: AiProviderDefinition[] = [
  { id: 'groq', name: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile', builtIn: true },
  { id: 'openai', name: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', builtIn: true },
  { id: 'together', name: 'Together AI', url: 'https://api.together.xyz/v1/chat/completions', model: 'meta-llama/Llama-3-8b-chat-hf', builtIn: true },
];

export async function getAllProviders(): Promise<AiProviderDefinition[]> {
  const raw = await AsyncStorage.getItem(CUSTOM_KEY);
  const custom: AiProviderDefinition[] = raw ? JSON.parse(raw) : [];
  return [...BUILTIN_PROVIDERS, ...custom];
}

export async function getActiveProviderId(): Promise<string> {
  return (await AsyncStorage.getItem(ACTIVE_ID)) ?? 'groq';
}

export async function setActiveProviderId(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_ID, id);
}

export async function getActiveProvider(): Promise<AiProviderDefinition> {
  const id = await getActiveProviderId();
  const all = await getAllProviders();
  return all.find((p) => p.id === id) ?? BUILTIN_PROVIDERS[0];
}

async function readKeys(): Promise<Record<string, string>> {
  const raw = await SecureStore.getItemAsync(KEYS_STORE);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function getProviderApiKey(providerId: string): Promise<string | null> {
  const keys = await readKeys();
  if (keys[providerId]?.trim()) return keys[providerId].trim();
  const legacy = await SecureStore.getItemAsync('openai_api_key');
  if (legacy?.trim() && (providerId === 'openai' || providerId === 'groq')) {
    return legacy.trim();
  }
  return null;
}

export async function setProviderApiKey(providerId: string, key: string): Promise<void> {
  const keys = await readKeys();
  keys[providerId] = key.trim();
  await SecureStore.setItemAsync(KEYS_STORE, JSON.stringify(keys));
}

export async function saveCustomProvider(provider: AiProviderDefinition): Promise<void> {
  const raw = await AsyncStorage.getItem(CUSTOM_KEY);
  const list: AiProviderDefinition[] = raw ? JSON.parse(raw) : [];
  const i = list.findIndex((p) => p.id === provider.id);
  const entry = { ...provider, builtIn: false };
  if (i >= 0) list[i] = entry;
  else list.push(entry);
  await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
}

export async function deleteCustomProvider(id: string): Promise<void> {
  const raw = await AsyncStorage.getItem(CUSTOM_KEY);
  const list: AiProviderDefinition[] = raw ? JSON.parse(raw) : [];
  await AsyncStorage.setItem(CUSTOM_KEY, JSON.stringify(list.filter((p) => p.id !== id)));
  const keys = await readKeys();
  delete keys[id];
  await SecureStore.setItemAsync(KEYS_STORE, JSON.stringify(keys));
}

export function newCustomProviderId(): string {
  return `custom-${Date.now()}`;
}
