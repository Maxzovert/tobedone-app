import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Message } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius, typography } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";

interface Props {
  message: Message;
  onReact?: (emoji: string) => void;
}

const REACTIONS = ["👍", "❤️", "😂", "🎉"];

export function MessageBubble({ message, onReact }: Props) {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const isOwn = message.sender.id === userId;
  const readCount = message.readBy?.length || 0;

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
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isOwn ? theme.primary : theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Text style={{ color: isOwn ? "#fff" : theme.text }}>
            {message.content}
          </Text>
        </View>
        <View style={styles.meta}>
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
        <View style={styles.reactions}>
          {REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => onReact?.(emoji)}
              style={[styles.reactBtn, { borderColor: theme.border }]}
            >
              <Text>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
  bubbleWrap: { flex: 1, maxWidth: "80%" },
  bubbleWrapOwn: { alignItems: "flex-end" },
  sender: { ...typography.small, marginBottom: 4 },
  bubble: {
    padding: spacing.sm + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  meta: { flexDirection: "row", marginTop: 4, gap: 4 },
  time: { ...typography.small },
  read: { ...typography.small },
  reactions: { flexDirection: "row", gap: 6, marginTop: 6 },
  reactBtn: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
