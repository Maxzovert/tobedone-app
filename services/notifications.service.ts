import { api } from "@/lib/api";
import { Notification } from "@/types";

async function deleteNotification(id: string) {
  const post = await api.postEmpty<{ deleted: boolean; id: string }>(
    `/notifications/${id}/remove`
  );
  if (post.success) return post;
  return api.delete<{ deleted: boolean; id: string }>(`/notifications/${id}`);
}

async function deleteAllNotifications() {
  const post = await api.postEmpty<{ deleted: boolean }>(
    "/notifications/clear-all"
  );
  if (post.success) return post;
  return api.delete<{ deleted: boolean }>("/notifications/all");
}

export const notificationsService = {
  list: () =>
    api.get<{ notifications: Notification[]; unreadCount: number }>(
      "/notifications"
    ),
  markRead: (id: string) => api.patch<Notification>("/notifications/read", { id }),
  markAllRead: () => api.patch<{ success: boolean }>("/notifications/read-all"),
  delete: deleteNotification,
  deleteAll: deleteAllNotifications,
  registerPushToken: (token: string, platform: string) =>
    api.post<{ registered: boolean }>("/notifications/push-token", {
      token,
      platform,
    }),
  removePushToken: (token: string) =>
    api.post<{ removed: boolean }>("/notifications/push-token/remove", { token }),
};
