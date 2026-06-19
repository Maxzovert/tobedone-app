import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "rq_cache:";
const MAX_AGE_MS = 1000 * 60 * 60 * 24;

type Entry = { ts: number; data: unknown };

export async function readQueryCache<T>(key: string): Promise<T | undefined> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as Entry;
    if (Date.now() - entry.ts > MAX_AGE_MS) return undefined;
    return entry.data as T;
  } catch {
    return undefined;
  }
}

export async function writeQueryCache(key: string, data: unknown): Promise<void> {
  try {
    const entry: Entry = { ts: Date.now(), data };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

export const queryCacheKeys = {
  home: "dashboard-home",
  projects: "projects-list",
  todos: "todos-list",
} as const;
