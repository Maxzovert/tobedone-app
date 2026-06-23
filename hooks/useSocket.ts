import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { mergeNotificationIntoCache } from "@/lib/notificationsCache";
import { Message, Notification } from "@/types";

export function useSocketListeners(enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  const addMessage = useChatStore((s) => s.addMessage);
  const updateLinkedTask = useChatStore((s) => s.updateLinkedTask);
  const activeGroupId = useChatStore((s) => s.activeGroupId);
  const setTyping = useChatStore((s) => s.setTyping);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !userId) return;

    let socket = getSocket();
    let cleaned = false;

    const onMessage = (msg: Message) => {
      addMessage(msg.groupId, msg);
      if (msg.linkedTask?.assignedTo === userId) {
        qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
      }
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
      mergeNotificationIntoCache(qc, n);
    };

    const onTaskUpdated = ({
      taskId,
      status,
    }: {
      taskId: string;
      status: string;
    }) => {
      if (activeGroupId) {
        updateLinkedTask(activeGroupId, taskId, { status });
      }
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
    };

    const attach = () => {
      if (cleaned) return;
      socket = getSocket();
      if (!socket) return;
      socket.emit("join:user");
      socket.on("message:new", onMessage);
      socket.on("task:updated", onTaskUpdated);
      socket.on("typing:start", onTypingStart);
      socket.on("typing:stop", onTypingStop);
      socket.on("notification:new", onNotification);
    };

    const timer = setTimeout(attach, 400);

    return () => {
      cleaned = true;
      clearTimeout(timer);
      socket?.off("message:new", onMessage);
      socket?.off("typing:start", onTypingStart);
      socket?.off("typing:stop", onTypingStop);
      socket?.off("task:updated", onTaskUpdated);
      socket?.off("notification:new", onNotification);
    };
  }, [
    enabled,
    isAuthenticated,
    userId,
    activeGroupId,
    addMessage,
    updateLinkedTask,
    setTyping,
    qc,
  ]);
}
