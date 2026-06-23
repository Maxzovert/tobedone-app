import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchHome } from "@/lib/fetchQueries";
import { todosService } from "@/services/todos.service";
import { tasksService } from "@/services/tasks.service";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/auth-store";
import { AppHeaderActions } from "@/components/ui/AppHeaderActions";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing, typography, radius, ThemeColors } from "@/constants/theme";
import { Project, Task, Todo } from "@/types";
import { ProjectIcon } from "@/components/projects/ProjectIcon";
import { TaskRespondModal } from "@/components/todos/TaskRespondModal";

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [respondTarget, setRespondTarget] = useState<{
    taskId: string;
    title: string;
    action: "accept" | "reject";
  } | null>(null);

  const { data, isLoading, isFetching, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard", "home"],
    queryFn: fetchHome,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });

  const showSectionSkeleton = !data && (isLoading || isFetching);

  const toggleTodo = useMutation({
    mutationFn: (todo: Todo) => {
      if (todo.task?.status === "pending") {
        return Promise.resolve({ success: true as const, data: todo });
      }
      if (todo.task?.status === "in_progress") {
        return todosService.update(todo.id, {
          taskStatus: todo.completed ? "in_progress" : "completed",
        });
      }
      return todosService.update(todo.id, { completed: !todo.completed });
    },
    onMutate: async (todo) => {
      if (todo.task?.status === "pending") return;
      await qc.cancelQueries({ queryKey: ["dashboard", "home"] });
      qc.setQueryData(["dashboard", "home"], (old: typeof data) => {
        if (!old) return old;
        const nextCompleted = !todo.completed;
        return {
          ...old,
          pendingTodos: old.pendingTodos
            .map((t) =>
              t.id === todo.id
                ? {
                    ...t,
                    completed: nextCompleted,
                    task: t.task
                      ? {
                          ...t.task,
                          status:
                            t.task.status === "in_progress"
                              ? nextCompleted
                                ? "completed"
                                : "in_progress"
                              : t.task.status,
                        }
                      : t.task,
                  }
                : t
            )
            .filter((t) => !t.completed && t.task?.status !== "completed"),
        };
      });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard", "home"] }),
  });

  const respondTask = useMutation({
    mutationFn: ({
      id,
      action,
      note,
    }: {
      id: string;
      action: "accept" | "reject";
      note?: string;
    }) => tasksService.respond(id, action, note),
    onSuccess: () => setRespondTarget(null),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
      qc.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const stats = data?.stats;
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.name, { color: theme.text }]}>{firstName}</Text>
          </View>
          <AppHeaderActions />
        </View>

        <View style={styles.metrics}>
          {showSectionSkeleton ? (
            <View style={styles.loadingRow}>
              <Skeleton height={72} style={{ flex: 1 }} borderRadius={radius.lg} />
              <Skeleton height={72} style={{ flex: 1 }} borderRadius={radius.lg} />
              <Skeleton height={72} style={{ flex: 1 }} borderRadius={radius.lg} />
            </View>
          ) : (
            <>
              <MetricPill
                icon="folder-open-outline"
                label="Projects"
                value={stats?.projects ?? 0}
                theme={theme}
              />
              <MetricPill
                icon="time-outline"
                label="Pending"
                value={stats?.pendingTasks ?? 0}
                theme={theme}
              />
              <MetricPill
                icon="checkmark-done-outline"
                label="Done"
                value={stats?.completedTasks ?? 0}
                theme={theme}
              />
            </>
          )}
        </View>

        {showSectionSkeleton ? (
          <Skeleton height={120} borderRadius={radius.lg} style={{ marginTop: spacing.md }} />
        ) : (
          <>
        <SectionHeader
          title="Projects"
          count={data?.projects.length}
          onPress={() => router.push("/(app)/(tabs)/projects")}
          theme={theme}
        />
        {data?.projects.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.projectScroll}
          >
            {data.projects.map((project) => (
              <ProjectTile
                key={project.id}
                project={project}
                theme={theme}
                onPress={() => router.push(`/(app)/project/${project.id}`)}
              />
            ))}
          </ScrollView>
        ) : (
          <EmptyBlock
            icon="folder-outline"
            message="No projects yet"
            theme={theme}
            onPress={() => router.push("/(app)/(tabs)/projects")}
            actionLabel="Create project"
          />
        )}

        <SectionHeader
          title="Today's todos"
          count={data?.pendingTodos.length}
          onPress={() => router.push("/(app)/(tabs)/todos")}
          theme={theme}
        />
        {data?.pendingTodos.length ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {data.pendingTodos.map((todo, i) => (
              <TodoRow
                key={todo.id}
                todo={todo}
                theme={theme}
                isLast={i === data.pendingTodos.length - 1}
                onToggle={() => toggleTodo.mutate(todo)}
                onAccept={
                  todo.task?.status === "pending"
                    ? () =>
                        setRespondTarget({
                          taskId: todo.task!.id,
                          title: todo.title,
                          action: "accept",
                        })
                    : undefined
                }
                onReject={
                  todo.task?.status === "pending"
                    ? () =>
                        setRespondTarget({
                          taskId: todo.task!.id,
                          title: todo.title,
                          action: "reject",
                        })
                    : undefined
                }
              />
            ))}
          </View>
        ) : (
          <EmptyBlock
            icon="checkbox-outline"
            message="All caught up on todos"
            theme={theme}
          />
        )}

        {(data?.assignedTasks.length ?? 0) > 0 && (
          <>
            <SectionHeader title="Assigned to you" theme={theme} />
            {data?.assignedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                theme={theme}
                onAccept={() =>
                  setRespondTarget({ taskId: task.id, title: task.title, action: "accept" })
                }
                onReject={() =>
                  setRespondTarget({ taskId: task.id, title: task.title, action: "reject" })
                }
              />
            ))}
          </>
        )}
          </>
        )}
      </ScrollView>

      <TaskRespondModal
        visible={!!respondTarget}
        title={respondTarget?.title ?? ""}
        action={respondTarget?.action ?? "accept"}
        loading={respondTask.isPending}
        onClose={() => setRespondTarget(null)}
        onSubmit={(note) => {
          if (!respondTarget) return;
          respondTask.mutate({
            id: respondTarget.taskId,
            action: respondTarget.action,
            note: note || undefined,
          });
        }}
      />
    </SafeAreaView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function SectionHeader({
  title,
  count,
  onPress,
  theme,
}: {
  title: string;
  count?: number;
  onPress?: () => void;
  theme: ThemeColors;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        {count !== undefined && count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: theme.primary + "18" }]}>
            <Text style={[styles.countText, { color: theme.primary }]}>{count}</Text>
          </View>
        )}
      </View>
      {onPress && (
        <Pressable onPress={onPress} hitSlop={8}>
          <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
        </Pressable>
      )}
    </View>
  );
}

