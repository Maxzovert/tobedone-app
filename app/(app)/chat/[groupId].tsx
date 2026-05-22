import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { messagesService } from "@/services/messages.service";
import { projectsService } from "@/services/projects.service";
import { useChatStore } from "@/stores/chat-store";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/hooks/useTheme";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { TaskRespondModal } from "@/components/todos/TaskRespondModal";
import { tasksService } from "@/services/tasks.service";
import { getSocket } from "@/lib/socket";
import { spacing, typography, radius } from "@/constants/theme";
import { Message, ChatSendPayload, GroupType } from "@/types";
import { isDiscussionGroup } from "@/constants/discussionIcons";

const EMPTY_MESSAGES: Message[] = [];
const EMPTY_TYPING: string[] = [];

function paramString(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    groupId: string | string[];
    title?: string | string[];
    projectId?: string | string[];
  }>();
  const groupId = paramString(params.groupId);
  const projectId = paramString(params.projectId);
  const rawTitle = paramString(params.title);
  const title = rawTitle ? decodeURIComponent(rawTitle) : undefined;
  const router = useRouter();
  const { theme } = useTheme();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const messages = useChatStore((s) =>
    groupId ? (s.messages[groupId] ?? EMPTY_MESSAGES) : EMPTY_MESSAGES
  );
  const typingUsers = useChatStore((s) =>
    groupId ? (s.typingUsers[groupId] ?? EMPTY_TYPING) : EMPTY_TYPING
  );
  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const toggleReaction = useChatStore((s) => s.toggleReaction);
  const updateLinkedTask = useChatStore((s) => s.updateLinkedTask);
  const setActiveGroup = useChatStore((s) => s.setActiveGroup);
  const userName = useAuthStore((s) => s.user?.name) ?? "You";
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [reactionMessageId, setReactionMessageId] = useState<string | null>(null);
  const [taskActionId, setTaskActionId] = useState<string | null>(null);
  const [respondTarget, setRespondTarget] = useState<{
    taskId: string;
    title: string;
    action: "accept" | "reject";
  } | null>(null);
  const listRef = useRef<FlatList>(null);

  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await projectsService.get(projectId!);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!projectId,
  });

  const members = projectData?.members ?? [];
  const isOwner = projectData?.isOwner ?? false;

  const discussionGroup = useMemo(
    () => projectData?.taskGroups.find((g) => g.id === groupId && isDiscussionGroup(g)),
    [projectData?.taskGroups, groupId]
  );
  const groupType: GroupType = discussionGroup?.groupType ?? "general";
  const isAdminGroup = groupType === "admin";
  const canPost = !isAdminGroup || isOwner;

  const taskBucketId = projectData?.taskBucketId ?? null;

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

  const handleSend = (payload: ChatSendPayload) => {
    if (!groupId || !canPost) return;

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("send:message", { groupId, ...payload });
    } else {
      void messagesService.send({ groupId, ...payload }).then((res) => {
        if (res.success && res.data) addMessage(groupId, res.data);
      });
    }

    if (payload.assignTask) {
      qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!groupId || !userId) return;
    toggleReaction(groupId, messageId, userId, userName, emoji);
    setReactionMessageId(null);
    await messagesService.react(messageId, emoji);
  };

  const patchTaskInChat = (taskId: string, status: string) => {
    if (!groupId) return;
    updateLinkedTask(groupId, taskId, { status });
  };

  const invalidateTaskQueries = () => {
    qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
    qc.invalidateQueries({ queryKey: ["todos"] });
  };

  const respondTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      action,
      note,
    }: {
      taskId: string;
      action: "accept" | "reject";
      note?: string;
    }) => tasksService.respond(taskId, action, note),
    onMutate: ({ taskId, action }) => {
      setTaskActionId(taskId);
      patchTaskInChat(taskId, action === "accept" ? "in_progress" : "rejected");
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        patchTaskInChat(res.data.id, res.data.status);
      }
      setRespondTarget(null);
      invalidateTaskQueries();
    },
    onError: (_e, { taskId }) => {
      patchTaskInChat(taskId, "pending");
    },
    onSettled: () => setTaskActionId(null),
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      tasksService.update(taskId, { status }),
    onMutate: ({ taskId, status }) => {
      setTaskActionId(taskId);
      patchTaskInChat(taskId, status);
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        patchTaskInChat(res.data.id, res.data.status);
      }
      invalidateTaskQueries();
    },
    onSettled: () => setTaskActionId(null),
  });

  const loadMore = () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    loadMessages(cursor);
  };

  if (!groupId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Chat unavailable</Text>
        </View>
        <Text style={[styles.typing, { color: theme.textSecondary, textAlign: "center", marginTop: 24 }]}>
          Missing group. Go back and open the discussion again.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title || "Chat"}
          </Text>
          {isAdminGroup && (
            <Text style={[styles.groupTypeHint, { color: theme.textSecondary }]}>
              Admin group
            </Text>
          )}
        </View>
      </View>

      {!canPost && (
        <View style={[styles.readOnlyBanner, { backgroundColor: theme.primary + "12" }]}>
          <Ionicons name="shield-checkmark" size={16} color={theme.primary} />
          <Text style={[styles.readOnlyText, { color: theme.textSecondary }]}>
            Admin group: only the owner can post here. Use the + button on a normal group to chat with everyone.
          </Text>
        </View>
      )}

      {typingUsers.length > 0 && canPost && (
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
          renderItem={({ item }) => {
            const task = item.linkedTask;
            const taskBusy = !!task && taskActionId === task.id;
            return (
              <MessageBubble
                message={item}
                reactionPickerOpen={reactionMessageId === item.id}
                taskLoading={taskBusy}
                onPressMessage={
                  canPost
                    ? () =>
                        setReactionMessageId((current) =>
                          current === item.id ? null : item.id
                        )
                    : undefined
                }
                onReact={(emoji) => handleReact(item.id, emoji)}
                onTaskAccept={
                  task
                    ? () =>
                        setRespondTarget({
                          taskId: task.id,
                          title: task.title,
                          action: "accept",
                        })
                    : undefined
                }
                onTaskReject={
                  task
                    ? () =>
                        setRespondTarget({
                          taskId: task.id,
                          title: task.title,
                          action: "reject",
                        })
                    : undefined
                }
                onTaskComplete={
                  task
                    ? () =>
                        updateTaskStatusMutation.mutate({
                          taskId: task.id,
                          status: "completed",
                        })
                    : undefined
                }
                onTaskReopen={
                  task
                    ? () =>
                        updateTaskStatusMutation.mutate({
                          taskId: task.id,
                          status: "in_progress",
                        })
                    : undefined
                }
              />
            );
          }}
          contentContainerStyle={styles.list}
          onScrollBeginDrag={() => setReactionMessageId(null)}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          inverted={false}
        />
      )}

      {canPost && (
        <ChatInput
          groupId={groupId}
          projectId={projectId ?? null}
          members={members}
          taskGroupId={taskBucketId}
          currentUserId={userId ?? ""}
          onSend={handleSend}
        />
      )}

      <TaskRespondModal
        visible={!!respondTarget}
        title={respondTarget?.title ?? ""}
        action={respondTarget?.action ?? "accept"}
        loading={respondTaskMutation.isPending}
        onClose={() => setRespondTarget(null)}
        onSubmit={(note) => {
          if (!respondTarget) return;
          respondTaskMutation.mutate({
            taskId: respondTarget.taskId,
            action: respondTarget.action,
            note: note || undefined,
          });
        }}
      />
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
  headerTitles: { flex: 1, minWidth: 0 },
  title: { ...typography.h3 },
  groupTypeHint: { ...typography.caption, marginTop: 2 },
  readOnlyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  readOnlyText: { ...typography.caption, flex: 1 },
  typing: { ...typography.caption, paddingHorizontal: spacing.md, fontStyle: "italic" },
  list: { paddingVertical: spacing.md, flexGrow: 1 },
});
