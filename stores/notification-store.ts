import { create } from "zustand";
import { Notification } from "@/types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (items: Notification[], unread: number) => void;
  addNotification: (item: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (items, unread) =>
    set({ notifications: items, unreadCount: unread }),

  addNotification: (item) =>
    set((s) => ({
      notifications: [item, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}));
