import { Platform, PermissionsAndroid } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidPostNotifications() {
  if (Platform.OS !== "android" || Platform.Version < 33) return;
  try {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
  } catch {
    /* ignore */
  }
}

export async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Tobedone",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#6366f1",
    sound: "default",
  });
}

export async function ensureUrgentChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("urgent", {
    name: "Urgent tasks",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500, 250, 500],
    lightColor: "#ef4444",
    sound: "default",
    bypassDnd: true,
  });
}

export async function requestPushPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  await ensureAndroidPostNotifications();
  await ensureAndroidChannel();
  await ensureUrgentChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === "granted";
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn("EAS projectId missing — push tokens require app.json extra.eas.projectId");
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (err) {
    console.warn("getExpoPushTokenAsync failed:", err);
    return null;
  }
}

export function pushPlatform(): "ios" | "android" | "unknown" {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "unknown";
}
