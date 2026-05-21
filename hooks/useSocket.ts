import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { useNotificationStore } from "@/stores/notification-store";
import { Message, Notification } from "@/types";

export function useSocketListeners() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const addMessage = useChatStore((s) => s.addMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit("join:user");

    const onMessage = (msg: Message) => {
      addMessage(msg.groupId, msg);
    };

    const onTypingStart = ({
      groupId,
      userId: typingId,
    }: {
      groupId: string;
      userId: string;
    }) => {
      if (typingId !== userId) setTyping(groupId, typingId, true);
    };

    const onTypingStop = ({
      groupId,
      userId: typingId,
    }: {
      groupId: string;
      userId: string;
    }) => {
      setTyping(groupId, typingId, false);
    };

    const onNotification = (n: Notification) => {
      addNotification(n);
    };

    socket.on("message:new", onMessage);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("notification:new", onNotification);

    return () => {
      socket.off("message:new", onMessage);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("notification:new", onNotification);
    };
  }, [isAuthenticated, userId, addMessage, setTyping, addNotification]);
}
