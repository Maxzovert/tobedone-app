import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@/types";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

async function migrateLegacyWebKey(key: string): Promise<string | null> {
  if (typeof window === "undefined" || !window.localStorage) return null;
  const legacy = localStorage.getItem(key);
  if (!legacy) return null;
  await AsyncStorage.setItem(key, legacy);
  localStorage.removeItem(key);
  return legacy;
}

export async function getStoredToken(): Promise<string | null> {
  try {
    let token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) token = await migrateLegacyWebKey(TOKEN_KEY);
    return token;
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string | null): Promise<void> {
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function getStoredUser(): Promise<User | null> {
  try {
    let raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) raw = await migrateLegacyWebKey(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: User | null): Promise<void> {
  try {
    if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    else await AsyncStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

export async function clearAuthStorage(): Promise<void> {
  await setStoredToken(null);
  await setStoredUser(null);
}
