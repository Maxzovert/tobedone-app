import { View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/auth-store";
import { useNotificationsQuery } from "@/hooks/useNotificationsQuery";
import { Avatar } from "@/components/ui/Avatar";
import { spacing, radius } from "@/constants/theme";

export function AppHeaderActions() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data } = useNotificationsQuery();
  const unread = data?.unreadCount ?? 0;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.push("/(app)/(tabs)/notifications")}
        style={[styles.iconBtn, { borderColor: theme.border }]}
        accessibilityRole="button"
        accessibilityLabel="Alerts"
      >
        <Ionicons name="notifications-outline" size={22} color={theme.text} />
        {unread > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.danger }]}>
            <Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
          </View>
        )}
      </Pressable>
      <TouchableOpacity
        onPress={() => router.push("/(app)/profile")}
        style={[styles.avatarBtn, { borderColor: theme.border }]}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Profile"
      >
        <Avatar name={user?.name || "User"} uri={user?.avatar} size={40} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  avatarBtn: {
    borderRadius: radius.full,
    borderWidth: 1,
    padding: 2,
  },
});
