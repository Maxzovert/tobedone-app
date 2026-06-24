import { QueryClient } from "@tanstack/react-query";
import { Notification } from "@/types";
import {
  filterTombstonedNotifications,
  getDeletedNotificationIdsSync,
} from "@/lib/deletedNotifications";

export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

export type NotificationsData = {
  notifications: Notification[];
  unreadCount: number;
};

function countUnread(items: Notification[]) {
  return items.filter((n) => !n.read).length;
}

function applyTombstones(items: Notification[]) {
  return filterTombstonedNotifications(items);
}

export function mergeNotificationIntoCache(qc: QueryClient, item: Notification) {
  if (getDeletedNotificationIdsSync().has(item.id)) return;

  qc.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (prev) => {
    if (!prev) {
      const notifications = [item];
      return { notifications, unreadCount: countUnread(notifications) };
    }
    if (prev.notifications.some((n) => n.id === item.id)) return prev;
    const notifications = [item, ...prev.notifications];
    return { notifications, unreadCount: countUnread(notifications) };
  });
}

export function markReadInCache(qc: QueryClient, id: string) {
  qc.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (prev) => {
    if (!prev) return prev;
    let changed = false;
    const notifications = prev.notifications.map((n) => {
      if (n.id === id && !n.read) {
        changed = true;
        return { ...n, read: true };
      }
      return n;
    });
    if (!changed) return prev;
    return { notifications, unreadCount: countUnread(notifications) };
  });
}

export function markAllReadInCache(qc: QueryClient) {
  qc.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (prev) => {
    if (!prev) return prev;
    return {
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    };
  });
}

export function removeNotificationFromCache(qc: QueryClient, id: string) {
  qc.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, (prev) => {
    if (!prev) return prev;
    const notifications = prev.notifications.filter((n) => n.id !== id);
    if (notifications.length === prev.notifications.length) return prev;
    return { notifications, unreadCount: countUnread(notifications) };
  });
}

export function setNotificationsInCache(
  qc: QueryClient,
  notifications: Notification[]
) {
  const filtered = applyTombstones(notifications);
  qc.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, {
    notifications: filtered,
    unreadCount: countUnread(filtered),
  });
}

export function clearNotificationsCache(qc: QueryClient) {
  qc.setQueryData<NotificationsData>(NOTIFICATIONS_QUERY_KEY, {
    notifications: [],
    unreadCount: 0,
  });
}
