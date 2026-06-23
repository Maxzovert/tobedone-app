import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { registerPushWithBackend } from "@/lib/pushRegistration";
import { mergeNotificationIntoCache } from "@/lib/notificationsCache";
import { openPushNotificationData } from "@/lib/openNotificationTarget";

let notificationsTabActive = false;

export function useNotificationsTabPresence() {
  useEffect(() => {
    notificationsTabActive = true;
    return () => {
      notificationsTabActive = false;
    };
  }, []);
}

export function usePushNotifications(enabled: boolean) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    (async () => {
      if (!cancelled) await registerPushWithBackend();
    })();

    const receivedListener = Notifications.addNotificationReceivedListener(
      (event) => {
        const data = event.request.content.data as {
          notificationId?: string;
          type?: string;
          groupId?: string;
          projectId?: string;
          groupName?: string;
        };
        const { title, body } = event.request.content;
        if (!title || !data?.notificationId || !userId) return;

        const chatData =
          data.groupId && data.projectId
            ? {
                groupId: data.groupId,
                projectId: data.projectId,
                groupName: data.groupName ?? "Chat",
              }
            : null;

        mergeNotificationIntoCache(qc, {
          id: data.notificationId,
          userId,
          title: title ?? "Notification",
          body: body ?? null,
          type: (data.type as string) ?? "general",
          data: chatData,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<
          string,
          unknown
        >;
        if (openPushNotificationData(data)) return;
        if (notificationsTabActive) return;
        router.navigate("/(app)/(tabs)/notifications");
      });

    return () => {
      cancelled = true;
      receivedListener.remove();
      responseListener.remove();
    };
  }, [enabled, userId, qc]);
}
