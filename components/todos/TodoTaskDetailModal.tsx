import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Todo } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, radius, ThemeColors } from "@/constants/theme";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  rejected: "Declined",
};

type Props = {
  visible: boolean;
  todo: Todo | null;
  loading?: boolean;
  onClose: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onMarkComplete?: () => void;
  onReopen?: () => void;
  onToggleMyDone?: () => void;
};

function InfoRow({
  icon,
  label,
  value,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: ThemeColors;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={theme.textSecondary} />
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
}

export function TodoTaskDetailModal({
  visible,
  todo,
  loading,
  onClose,
  onAccept,
  onReject,
  onMarkComplete,
  onReopen,
  onToggleMyDone,
}: Props) {
  const { theme } = useTheme();
  const task = todo?.task;
  if (!todo || !task) return null;

  const isProject = task.scope === "project";
  const isPending = !isProject && task.status === "pending";
  const isInProgress = task.status === "in_progress";
  const isCompleted = task.status === "completed";
  const isRejected = task.status === "rejected";

  const statusColor =
    task.status === "completed"
      ? theme.success
      : task.status === "rejected"
        ? theme.danger
        : task.status === "pending"
          ? theme.warning
          : theme.primary;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.text }]} numberOfLines={2}>
              {task.title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={26} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>
              {STATUS_LABELS[task.status] ?? task.status}
            </Text>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {task.description ? (
              <Text style={[styles.description, { color: theme.text }]}>{task.description}</Text>
            ) : null}

            <View style={[styles.section, { borderColor: theme.border }]}>
              {task.projectName ? (
                <InfoRow
                  icon="folder-outline"
                  label="Project"
                  value={task.projectName}
                  theme={theme}
                />
              ) : null}
              {task.sourceGroupName ? (
                <InfoRow
                  icon="chatbubbles-outline"
                  label="Group"
                  value={
                    task.sourceGroupType === "admin"
                      ? `${task.sourceGroupName} (Admin)`
                      : task.sourceGroupName
                  }
                  theme={theme}
                />
              ) : null}
              {task.creatorName ? (
                <InfoRow
                  icon="person-outline"
                  label="Created by"
                  value={task.creatorName}
                  theme={theme}
                />
              ) : null}
              {!isProject && task.assigneeName ? (
                <InfoRow
                  icon="person-circle-outline"
                  label="Assigned to"
                  value={task.assigneeName}
                  theme={theme}
                />
              ) : null}
              <InfoRow
                icon="flag-outline"
                label="Priority"
                value={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                theme={theme}
              />
              {task.dueDate ? (
                <InfoRow
                  icon="calendar-outline"
                  label="Due"
                  value={new Date(task.dueDate).toLocaleString()}
                  theme={theme}
                />
              ) : null}
              {isProject &&
              task.memberCount != null &&
              task.completedCount != null ? (
                <InfoRow
                  icon="people-outline"
                  label="Team progress"
                  value={`${task.completedCount} of ${task.memberCount} done`}
                  theme={theme}
                />
              ) : null}
              {task.responseNote ? (
                <InfoRow
                  icon="document-text-outline"
                  label="Response note"
                  value={task.responseNote}
                  theme={theme}
                />
              ) : null}
            </View>

            {loading ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: spacing.md }} />
            ) : (
              <View style={styles.actions}>
                {isPending && (
                  <>
                    <Pressable
                      onPress={onAccept}
                      style={[styles.actionBtn, { backgroundColor: theme.success + "16" }]}
                    >
                      <Ionicons name="checkmark" size={18} color={theme.success} />
                      <Text style={[styles.actionText, { color: theme.success }]}>Accept</Text>
                    </Pressable>
                    <Pressable
                      onPress={onReject}
                      style={[styles.actionBtn, { backgroundColor: theme.danger + "12" }]}
                    >
                      <Ionicons name="close" size={18} color={theme.danger} />
                      <Text style={[styles.actionText, { color: theme.danger }]}>Decline</Text>
                    </Pressable>
                  </>
                )}
                {isProject && !isPending && (
                  <Pressable
                    onPress={onToggleMyDone}
                    style={[styles.actionBtn, { backgroundColor: theme.primary + "14" }]}
                  >
                    <Ionicons
                      name={todo.completed ? "refresh-outline" : "checkmark-done"}
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={[styles.actionText, { color: theme.primary }]}>
                      {todo.completed ? "Mark not done" : "Mark my part done"}
                    </Text>
                  </Pressable>
                )}
                {!isProject && isInProgress && (
                  <Pressable
                    onPress={onMarkComplete}
                    style={[styles.actionBtn, { backgroundColor: theme.primary + "14" }]}
                  >
                    <Ionicons name="checkmark-done" size={18} color={theme.primary} />
                    <Text style={[styles.actionText, { color: theme.primary }]}>Mark complete</Text>
                  </Pressable>
                )}
                {!isProject && isCompleted && (
                  <Pressable
                    onPress={onReopen}
                    style={[styles.actionBtn, { backgroundColor: theme.border }]}
                  >
                    <Ionicons name="refresh-outline" size={18} color={theme.textSecondary} />
                    <Text style={[styles.actionText, { color: theme.textSecondary }]}>
                      Reopen task
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "88%",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  sheetTitle: { ...typography.h2, flex: 1, fontWeight: "700" },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  statusPillText: { fontSize: 13, fontWeight: "700" },
  scroll: { maxHeight: 420 },
  description: { ...typography.body, marginBottom: spacing.md, lineHeight: 22 },
  section: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  infoValue: { ...typography.body, marginTop: 2 },
  actions: { gap: spacing.sm, paddingBottom: spacing.md },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  actionText: { fontSize: 15, fontWeight: "600" },
});
