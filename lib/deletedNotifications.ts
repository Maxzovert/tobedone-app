import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "tobedone-deleted-notifications";

let tombstones = new Set<string>();
let loaded = false;

async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const ids = JSON.parse(raw) as string[];
      tombstones = new Set(ids);
    }
  } catch {
    tombstones = new Set();
  }
  loaded = true;
}

export async function getDeletedNotificationIds(): Promise<Set<string>> {
  await ensureLoaded();
  return tombstones;
}

export function getDeletedNotificationIdsSync(): Set<string> {
  return tombstones;
}

export async function tombstoneNotification(id: string) {
  await ensureLoaded();
  tombstones.add(id);
  await AsyncStorage.setItem(KEY, JSON.stringify([...tombstones]));
}

export async function clearNotificationTombstones() {
  tombstones = new Set();
  loaded = true;
  await AsyncStorage.removeItem(KEY);
}

export async function removeNotificationTombstone(id: string) {
  await ensureLoaded();
  tombstones.delete(id);
  await AsyncStorage.setItem(KEY, JSON.stringify([...tombstones]));
}

export function filterTombstonedNotifications<T extends { id: string }>(
  items: T[]
): T[] {
  if (!tombstones.size) return items;
  return items.filter((item) => !tombstones.has(item.id));
}
