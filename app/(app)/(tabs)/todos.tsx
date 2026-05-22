import { useState } from "react";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Pressable,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { todosService } from "@/services/todos.service";
import { tasksService } from "@/services/tasks.service";
import { Todo } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { FAB } from "@/components/ui/FAB";
import { TaskRespondModal } from "@/components/todos/TaskRespondModal";
import { TodoTaskDetailModal } from "@/components/todos/TodoTaskDetailModal";
import { spacing, typography, radius } from "@/constants/theme";

export default function TodosScreen() {
  const { theme } = useTheme();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [detailTodo, setDetailTodo] = useState<Todo | null>(null);
  const [respondTarget, setRespondTarget] = useState<{
    taskId: string;
    title: string;
    action: "accept" | "reject";
  } | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await todosService.list();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    staleTime: 0,
  });

  useRefreshOnFocus(refetch);

  const refreshDetailTodo = () => {
    if (!detailTodo) return;
    const updated = qc.getQueryData<Todo[]>(["todos"])?.find((t) => t.id === detailTodo.id);
    if (updated) setDetailTodo(updated);
  };

  const toggleMutation = useMutation({
    mutationFn: (todo: Todo) => {
      if (todo.task?.scope === "project") {
        return todosService.update(todo.id, { completed: !todo.completed });
      }
      if (todo.task?.status === "pending") return Promise.resolve(todo);
      if (todo.task && todo.task.status === "in_progress") {
        const next = todo.completed ? "in_progress" : "completed";
        return todosService.update(todo.id, { taskStatus: next });
      }
      return todosService.update(todo.id, { completed: !todo.completed });
    },
    onMutate: async (todo) => {
      if (todo.task?.status === "pending" && todo.task.scope !== "project") return;
      await qc.cancelQueries({ queryKey: ["todos"] });
      const prev = qc.getQueryData<Todo[]>(["todos"]);
      const nextCompleted = !todo.completed;
      const nextTaskStatus =
        todo.task?.status === "in_progress"
          ? nextCompleted
            ? "completed"
            : "in_progress"
          : todo.task?.status;
      qc.setQueryData<Todo[]>(["todos"], (old) =>
        old?.map((t) =>
          t.id === todo.id
            ? {
                ...t,
                completed: nextCompleted,
                task: t.task
                  ? { ...t.task, status: nextTaskStatus ?? t.task.status }
                  : t.task,
              }
            : t
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["todos"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
      refreshDetailTodo();
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      tasksService.update(taskId, { status }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
      refreshDetailTodo();
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({
      taskId,
      action,
      note,
    }: {
      taskId: string;
      action: "accept" | "reject";
      note?: string;
    }) => tasksService.respond(taskId, action, note),
    onSuccess: () => {
      setRespondTarget(null);
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
      refreshDetailTodo();
    },
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => todosService.create(title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      setNewTitle("");
      setAdding(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => todosService.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["todos"] });
      const prev = qc.getQueryData<Todo[]>(["todos"]);
      qc.setQueryData<Todo[]>(["todos"], (old) => old?.filter((t) => t.id !== id));
      if (detailTodo?.id === id) setDetailTodo(null);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["todos"], ctx.prev);
    },
  });

  const detailTodoFromList =
    detailTodo && data?.find((t) => t.id === detailTodo.id)
      ? data.find((t) => t.id === detailTodo.id)!
      : detailTodo;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>My Todos</Text>

      {adding && (
        <View style={[styles.addRow, { backgroundColor: theme.surface }]}>
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="What needs to be done?"
            placeholderTextColor={theme.textSecondary}
            style={[styles.addInput, { color: theme.text }]}
            autoFocus
          />
          <TouchableOpacity
            onPress={() => newTitle && createMutation.mutate(newTitle)}
          >
            <Ionicons name="checkmark-circle" size={32} color={theme.primary} />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              No todos yet. Tap + to add one.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TodoListItem
            item={item}
            theme={theme}
            onToggle={() => toggleMutation.mutate(item)}
            onOpen={() => item.task && setDetailTodo(item)}
            onDelete={() => deleteMutation.mutate(item.id)}
            onAccept={() =>
              setRespondTarget({
                taskId: item.task!.id,
                title: item.title,
                action: "accept",
              })
            }
            onReject={() =>
              setRespondTarget({
                taskId: item.task!.id,
                title: item.title,
                action: "reject",
              })
            }
          />
        )}
      />

      <FAB onPress={() => setAdding(true)} />

      <TodoTaskDetailModal
        visible={!!detailTodo && !!detailTodoFromList?.task}
        todo={detailTodoFromList}
        loading={toggleMutation.isPending || updateTaskStatusMutation.isPending}
        onClose={() => setDetailTodo(null)}
        onAccept={() => {
          const t = detailTodoFromList?.task;
          if (!t) return;
          setDetailTodo(null);
          setRespondTarget({ taskId: t.id, title: t.title, action: "accept" });
        }}
        onReject={() => {
          const t = detailTodoFromList?.task;
          if (!t) return;
          setDetailTodo(null);
          setRespondTarget({ taskId: t.id, title: t.title, action: "reject" });
        }}
        onMarkComplete={() => {
          const t = detailTodoFromList?.task;
          if (!t) return;
          updateTaskStatusMutation.mutate({ taskId: t.id, status: "completed" });
        }}
        onReopen={() => {
          const t = detailTodoFromList?.task;
          if (!t) return;
          updateTaskStatusMutation.mutate({ taskId: t.id, status: "in_progress" });
        }}
        onToggleMyDone={() => {
          if (detailTodoFromList) toggleMutation.mutate(detailTodoFromList);
        }}
      />

      <TaskRespondModal
        visible={!!respondTarget}
        title={respondTarget?.title ?? ""}
        action={respondTarget?.action ?? "accept"}
        loading={respondMutation.isPending}
        onClose={() => setRespondTarget(null)}
        onSubmit={(note) => {
          if (!respondTarget) return;
          respondMutation.mutate({
            taskId: respondTarget.taskId,
            action: respondTarget.action,
            note: note || undefined,
          });
        }}
      />
    </SafeAreaView>
  );
}

function TodoListItem({
  item,
  theme,
  onToggle,
  onOpen,
  onDelete,
  onAccept,
  onReject,
}: {
  item: Todo;
  theme: ReturnType<typeof useTheme>["theme"];
  onToggle: () => void;
  onOpen: () => void;
  onDelete: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const task = item.task;
  const isLinked = !!item.taskId && !!task;
  const isProjectTask = task?.scope === "project";
  const isPending = !isProjectTask && task?.status === "pending";
  const isRejected = task?.status === "rejected";
  const isInProgress = task?.status === "in_progress";
  const isCompleted = task?.status === "completed" || item.completed;

  const contextLine = isLinked
    ? [task.projectName, task.sourceGroupName].filter(Boolean).join(" · ")
    : null;

  return (
    <View
      style={[styles.row, { borderColor: theme.border, backgroundColor: theme.surface }]}
    >
      <View style={styles.rowMain}>
        <Pressable
          onPress={onToggle}
          onLongPress={onDelete}
          disabled={isPending || isRejected}
          hitSlop={8}
        >
          <Ionicons
            name={isCompleted ? "checkbox" : "square-outline"}
            size={24}
            color={
              isPending || isRejected
                ? theme.textSecondary
                : isCompleted
                  ? theme.textSecondary
                  : theme.primary
            }
          />
        </Pressable>
        <Pressable style={styles.textCol} onPress={isLinked ? onOpen : onToggle}>
          <Text
            style={[
              styles.todoText,
              {
                color: theme.text,
                textDecorationLine: isCompleted || isRejected ? "line-through" : "none",
                opacity: isCompleted || isRejected ? 0.6 : 1,
              },
            ]}
          >
            {item.title}
          </Text>
          {contextLine ? (
            <Text style={[styles.contextLine, { color: theme.textSecondary }]} numberOfLines={1}>
              {contextLine}
            </Text>
          ) : null}
          {isLinked && task.creatorName ? (
            <Text style={[styles.byLine, { color: theme.textSecondary }]}>
              By {task.creatorName}
            </Text>
          ) : null}
          {isLinked && (
            <View style={styles.badges}>
              {isProjectTask && (
                <View style={[styles.badge, { backgroundColor: theme.accent + "14" }]}>
                  <Text style={[styles.badgeText, { color: theme.accent }]}>Team</Text>
                </View>
              )}
              {isPending && (
                <Text style={[styles.statusHint, { color: theme.warning }]}>Awaiting response</Text>
              )}
              {isInProgress && !isProjectTask && (
                <Text style={[styles.statusHint, { color: theme.primary }]}>In progress</Text>
              )}
              {isRejected && (
                <Text style={[styles.statusHint, { color: theme.danger }]}>Declined</Text>
              )}
            </View>
          )}
        </Pressable>
        {isLinked && (
          <Pressable onPress={onOpen} hitSlop={8}>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>

      {isPending && (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { ...typography.h1, padding: spacing.md },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  addInput: { flex: 1, ...typography.body },
  list: { padding: spacing.md, paddingBottom: 100 },
  row: {
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
  },
  textCol: { flex: 1, minWidth: 0 },
  todoText: { ...typography.body, fontWeight: "600" },
  contextLine: { fontSize: 12, marginTop: 4 },
  byLine: { fontSize: 12, marginTop: 2, fontStyle: "italic" },
  badges: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs, marginTop: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  statusHint: { fontSize: 11, fontWeight: "600" },
  taskActions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  taskBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  taskBtnText: { fontSize: 14, fontWeight: "600" },
  empty: { textAlign: "center", marginTop: spacing.xl },
});
