import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { notificationsService } from "@/services/notifications.service";
import { useNotificationStore } from "@/stores/notification-store";
import { useTheme } from "@/hooks/useTheme";
import { GlassCard } from "@/components/ui/GlassCard";
import { spacing, typography } from "@/constants/theme";

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await notificationsService.list();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });

  useEffect(() => {
    if (data) {
      setNotifications(data.notifications, data.unreadCount);
    }
  }, [data, setNotifications]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: (_, id) => markRead(id),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => markAllRead(),
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        <TouchableOpacity onPress={() => markAllMutation.mutate()}>
          <Text style={{ color: theme.primary }}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data?.notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => !item.read && markReadMutation.mutate(item.id)}
          >
            <GlassCard
              style={[
                styles.card,
                !item.read && { borderColor: theme.primary, borderWidth: 1 },
              ]}
            >
              <Text style={[styles.notifTitle, { color: theme.text }]}>
                {item.title}
              </Text>
              {item.body && (
                <Text style={[styles.notifBody, { color: theme.textSecondary }]}>
                  {item.body}
                </Text>
              )}
              <Text style={[styles.notifTime, { color: theme.textSecondary }]}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </GlassCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.textSecondary }]}>
            No notifications yet
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  title: { ...typography.h1 },
  list: { padding: spacing.md },
  card: { marginBottom: spacing.sm },
  notifTitle: { ...typography.body, fontWeight: "600" },
  notifBody: { ...typography.caption, marginTop: 4 },
  notifTime: { ...typography.small, marginTop: spacing.xs },
  empty: { textAlign: "center", marginTop: spacing.xl },
});
