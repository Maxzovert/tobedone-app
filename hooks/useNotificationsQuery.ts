import { useQuery } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications.service";
import { NOTIFICATIONS_QUERY_KEY } from "@/lib/notificationsCache";

export function fetchNotifications() {
  return notificationsService.list().then((res) => {
    if (!res.success) throw new Error(res.error);
    return res.data!;
  });
}

export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    enabled,
    staleTime: 30_000,
  });
}
