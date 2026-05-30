import * as SecureStore from 'expo-secure-store';

const ONBOARDING = 'onboarding_complete';
const SESSION = 'auth_session';
const API_KEY = 'openai_api_key';

export async function isOnboardingComplete(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ONBOARDING)) === 'true';
}

export async function setOnboardingComplete(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING, 'true');
}

export async function hasSession(): Promise<boolean> {
  return !!(await SecureStore.getItemAsync(SESSION));
}

export async function setSession(email: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION, JSON.stringify({ email }));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION);
}

export async function getSessionEmail(): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw).email ?? null;
  } catch {
    return null;
  }
}

export async function getApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(API_KEY);
}

export async function setApiKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(API_KEY, key.trim());
}
