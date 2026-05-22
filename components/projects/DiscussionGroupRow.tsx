import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TaskGroup } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, radius } from "@/constants/theme";
import { discussionIconOrDefault } from "@/constants/discussionIcons";

interface Props {
  group: TaskGroup;
}

export function DiscussionGroupRow({ group }: Props) {
  const router = useRouter();
  const { theme } = useTheme();
  const iconName = discussionIconOrDefault(group.icon);

  return (
    <Pressable
      onPress={() => {
        const title = encodeURIComponent(group.name);
        const project = encodeURIComponent(group.projectId);
        router.push(`/(app)/chat/${group.id}?title=${title}&projectId=${project}`);
      }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          shadowColor: theme.cardShadow,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.iconBubble, { backgroundColor: theme.primary }]}>
        <Ionicons name={iconName} size={20} color={theme.onPrimary} />
      </View>
      <View style={styles.nameWrap}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {group.name}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                group.groupType === "admin"
                  ? theme.accent + "20"
                  : theme.primary + "12",
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: group.groupType === "admin" ? theme.accent : theme.primary,
              },
            ]}
          >
            {group.groupType === "admin" ? "Admin · Tasks" : "Normal"}
          </Text>
        </View>
      </View>
      <View style={[styles.chevronBubble, { backgroundColor: theme.background }]}>
        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  nameWrap: { flex: 1, minWidth: 0, gap: 4 },
  name: { ...typography.body, fontWeight: "600" },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  chevronBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
