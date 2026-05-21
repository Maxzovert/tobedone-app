import { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { messagesService } from "@/services/messages.service";
import { useChatStore } from "@/stores/chat-store";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/hooks/useTheme";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { getSocket } from "@/lib/socket";
import { spacing, typography } from "@/constants/theme";
import { Message } from "@/types";

export default function ChatScreen() {
  const { groupId, title } = useLocalSearchParams<{
    groupId: string;
    title?: string;
  }>();
  const router = useRouter();
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const messages = useChatStore((s) => s.messages[groupId!] || []);
  const typingUsers = useChatStore((s) => s.typingUsers[groupId!] || []);
  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const setActiveGroup = useChatStore((s) => s.setActiveGroup);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const listRef = useRef<FlatList>(null);

  const loadMessages = useCallback(
    async (loadCursor?: string) => {
      if (!groupId) return;
      const res = await messagesService.get(groupId, loadCursor);
      if (res.success && res.data) {
        if (loadCursor) {
          prependMessages(groupId, res.data.messages);
        } else {
          setMessages(groupId, res.data.messages);
        }
        setCursor(res.data.nextCursor);
      }
      setLoading(false);
      setLoadingMore(false);
    },
    [groupId, setMessages, prependMessages]
  );

  useEffect(() => {
    if (!groupId) return;
    setActiveGroup(groupId);
    const socket = getSocket();
    socket?.emit("join:discussion", groupId);
    loadMessages();

    return () => setActiveGroup(null);
  }, [groupId, setActiveGroup, loadMessages]);

  const handleSend = async (content: string) => {
    if (!groupId || !userId) return;

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      groupId,
      content,
      attachments: [],
      mentionedUserIds: [],
      readBy: [userId],
      createdAt: new Date().toISOString(),
      sender: {
        id: userId,
        name: useAuthStore.getState().user?.name || "You",
        avatar: useAuthStore.getState().user?.avatar || null,
        email: useAuthStore.getState().user?.email || "",
      },
    };
    addMessage(groupId, optimistic);

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("send:message", { groupId, content });
    } else {
      const res = await messagesService.send({ groupId, content });
      if (res.success && res.data) {
        addMessage(groupId, res.data);
      }
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    await messagesService.react(messageId, emoji);
  };

  const loadMore = () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    loadMessages(cursor);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          {title || "Chat"}
        </Text>
      </View>

      {typingUsers.length > 0 && (
        <Text style={[styles.typing, { color: theme.textSecondary }]}>
          Someone is typing...
        </Text>
      )}

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={theme.primary} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onReact={(emoji) => handleReact(item.id, emoji)}
            />
          )}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          inverted={false}
        />
      )}

      <ChatInput groupId={groupId!} onSend={handleSend} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  title: { ...typography.h3, flex: 1 },
  typing: { ...typography.caption, paddingHorizontal: spacing.md, fontStyle: "italic" },
  list: { paddingVertical: spacing.md, flexGrow: 1 },
});
