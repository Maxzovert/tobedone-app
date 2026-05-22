import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { projectsService } from "@/services/projects.service";
import { todosService } from "@/services/todos.service";
import { ProjectTask } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, radius } from "@/constants/theme";

type Props = {
  projectId: string;
  /** When true, list refetches (project Tasks tab is visible). */
  active?: boolean;
};

export function ProjectTasksTab({ projectId, active = true }: Props) {
  const { theme } = useTheme();
  const qc = useQueryClient();

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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
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
        <ProjectTaskRow
          task={item}
          theme={theme}
          onToggle={() => toggleMutation.mutate(item)}
          busy={toggleMutation.isPending}
        />
      )}
    />
  );
}

function ProjectTaskRow({
  task,
  theme,
  onToggle,
  busy,
}: {
  task: ProjectTask;
  theme: ReturnType<typeof useTheme>["theme"];
  onToggle: () => void;
  busy: boolean;
}) {
  const allDone = task.memberCount > 0 && task.completedCount === task.memberCount;
  const progress = `${task.completedCount}/${task.memberCount} done`;

  return (
    <Pressable
      onPress={onToggle}
      disabled={busy || !task.myTodoId}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <Ionicons
        name={task.myCompleted ? "checkbox" : "square-outline"}
        size={24}
        color={task.myCompleted ? theme.success : theme.primary}
      />
      <View style={styles.body}>
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
          <View style={[styles.badge, { backgroundColor: theme.primary + "14" }]}>
            <Ionicons name="people" size={12} color={theme.primary} />
            <Text style={[styles.badgeText, { color: theme.primary }]}>Team task</Text>
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
      </View>
    </Pressable>
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
