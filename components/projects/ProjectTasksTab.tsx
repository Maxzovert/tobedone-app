import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { projectsService } from "@/services/projects.service";
import { todosService } from "@/services/todos.service";
import { tasksService } from "@/services/tasks.service";
import { ProjectTask } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, radius } from "@/constants/theme";
import { formatDueDate } from "@/components/tasks/DueDateTimePicker";
import { priorityColor, priorityLabel } from "@/components/tasks/PriorityPicker";
import { TaskEditSheet } from "@/components/tasks/TaskEditSheet";

type Props = {
  projectId: string;
  active?: boolean;
};

export function ProjectTasksTab({ projectId, active = true }: Props) {
  const { theme } = useTheme();
  const qc = useQueryClient();
  const [editTask, setEditTask] = useState<ProjectTask | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["project", projectId, "tasks"],
    queryFn: async () => {
      const res = await projectsService.listProjectTasks(projectId);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (active) refetch();
  }, [active, projectId, refetch]);

  const toggleMutation = useMutation({
    mutationFn: (task: ProjectTask) => {
      if (!task.myTodoId) throw new Error("Todo not found");
      return todosService.update(task.myTodoId, { completed: !task.myCompleted });
    },
    onMutate: async (task) => {
      await qc.cancelQueries({ queryKey: ["project", projectId, "tasks"] });
      const prev = qc.getQueryData<ProjectTask[]>(["project", projectId, "tasks"]);
      qc.setQueryData<ProjectTask[]>(["project", projectId, "tasks"], (old) =>
        old?.map((t) =>
          t.id === task.id
            ? {
                ...t,
                myCompleted: !t.myCompleted,
                completedCount: t.myCompleted
                  ? Math.max(0, t.completedCount - 1)
                  : t.completedCount + 1,
              }
            : t
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["project", projectId, "tasks"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "tasks"] });
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => tasksService.delete(taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "tasks"] });
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
    },
  });

  const confirmDelete = (task: ProjectTask) => {
    Alert.alert("Delete task", `Remove "${task.title}" for the whole team?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(task.id),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={styles.list}
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          !(data?.length) && styles.listContentEmpty,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <View style={[styles.empty, { borderColor: theme.border }]}>
            <Ionicons name="people-outline" size={32} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No project tasks yet. Tap + to assign a team task.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SwipeableTaskRow
            task={item}
            theme={theme}
            onToggle={() => toggleMutation.mutate(item)}
            onEdit={() => setEditTask(item)}
            onDelete={() => confirmDelete(item)}
            busy={toggleMutation.isPending || deleteMutation.isPending}
          />
        )}
      />

      <TaskEditSheet
        visible={!!editTask}
        task={editTask}
        onClose={() => setEditTask(null)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["project", projectId, "tasks"] });
          qc.invalidateQueries({ queryKey: ["todos"] });
          qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
        }}
      />
    </>
  );
}

function SwipeableTaskRow({
  task,
  theme,
  onToggle,
  onEdit,
  onDelete,
  busy,
}: {
  task: ProjectTask;
  theme: ReturnType<typeof useTheme>["theme"];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const swipeRef = useRef<Swipeable>(null);

  const renderRight = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });
    return (
      <Pressable
        onPress={() => {
          swipeRef.current?.close();
          onDelete();
        }}
        style={[styles.deleteAction, { backgroundColor: theme.danger }]}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRight}
      overshootRight={false}
      friction={2}
    >
      <ProjectTaskRow
        task={task}
        theme={theme}
        onToggle={onToggle}
        onEdit={onEdit}
        busy={busy}
      />
    </Swipeable>
  );
}

function ProjectTaskRow({
  task,
  theme,
  onToggle,
  onEdit,
  busy,
}: {
  task: ProjectTask;
  theme: ReturnType<typeof useTheme>["theme"];
  onToggle: () => void;
  onEdit: () => void;
  busy: boolean;
}) {
  const allDone = task.memberCount > 0 && task.completedCount === task.memberCount;
  const progress = `${task.completedCount}/${task.memberCount} done`;
  const due = formatDueDate(task.dueDate);
  const pColor = priorityColor(task.priority);

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <Pressable onPress={onToggle} disabled={busy || !task.myTodoId} hitSlop={4}>
        <Ionicons
          name={task.myCompleted ? "checkbox" : "square-outline"}
          size={24}
          color={task.myCompleted ? theme.success : theme.primary}
        />
      </Pressable>
      <Pressable onPress={onEdit} style={styles.body} disabled={busy}>
        <Text
          style={[
            styles.taskTitle,
            {
              color: theme.text,
              textDecorationLine: task.myCompleted ? "line-through" : "none",
              opacity: task.myCompleted ? 0.7 : 1,
            },
          ]}
        >
          {task.title}
        </Text>
        {task.description ? (
          <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <View style={[styles.badge, { backgroundColor: pColor + "18" }]}>
            <Text style={[styles.badgeText, { color: pColor }]}>
              {priorityLabel(task.priority)}
            </Text>
          </View>
          {due ? (
            <View style={[styles.badge, { backgroundColor: theme.primary + "14" }]}>
              <Ionicons name="time-outline" size={11} color={theme.primary} />
              <Text style={[styles.badgeText, { color: theme.primary }]}>{due}</Text>
            </View>
          ) : null}
          <View style={[styles.badge, { backgroundColor: theme.primary + "14" }]}>
            <Ionicons name="people" size={12} color={theme.primary} />
            <Text style={[styles.badgeText, { color: theme.primary }]}>Team</Text>
          </View>
          <Text style={[styles.progress, { color: allDone ? theme.success : theme.textSecondary }]}>
            {progress}
          </Text>
          {task.creatorName ? (
            <Text style={[styles.by, { color: theme.textSecondary }]}>
              · {task.creatorName}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable onPress={onEdit} hitSlop={8}>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: 100, gap: spacing.sm },
  listContentEmpty: { flexGrow: 1, justifyContent: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: spacing.xl },
  empty: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
  },
  emptyText: { ...typography.caption, textAlign: "center" },
  deleteAction: {
    width: 72,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    borderRadius: radius.lg,
    marginVertical: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.md,
  },
  body: { flex: 1, minWidth: 0 },
  taskTitle: { ...typography.body, fontWeight: "600" },
  desc: { ...typography.small, marginTop: 4 },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  progress: { fontSize: 12, fontWeight: "600" },
  by: { fontSize: 12 },
});
