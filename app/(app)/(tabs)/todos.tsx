import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { todosService } from "@/services/todos.service";
import { Todo } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { FAB } from "@/components/ui/FAB";
import { spacing, typography, radius } from "@/constants/theme";

export default function TodosScreen() {
  const { theme } = useTheme();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await todosService.list();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (todo: Todo) =>
      todosService.update(todo.id, { completed: !todo.completed }),
    onMutate: async (todo) => {
      await qc.cancelQueries({ queryKey: ["todos"] });
      const prev = qc.getQueryData<Todo[]>(["todos"]);
      qc.setQueryData<Todo[]>(["todos"], (old) =>
        old?.map((t) =>
          t.id === todo.id ? { ...t, completed: !t.completed } : t
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["todos"], ctx.prev);
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
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["todos"], ctx.prev);
    },
  });

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
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              No todos yet. Tap + to add one.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={() => toggleMutation.mutate(item)}
            onLongPress={() => deleteMutation.mutate(item.id)}
          >
            <Ionicons
              name={item.completed ? "checkbox" : "square-outline"}
              size={24}
              color={item.completed ? theme.textSecondary : theme.primary}
            />
            <Text
              style={[
                styles.todoText,
                {
                  color: theme.text,
                  textDecorationLine: item.completed ? "line-through" : "none",
                  opacity: item.completed ? 0.6 : 1,
                },
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FAB onPress={() => setAdding(true)} />
    </SafeAreaView>
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  todoText: { ...typography.body, flex: 1 },
  empty: { textAlign: "center", marginTop: spacing.xl },
});
