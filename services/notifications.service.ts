import { api, ApiResult } from "@/lib/api";
import { Notification } from "@/types";

async function runDeleteAttempts<T>(
  attempts: Array<() => Promise<ApiResult<T>>>
): Promise<ApiResult<T>> {
  const errors: string[] = [];

  for (const attempt of attempts) {
    const res = await attempt();
    if (res.success) return res;
    if (res.error) errors.push(res.error);
    else if (res.httpStatus) errors.push(`HTTP ${res.httpStatus}`);
  }

  return {
    success: false,
    httpStatus: 0,
    error:
      errors[0] ??
      "Could not delete alerts. Pull to refresh, then try again.",
  };
}

async function deleteNotification(id: string) {
  return runDeleteAttempts([
    () => api.patch<{ deleted: boolean; id: string }>("/notifications/delete", { id }),
    () => api.postEmpty<{ deleted: boolean; id: string }>(`/notifications/${id}/remove`),
    () => api.delete<{ deleted: boolean; id: string }>(`/notifications/${id}`),
  ]);
}

async function deleteAllNotifications() {
  return runDeleteAttempts([
    () => api.patch<{ deleted: boolean }>("/notifications/clear-all", {}),
    () => api.postEmpty<{ deleted: boolean }>("/notifications/clear-all"),
    () => api.delete<{ deleted: boolean }>("/notifications/all"),
  ]);
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
