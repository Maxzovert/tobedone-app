import AsyncStorage from "@react-native-async-storage/async-storage";

const SNOOZE_KEY = "task-reminder-snooze";

type SnoozeMap = Record<string, string>;

const dismissedThisCycle = new Set<string>();

async function readMap(key: string): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function writeMap(key: string, map: Record<string, string>) {
  await AsyncStorage.setItem(key, JSON.stringify(map));
}

export async function getSnoozeUntil(taskId: string): Promise<Date | null> {
  const map = await readMap(SNOOZE_KEY);
  const iso = map[taskId];
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function snoozeTaskOneHour(taskId: string) {
  const map = await readMap(SNOOZE_KEY);
  const until = new Date(Date.now() + 60 * 60 * 1000);
  map[taskId] = until.toISOString();
  await writeMap(SNOOZE_KEY, map);
  dismissedThisCycle.delete(taskId);
}

export async function clearSnooze(taskId: string) {
  const map = await readMap(SNOOZE_KEY);
  delete map[taskId];
  await writeMap(SNOOZE_KEY, map);
}

export function isDismissedThisCycle(taskId: string): boolean {
  return dismissedThisCycle.has(taskId);
}

export function dismissAlarmCycle(taskIds: string[]) {
  for (const id of taskIds) dismissedThisCycle.add(id);
}

export function clearDismissCycle(taskIds: string[]) {
  for (const id of taskIds) dismissedThisCycle.delete(id);
}
