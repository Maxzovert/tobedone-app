import { Platform } from "react-native";
import { notificationsService } from "@/services/notifications.service";
import {
  getExpoPushToken,
  pushPlatform,
  requestPushPermissions,
} from "@/lib/pushNotifications";

let lastRegisteredToken: string | null = null;

export async function registerPushWithBackend(): Promise<void> {
  if (Platform.OS === "web") return;

  const granted = await requestPushPermissions();
  if (!granted) return;

  const token = await getExpoPushToken();
  if (!token || lastRegisteredToken === token) return;

  const res = await notificationsService.registerPushToken(token, pushPlatform());
  if (res.success) lastRegisteredToken = token;
}

export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS === "web") return;
  if (!lastRegisteredToken) return;
  await notificationsService.removePushToken(lastRegisteredToken);
  lastRegisteredToken = null;
}
