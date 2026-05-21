import { api } from "@/lib/api";
import { Notification } from "@/types";

export const notificationsService = {
  list: () =>
    api.get<{ notifications: Notification[]; unreadCount: number }>(
      "/notifications"
    ),
  markRead: (id: string) => api.patch<Notification>("/notifications/read", { id }),
  markAllRead: () => api.patch<{ success: boolean }>("/notifications/read-all"),
};
