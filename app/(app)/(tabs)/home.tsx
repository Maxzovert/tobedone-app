import { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { dashboardService } from "@/services/dashboard.service";
import { todosService } from "@/services/todos.service";
import { tasksService } from "@/services/tasks.service";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/auth-store";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing, typography, radius } from "@/constants/theme";

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard", "home"],
    queryFn: async () => {
      const res = await dashboardService.home();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });

  const toggleTodo = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      todosService.update(id, { completed: !completed }),
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: ["dashboard", "home"] });
      const prev = qc.getQueryData(["dashboard", "home"]);
      qc.setQueryData(["dashboard", "home"], (old: typeof data) => {
        if (!old) return old;
        return {
          ...old,
          pendingTodos: old.pendingTodos
            .map((t) => (t.id === id ? { ...t, completed: !completed } : t))
            .filter((t) => !t.completed),
        };
      });
      return { prev };
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard", "home"] }),
  });

  const respondTask = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "reject" }) =>
      tasksService.respond(id, action),
    onSettled: () => qc.invalidateQueries({ queryKey: ["dashboard", "home"] }),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Skeleton height={32} width="60%" style={{ margin: spacing.md }} />
        <Skeleton height={100} style={{ margin: spacing.md }} />
        <Skeleton height={100} style={{ margin: spacing.md }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              Welcome back
            </Text>
            <Text style={[styles.name, { color: theme.text }]}>
              {user?.name?.split(" ")[0] || "there"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(app)/profile")}>
            <Ionicons name="person-circle" size={40} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.statsCard}>
          <Text style={[styles.statsTitle, { color: theme.text }]}>
            Productivity
          </Text>
          <Text style={[styles.statsValue, { color: theme.primary }]}>
            {data?.stats.productivity ?? 0}%
          </Text>
          <View style={styles.statsRow}>
            <Stat label="Projects" value={data?.stats.projects ?? 0} theme={theme} />
            <Stat label="Tasks" value={data?.stats.pendingTasks ?? 0} theme={theme} />
            <Stat label="Done" value={data?.stats.completedTasks ?? 0} theme={theme} />
          </View>
        </GlassCard>

        <Section title="Projects" theme={theme}>
          {data?.projects.length ? (
            data.projects.map((p) => <ProjectCard key={p.id} project={p} />)
          ) : (
            <Text style={{ color: theme.textSecondary }}>No projects yet</Text>
          )}
        </Section>

        <Section title="Pending Todos" theme={theme}>
          {data?.pendingTodos.map((todo) => (
            <TouchableOpacity
              key={todo.id}
              style={[styles.todoRow, { borderColor: theme.border }]}
              onPress={() =>
                toggleTodo.mutate({ id: todo.id, completed: todo.completed })
              }
            >
              <Ionicons
                name={todo.completed ? "checkbox" : "square-outline"}
                size={22}
                color={theme.primary}
              />
              <Text style={[styles.todoText, { color: theme.text }]}>
                {todo.title}
              </Text>
            </TouchableOpacity>
          ))}
        </Section>

        <Section title="Assigned Tasks" theme={theme}>
          {data?.assignedTasks.map((task) => (
            <GlassCard key={task.id} style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.taskTitle, { color: theme.text }]}>
                {task.title}
              </Text>
              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={[styles.taskBtn, { backgroundColor: theme.success + "22" }]}
                  onPress={() =>
                    respondTask.mutate({ id: task.id, action: "accept" })
                  }
                >
                  <Text style={{ color: theme.success }}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.taskBtn, { backgroundColor: theme.danger + "22" }]}
                  onPress={() =>
                    respondTask.mutate({ id: task.id, action: "reject" })
                  }
                >
                  <Text style={{ color: theme.danger }}>Reject</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function Stat({
  label,
  value,
  theme,
}: {
  label: string;
  value: number;
  theme: ReturnType<typeof useTheme>["theme"];
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.md, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  greeting: { ...typography.caption },
  name: { ...typography.h1 },
  statsCard: { marginBottom: spacing.lg },
  statsTitle: { ...typography.caption },
  statsValue: { fontSize: 40, fontWeight: "700", marginVertical: spacing.sm },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statValue: { ...typography.h3 },
  statLabel: { ...typography.small },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  todoText: { ...typography.body, flex: 1 },
  taskTitle: { ...typography.body, fontWeight: "600" },
  taskActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  taskBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
});
