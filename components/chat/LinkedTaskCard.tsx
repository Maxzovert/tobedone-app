import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinkedTaskPreview } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius, typography } from "@/constants/theme";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; colorKey: "warning" | "primary" | "success" | "danger" | "textSecondary" }
> = {
  pending: { label: "Pending", icon: "time-outline", colorKey: "warning" },
  in_progress: { label: "In progress", icon: "play-circle-outline", colorKey: "primary" },
  completed: { label: "Completed", icon: "checkmark-circle-outline", colorKey: "success" },
  rejected: { label: "Declined", icon: "close-circle-outline", colorKey: "danger" },
};

function statusMeta(status: string) {
  return STATUS_CONFIG[status] ?? { label: status.replace(/_/g, " "), icon: "ellipse-outline" as const, colorKey: "textSecondary" as const };
}

type Props = {
  task: LinkedTaskPreview;
  isAssignee: boolean;
  canManageStatus?: boolean;
  alignEnd?: boolean;
  loading?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onMarkComplete?: () => void;
  onReopen?: () => void;
};

export function LinkedTaskCard({
  task,
  isAssignee,
  canManageStatus = false,
  alignEnd,
  loading,
  onAccept,
  onReject,
  onMarkComplete,
  onReopen,
}: Props) {
  const { theme } = useTheme();
  const meta = statusMeta(task.status);
  const statusColor = theme[meta.colorKey];
  const canRespond = isAssignee && task.status === "pending";
  const canComplete =
    (isAssignee || canManageStatus) && task.status === "in_progress";
  const canReopen =
    (isAssignee || canManageStatus) && task.status === "completed";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          alignSelf: alignEnd ? "flex-end" : "flex-start",
        },
        isAssignee && { borderColor: theme.primary + "40" },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: theme.primary + "14" }]}>
          <Ionicons name="clipboard-outline" size={18} color={theme.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.kicker, { color: theme.textSecondary }]}>
            {isAssignee ? "Assigned to you" : "Task"}
          </Text>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={3}>
            {task.title}
          </Text>
        </View>
      </View>

      {!isAssignee && task.assigneeName ? (
        <Text style={[styles.assignee, { color: theme.textSecondary }]}>
          Assignee: {task.assigneeName}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
          <Ionicons name={meta.icon} size={14} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>{meta.label}</Text>
        </View>
        <Text style={[styles.priority, { color: theme.textSecondary }]}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
        </Text>
      </View>

      {loading && (
        <ActivityIndicator size="small" color={theme.primary} style={styles.loader} />
      )}

      {canRespond && !loading && (
        <View style={styles.actions}>
          <Pressable
            onPress={onAccept}
            style={({ pressed }) => [
              styles.btn,
              styles.btnPrimary,
              { backgroundColor: theme.success + "16", opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="checkmark" size={16} color={theme.success} />
            <Text style={[styles.btnText, { color: theme.success }]}>Accept</Text>
          </Pressable>
          <Pressable
            onPress={onReject}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: theme.danger + "12", opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="close" size={16} color={theme.danger} />
            <Text style={[styles.btnText, { color: theme.danger }]}>Decline</Text>
          </Pressable>
        </View>
      )}

      {canComplete && !loading && (
        <Pressable
          onPress={onMarkComplete}
          style={({ pressed }) => [
            styles.btn,
            styles.btnFull,
            { backgroundColor: theme.primary + "14", opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="checkmark-done" size={16} color={theme.primary} />
          <Text style={[styles.btnText, { color: theme.primary }]}>Mark complete</Text>
        </Pressable>
      )}

      {canReopen && !loading && (
        <Pressable
          onPress={onReopen}
          style={({ pressed }) => [
            styles.btn,
            styles.btnFull,
            { backgroundColor: theme.border, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="refresh-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.btnText, { color: theme.textSecondary }]}>Reopen</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  header: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, minWidth: 0 },
  kicker: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  title: { ...typography.body, fontWeight: "700", marginTop: 2, lineHeight: 22 },
  assignee: { fontSize: 13 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  priority: { fontSize: 12 },
  loader: { marginTop: 4 },
  actions: { flexDirection: "row", gap: spacing.sm },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  btnPrimary: {},
  btnFull: { flex: undefined, width: "100%" },
  btnText: { fontSize: 14, fontWeight: "600" },
});
