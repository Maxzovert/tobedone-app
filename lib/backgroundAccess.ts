import { Alert, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import {
  ensureAndroidChannel,
  ensureAndroidPostNotifications,
  ensureUrgentChannel,
} from "@/lib/pushNotifications";

const BATTERY_PROMPT_KEY = "tobedone-battery-prompt-shown";

/**
 * Asks the user for notification access (required for push + local task reminders).
 * Does not keep the app running 24/7 — scheduled notifications fire from the OS.
 */
export async function requestNotificationAccess(): Promise<boolean> {
  if (!Device.isDevice || Platform.OS === "web") return false;

  await ensureAndroidPostNotifications();
  await ensureAndroidChannel();
  await ensureUrgentChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return status === "granted";
}

/**
 * One-time prompt on Android to disable battery restrictions so alerts are not delayed.
 */
export async function promptUnrestrictedBackgroundIfNeeded(): Promise<void> {
  if (Platform.OS !== "android" || !Device.isDevice) return;

  try {
    const shown = await AsyncStorage.getItem(BATTERY_PROMPT_KEY);
    if (shown === "1") return;

    const granted = await requestNotificationAccess();
    if (!granted) {
      await AsyncStorage.setItem(BATTERY_PROMPT_KEY, "1");
      Alert.alert(
        "Notifications needed",
        "Turn on notifications for Tobedone so task reminders and urgent alerts can reach you when the app is closed.",
        [
          { text: "Later", style: "cancel" },
          { text: "Open settings", onPress: () => void Linking.openSettings() },
        ]
      );
      return;
    }

    await AsyncStorage.setItem(BATTERY_PROMPT_KEY, "1");
    Alert.alert(
      "Allow background alerts",
      "On the next screen, set Battery to Unrestricted (or Don't optimize) for Tobedone so urgent task alarms and reminders are not delayed.",
      [
        { text: "Not now", style: "cancel" },
        {
          text: "Open settings",
          onPress: () => void Linking.openSettings(),
        },
      ]
    );
  } catch {
    /* ignore */
  }
}

export async function ensureBackgroundAccess(): Promise<void> {
  await requestNotificationAccess();
  await promptUnrestrictedBackgroundIfNeeded();
}
