import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationStore } from "@/stores/notification-store";
import { registerPushWithBackend } from "@/lib/pushRegistration";

export function usePushNotifications(enabled: boolean) {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const receivedListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    (async () => {
      if (!cancelled) await registerPushWithBackend();
    })();

    receivedListener.current = Notifications.addNotificationReceivedListener(
      (event) => {
        const data = event.request.content.data as {
          notificationId?: string;
          type?: string;
        };
        const { title, body } = event.request.content;
        if (title && data?.notificationId) {
          addNotification({
            id: data.notificationId,
            userId: "",
            title: title ?? "Notification",
            body: body ?? null,
            type: (data.type as string) ?? "general",
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(() => {
        router.push("/(app)/(tabs)/notifications");
      });

    return () => {
      cancelled = true;
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [enabled, addNotification]);
}
