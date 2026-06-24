import { useQuery } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications.service";
import { NOTIFICATIONS_QUERY_KEY } from "@/lib/notificationsCache";
import {
  filterTombstonedNotifications,
  getDeletedNotificationIds,
} from "@/lib/deletedNotifications";

export async function fetchNotifications() {
  await getDeletedNotificationIds();
  const res = await notificationsService.list();
  if (!res.success) throw new Error(res.error ?? "Failed to load notifications");
  const notifications = filterTombstonedNotifications(res.data!.notifications);
  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
  };
}

export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    enabled,
    staleTime: 30_000,
  });
}
