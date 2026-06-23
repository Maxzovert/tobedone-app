import { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProjectTask } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { KeyboardBottomSheet } from "@/components/ui/KeyboardBottomSheet";
import { PriorityPicker, TaskPriority } from "@/components/tasks/PriorityPicker";
import { DueDateTimePicker } from "@/components/tasks/DueDateTimePicker";
import { tasksService } from "@/services/tasks.service";
import { spacing, typography } from "@/constants/theme";

type Props = {
  visible: boolean;
  task: ProjectTask | null;
  onClose: () => void;
  onSaved: () => void;
};

export function TaskEditSheet({ visible, task, onClose, onSaved }: Props) {
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority((task.priority as TaskPriority) || "medium");
    setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    setError("");
  }, [task, visible]);

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    setLoading(true);
    setError("");
    const res = await tasksService.update(task.id, {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      dueDate: dueDate ? dueDate.toISOString() : null,
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to update task");
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <KeyboardBottomSheet visible={visible} onClose={onClose}>
      <Text style={[styles.title, { color: theme.text }]}>Edit task</Text>
      <Input label="Title" value={title} onChangeText={setTitle} placeholder="Task title" />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Optional details"
        multiline
      />
      <PriorityPicker value={priority} onChange={setPriority} />
      <DueDateTimePicker value={dueDate} onChange={setDueDate} />
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      <Button title="Save changes" onPress={handleSave} loading={loading} />
    </KeyboardBottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h3, fontWeight: "700", marginBottom: spacing.md },
  error: { marginBottom: spacing.sm },
});