function MetricPill({
  icon,
  label,
  value,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  theme: ThemeColors;
}) {
  return (
    <View style={[styles.metricPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.metricIcon, { backgroundColor: theme.primary + "12" }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function ProjectTile({
  project,
  theme,
  onPress,
}: {
  project: Project;
  theme: ThemeColors;
  onPress: () => void;
}) {
  const color = project.color || theme.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.projectTile,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.projectIcon, { backgroundColor: color + "22" }]}>
        <ProjectIcon icon={project.icon} size={22} color={color} />
      </View>
      <Text style={[styles.projectName, { color: theme.text }]} numberOfLines={2}>
        {project.name}
      </Text>
      <Ionicons name="arrow-forward" size={16} color={theme.textSecondary} style={styles.projectArrow} />
    </Pressable>
  );
}

function TodoRow({
  todo,
  theme,
  isLast,
  onToggle,
  onAccept,
  onReject,
}: {
  todo: Todo;
  theme: ThemeColors;
  isLast: boolean;
  onToggle: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const isPending = todo.task?.status === "pending";

  if (isPending && onAccept && onReject) {
    return (
      <View style={[styles.todoRow, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.todoText, { color: theme.text }]} numberOfLines={2}>
            {todo.title}
          </Text>
          <Text style={[styles.pendingHint, { color: theme.warning }]}>Assigned · respond</Text>
        </View>
        <View style={styles.inlineActions}>
          <Pressable onPress={onAccept} hitSlop={6}>
            <Ionicons name="checkmark-circle" size={28} color={theme.success} />
          </Pressable>
          <Pressable onPress={onReject} hitSlop={6}>
            <Ionicons name="close-circle" size={28} color={theme.danger} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onToggle}
      style={[styles.todoRow, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
    >
      <View style={[styles.checkbox, { borderColor: theme.primary }]}>
        <Ionicons name="checkmark" size={14} color="transparent" />
      </View>
      <Text style={[styles.todoText, { color: theme.text }]} numberOfLines={2}>
        {todo.title}
      </Text>
    </Pressable>
  );
}

function TaskCard({
  task,
  theme,
  onAccept,
  onReject,
}: {
  task: Task;
  theme: ThemeColors;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <View style={[styles.taskCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.taskHeader}>
        <View style={[styles.taskDot, { backgroundColor: theme.warning }]} />
        <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={2}>
          {task.title}
        </Text>
      </View>
      <View style={styles.taskActions}>
        <Pressable
          onPress={onAccept}
          style={[styles.taskBtn, { backgroundColor: theme.success + "14" }]}
        >
          <Ionicons name="checkmark" size={16} color={theme.success} />
          <Text style={[styles.taskBtnText, { color: theme.success }]}>Accept</Text>
        </Pressable>
        <Pressable
          onPress={onReject}
          style={[styles.taskBtn, { backgroundColor: theme.danger + "14" }]}
        >
          <Ionicons name="close" size={16} color={theme.danger} />
          <Text style={[styles.taskBtnText, { color: theme.danger }]}>Decline</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EmptyBlock({
  icon,
  message,
  theme,
  onPress,
  actionLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
  theme: ThemeColors;
  onPress?: () => void;
  actionLabel?: string;
}) {
  return (
    <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Ionicons name={icon} size={28} color={theme.textSecondary} />
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{message}</Text>
      {onPress && actionLabel && (
        <Pressable onPress={onPress}>
          <Text style={[styles.emptyAction, { color: theme.primary }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: 110 },
  loading: { padding: spacing.md },
  loadingRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerLeft: { flex: 1 },
  greeting: { ...typography.caption, marginBottom: 2 },
  name: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  metrics: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  metricPill: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm + 2,
    alignItems: "center",
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  metricValue: { fontSize: 20, fontWeight: "700" },
  metricLabel: { ...typography.small, marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { ...typography.h3, fontWeight: "700" },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countText: { fontSize: 12, fontWeight: "700" },
  seeAll: { fontSize: 14, fontWeight: "600" },
  projectScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  projectTile: {
    width: 148,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  projectIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  projectName: { fontSize: 15, fontWeight: "600", lineHeight: 20, flex: 1 },
  projectArrow: { marginTop: spacing.sm, alignSelf: "flex-end" },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  todoText: { ...typography.body, flex: 1, lineHeight: 22 },
  pendingHint: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  inlineActions: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  taskCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  taskHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  taskDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  taskTitle: { ...typography.body, fontWeight: "600", flex: 1, lineHeight: 22 },
  taskActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  taskBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  taskBtnText: { fontSize: 14, fontWeight: "600" },
  empty: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  emptyText: { ...typography.caption, textAlign: "center" },
  emptyAction: { fontSize: 14, fontWeight: "600" },
});
