import { create } from "zustand";
import { Message } from "@/types";

interface ChatState {
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  activeGroupId: string | null;
  setActiveGroup: (groupId: string | null) => void;
  setMessages: (groupId: string, messages: Message[]) => void;
  prependMessages: (groupId: string, messages: Message[]) => void;
  addMessage: (groupId: string, message: Message) => void;
  updateReaction: (groupId: string, messageId: string, reaction: unknown) => void;
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
      return {
        messages: {
          ...s.messages,
          [groupId]: [...existing, message],
        },
      };
    }),

  updateReaction: (_groupId, _messageId, _reaction) => {
    // Reactions refresh on next fetch; socket handler can extend this
  },

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
