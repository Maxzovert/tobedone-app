import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";

import {

  View,

  Text,

  StyleSheet,

  TouchableOpacity,

  Alert,

  Pressable,

  FlatList,

} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { notificationsService } from "@/services/notifications.service";

import { useTheme } from "@/hooks/useTheme";

import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";

import { useNotificationsQuery } from "@/hooks/useNotificationsQuery";

import { useNotificationsTabPresence } from "@/hooks/usePushNotifications";

import { GlassCard } from "@/components/ui/GlassCard";

import { SwipeToDeleteRow } from "@/components/ui/SwipeToDeleteRow";

import { Notification } from "@/types";

import { spacing, typography, radius } from "@/constants/theme";

import {

  clearNotificationsCache,

  markAllReadInCache,

  markReadInCache,

  removeNotificationFromCache,

} from "@/lib/notificationsCache";
import { openNotificationTarget } from "@/lib/openNotificationTarget";



export default function NotificationsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();

  useNotificationsTabPresence();



  const { data, refetch, isRefetching } = useNotificationsQuery();

  const notifications = data?.notifications ?? [];



  useRefreshOnFocus(refetch);



  const markReadMutation = useMutation({

    mutationFn: (id: string) => notificationsService.markRead(id),

    onSuccess: (_, id) => markReadInCache(qc, id),

  });



  const markAllMutation = useMutation({

    mutationFn: () => notificationsService.markAllRead(),

    onSuccess: () => markAllReadInCache(qc),

  });



  const deleteMutation = useMutation({

    mutationFn: (id: string) => notificationsService.delete(id),

    onSuccess: (_, id) => removeNotificationFromCache(qc, id),

  });



  const deleteAllMutation = useMutation({

    mutationFn: () => notificationsService.deleteAll(),

    onSuccess: () => clearNotificationsCache(qc),

  });



  const confirmDelete = (item: Notification) => {

    Alert.alert("Delete alert", "Remove this notification?", [

      { text: "Cancel", style: "cancel" },

      {

        text: "Delete",

        style: "destructive",

        onPress: () => deleteMutation.mutate(item.id),

      },

    ]);

  };



  const confirmDeleteAll = () => {

    if (!notifications.length) return;

    Alert.alert("Clear all alerts", "Delete every notification?", [

      { text: "Cancel", style: "cancel" },

      {

        text: "Delete all",

        style: "destructive",

        onPress: () => deleteAllMutation.mutate(),

      },

    ]);

  };



  const handlePress = (item: Notification) => {
    if (!item.read && !markReadMutation.isPending) {
      markReadMutation.mutate(item.id);
    }
    openNotificationTarget(item);
  };



  return (

    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]}>Alerts</Text>

        <View style={styles.headerActions}>

          {notifications.length > 0 && (

            <Pressable onPress={confirmDeleteAll} hitSlop={8} style={styles.headerBtn}>

              <Ionicons name="trash-outline" size={18} color={theme.danger} />

              <Text style={[styles.headerBtnText, { color: theme.danger }]}>Clear</Text>

            </Pressable>

          )}

          <TouchableOpacity

            onPress={() => markAllMutation.mutate()}

            disabled={markAllMutation.isPending || !notifications.some((n) => !n.read)}

          >

            <Text

              style={{

                color: theme.primary,

                opacity: markAllMutation.isPending ? 0.5 : 1,

              }}

            >

              Mark all read

            </Text>

          </TouchableOpacity>

        </View>

      </View>



      <FlatList

        data={notifications}

        keyExtractor={(item) => item.id}

        contentContainerStyle={styles.list}

        showsVerticalScrollIndicator={false}

        refreshing={isRefetching}

        onRefresh={() => refetch()}

        renderItem={({ item }) => (

          <SwipeToDeleteRow

            onDelete={() => confirmDelete(item)}

            dangerColor={theme.danger}

          >

            <Pressable

              onPress={() => handlePress(item)}

              style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}

            >

              <GlassCard

                style={{

                  ...styles.card,

                  ...(!item.read

                    ? { borderColor: theme.primary, borderWidth: 1 }

                    : {}),

                }}

              >

                <View style={styles.cardTop}>

                  <Text style={[styles.notifTitle, { color: theme.text }]}>

                    {item.title}

                  </Text>

                  {!item.read && (

                    <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />

                  )}

                </View>

                {item.body ? (

                  <Text style={[styles.notifBody, { color: theme.textSecondary }]}>

                    {item.body}

                  </Text>

                ) : null}

                <Text style={[styles.notifTime, { color: theme.textSecondary }]}>

                  {new Date(item.createdAt).toLocaleString()}

                </Text>

              </GlassCard>

            </Pressable>

          </SwipeToDeleteRow>

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

    gap: spacing.sm,

  },

  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  title: { ...typography.h1, flex: 1 },

  headerActions: {

    flexDirection: "row",

    alignItems: "center",

    gap: spacing.md,

  },

  headerBtn: {

    flexDirection: "row",

    alignItems: "center",

    gap: 4,

  },

  headerBtnText: { fontSize: 14, fontWeight: "600" },

  list: { paddingBottom: 100 },

  card: {

    marginBottom: 0,

    borderRadius: radius.lg,

  },

  cardTop: {

    flexDirection: "row",

    alignItems: "flex-start",

    gap: spacing.sm,

  },

  unreadDot: {

    width: 8,

    height: 8,

    borderRadius: 4,

    marginTop: 6,

  },

  notifTitle: { ...typography.body, fontWeight: "600", flex: 1 },

  notifBody: { ...typography.caption, marginTop: 4 },

  notifTime: { ...typography.small, marginTop: spacing.xs },

  empty: { textAlign: "center", marginTop: spacing.xl, paddingHorizontal: spacing.md },

});


