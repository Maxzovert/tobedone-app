import { create } from "zustand";
import { LinkedTaskPreview, Message } from "@/types";

interface ChatState {
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  activeGroupId: string | null;
  setActiveGroup: (groupId: string | null) => void;
  setMessages: (groupId: string, messages: Message[]) => void;
  prependMessages: (groupId: string, messages: Message[]) => void;
  addMessage: (groupId: string, message: Message) => void;
  toggleReaction: (
    groupId: string,
    messageId: string,
    userId: string,
    userName: string,
    emoji: string
  ) => void;
  updateLinkedTask: (
    groupId: string,
    taskId: string,
    patch: Partial<LinkedTaskPreview>
  ) => void;
  setTyping: (groupId: string, userId: string, isTyping: boolean) => void;
  clearGroup: (groupId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  typingUsers: {},
  activeGroupId: null,

  setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

  setMessages: (groupId, messages) =>
    set((s) => ({
      messages: { ...s.messages, [groupId]: messages },
    })),

  prependMessages: (groupId, newMsgs) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [groupId]: [...newMsgs, ...(s.messages[groupId] || [])],
      },
    })),

  addMessage: (groupId, message) =>
    set((s) => {
      const existing = s.messages[groupId] || [];
      if (existing.some((m) => m.id === message.id)) return s;
      const withoutStaleOptimistic = existing.filter(
        (m) =>
          !(
            m.id.startsWith("temp-") &&
            m.sender.id === message.sender.id &&
            m.content === message.content
          )
      );
      return {
        messages: {
          ...s.messages,
          [groupId]: [...withoutStaleOptimistic, message],
        },
      };
    }),

  updateLinkedTask: (groupId, taskId, patch) =>
    set((s) => {
      const msgs = s.messages[groupId];
      if (!msgs) return s;
      return {
        messages: {
          ...s.messages,
          [groupId]: msgs.map((m) =>
            m.linkedTask?.id === taskId
              ? { ...m, linkedTask: { ...m.linkedTask!, ...patch } }
              : m
          ),
        },
      };
    }),

  toggleReaction: (groupId, messageId, userId, userName, emoji) =>
    set((s) => {
      const msgs = s.messages[groupId];
      if (!msgs) return s;
      return {
        messages: {
          ...s.messages,
          [groupId]: msgs.map((m) => {
            if (m.id !== messageId) return m;
            const reactions = [...(m.reactions || [])];
            const idx = reactions.findIndex(
              (r) => r.userId === userId && r.emoji === emoji
            );
            if (idx >= 0) {
              reactions.splice(idx, 1);
            } else {
              reactions.push({
                id: `temp-reaction-${Date.now()}`,
                messageId,
                emoji,
                userId,
                userName,
              });
            }
            return { ...m, reactions };
          }),
        },
      };
    }),

  setTyping: (groupId, userId, isTyping) =>
    set((s) => {
      const current = s.typingUsers[groupId] || [];
      const updated = isTyping
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId);
      return {
        typingUsers: { ...s.typingUsers, [groupId]: updated },
      };
    }),

  clearGroup: (groupId) =>
    set((s) => {
      const { [groupId]: _, ...rest } = s.messages;
      return { messages: rest };
    }),
}));
