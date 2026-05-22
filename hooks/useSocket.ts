import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { useNotificationStore } from "@/stores/notification-store";
import { Message, Notification } from "@/types";

export function useSocketListeners() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  const addMessage = useChatStore((s) => s.addMessage);
  const updateLinkedTask = useChatStore((s) => s.updateLinkedTask);
  const activeGroupId = useChatStore((s) => s.activeGroupId);
  const setTyping = useChatStore((s) => s.setTyping);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit("join:user");

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
      addNotification(n);
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

    socket.on("message:new", onMessage);
    socket.on("task:updated", onTaskUpdated);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("notification:new", onNotification);

    return () => {
      socket.off("message:new", onMessage);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("task:updated", onTaskUpdated);
      socket.off("notification:new", onNotification);
    };
  }, [
    isAuthenticated,
    userId,
    activeGroupId,
    addMessage,
    updateLinkedTask,
    setTyping,
    addNotification,
    qc,
  ]);
}
