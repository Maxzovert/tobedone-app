import { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Message } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius, typography } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { LinkedTaskCard } from "@/components/chat/LinkedTaskCard";

interface Props {
  message: Message;
  reactionPickerOpen?: boolean;
  onPressMessage?: () => void;
  onReact?: (emoji: string) => void;
  taskLoading?: boolean;
  onTaskAccept?: () => void;
  onTaskReject?: () => void;
  onTaskComplete?: () => void;
  onTaskReopen?: () => void;
}

const REACTION_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

function renderContent(
  content: string,
  theme: { primary: string; text: string; onPrimary?: string },
  isOwn: boolean
) {
  const parts = content.split(/(@[^\s\n]+)/g);
  const textColor = isOwn ? theme.onPrimary ?? theme.text : theme.text;
  const mentionColor = isOwn ? theme.onPrimary ?? theme.primary : theme.primary;
  return parts.map((part, i) => (
    <Text
      key={i}
      style={{
        color: part.startsWith("@") ? mentionColor : textColor,
        fontWeight: part.startsWith("@") ? "700" : "400",
      }}
    >
      {part}
    </Text>
  ));
}

export function MessageBubble({
  message,
  reactionPickerOpen = false,
  onPressMessage,
  onReact,
  taskLoading,
  onTaskAccept,
  onTaskReject,
  onTaskComplete,
  onTaskReopen,
}: Props) {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const isOwn = message.sender.id === userId;
  const readCount = message.readBy?.length || 0;
  const task = message.linkedTask;
  const isAssignee = task?.assignedTo === userId;
  const canManageStatus =
    !!task && (isAssignee || message.sender.id === userId);

  const reactionSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of message.reactions ?? []) {
      map.set(r.emoji, (map.get(r.emoji) ?? 0) + 1);
    }
    return [...map.entries()];
  }, [message.reactions]);

  const myReaction = (message.reactions ?? []).find((r) => r.userId === userId)?.emoji;

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      {!isOwn && (
        <Avatar name={message.sender.name} uri={message.sender.avatar} size={32} />
      )}
      <View style={[styles.bubbleWrap, isOwn && styles.bubbleWrapOwn]}>
        {!isOwn && (
          <Text style={[styles.sender, { color: theme.textSecondary }]}>
            {message.sender.name}
          </Text>
        )}
        {reactionPickerOpen && (
          <View
            style={[
              styles.pickerBubble,
              isOwn ? styles.pickerBubbleOwn : styles.pickerBubbleOther,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: theme.cardShadow,
              },
            ]}
          >
            {REACTION_OPTIONS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => onReact?.(emoji)}
                style={({ pressed }) => [
                  styles.pickerEmoji,
                  myReaction === emoji && {
                    backgroundColor: theme.primary + "18",
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable
          onPress={onPressMessage}
          style={({ pressed }) => [
            styles.bubble,
            {
              backgroundColor: isOwn ? theme.primary : theme.surface,
              borderColor: reactionPickerOpen ? theme.primary : theme.border,
            },
            pressed && { opacity: 0.92 },
          ]}
        >
          <Text>
            {renderContent(
              message.content,
              {
                primary: theme.primary,
                text: theme.text,
                onPrimary: theme.onPrimary,
              },
              isOwn
            )}
          </Text>
          {isOwn && message.mentionedUserIds.length > 0 && (
            <Text style={[styles.mentionHint, { color: theme.onPrimary + "cc" }]}>
              Mentioned {message.mentionedUserIds.length}{" "}
              {message.mentionedUserIds.length === 1 ? "person" : "people"}
            </Text>
          )}
        </Pressable>

        {task && (
          <LinkedTaskCard
            task={task}
            isAssignee={!!isAssignee}
            canManageStatus={canManageStatus}
            alignEnd={isOwn}
            loading={taskLoading}
            onAccept={isAssignee ? onTaskAccept : undefined}
            onReject={isAssignee ? onTaskReject : undefined}
            onMarkComplete={canManageStatus ? onTaskComplete : undefined}
            onReopen={canManageStatus ? onTaskReopen : undefined}
          />
        )}

        <View style={[styles.metaRow, isOwn && styles.metaRowOwn]}>
          <Text style={[styles.time, { color: theme.textSecondary }]}>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {readCount > 1 && (
            <Text style={[styles.read, { color: theme.textSecondary }]}>
              · {readCount} read
            </Text>
          )}
        </View>

        {reactionSummary.length > 0 && (
          <View style={[styles.appliedRow, isOwn && styles.appliedRowOwn]}>
            {reactionSummary.map(([emoji, count]) => (
              <Pressable
                key={emoji}
                onPress={() => onReact?.(emoji)}
                style={[
                  styles.appliedChip,
                  {
                    backgroundColor: theme.surface,
                    borderColor:
                      myReaction === emoji ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={styles.appliedEmoji}>{emoji}</Text>
                {count > 1 && (
                  <Text style={[styles.appliedCount, { color: theme.textSecondary }]}>
                    {count}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowOwn: { flexDirection: "row-reverse" },
  bubbleWrap: { flex: 1, maxWidth: "82%", minWidth: 0 },
  bubbleWrapOwn: { alignItems: "flex-end" },
  sender: { ...typography.small, marginBottom: 4 },
  bubble: {
    padding: spacing.sm + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  mentionHint: { fontSize: 11, marginTop: 4 },
  metaRow: { flexDirection: "row", marginTop: 4, gap: 4 },
  metaRowOwn: { justifyContent: "flex-end" },
  time: { ...typography.small },
  read: { ...typography.small },
  appliedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  appliedRowOwn: { justifyContent: "flex-end" },
  appliedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  appliedEmoji: { fontSize: 14 },
  appliedCount: { fontSize: 11, fontWeight: "600" },
  pickerBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 2,
    marginBottom: 6,
    alignSelf: "flex-start",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerBubbleOwn: { alignSelf: "flex-end" },
  pickerBubbleOther: { alignSelf: "flex-start" },
  pickerEmoji: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: { fontSize: 22 },
});
