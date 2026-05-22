import { api } from "@/lib/api";
import { Message } from "@/types";

export const messagesService = {
  get: (groupId: string, cursor?: string) => {
    const params = cursor ? `?cursor=${cursor}&limit=30` : "?limit=30";
    return api.get<{ messages: Message[]; nextCursor?: string }>(
      `/messages/${groupId}${params}`
    );
  },
  send: (data: {
    groupId: string;
    content: string;
    attachments?: string[];
    mentionedUserIds?: string[];
    linkedTaskId?: string;
    assignTask?: {
      title: string;
      assignedTo: string;
      taskGroupId: string;
    };
  }) => api.post<Message>("/messages", data),
  react: (messageId: string, emoji: string) =>
    api.post<unknown>("/messages/react", { messageId, emoji }),
};
