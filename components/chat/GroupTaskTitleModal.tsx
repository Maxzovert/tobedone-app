import { useState, useEffect } from "react";
import { Text, StyleSheet, Pressable, TextInput } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/Button";
import { KeyboardBottomSheet } from "@/components/ui/KeyboardBottomSheet";
import { PriorityPicker, TaskPriority } from "@/components/tasks/PriorityPicker";
import { DueDateTimePicker } from "@/components/tasks/DueDateTimePicker";
import { spacing, radius, typography } from "@/constants/theme";

export type GroupTaskFormData = {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate: string | null;
};

type Props = {
  visible: boolean;
  defaultTitle?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (data: GroupTaskFormData) => void;
};

export function GroupTaskTitleModal({
  visible,
  defaultTitle = "",
  loading,
  onClose,
  onConfirm,
}: Props) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);

  useEffect(() => {
    if (visible) {
      setTitle(defaultTitle);
      setDescription("");
      setPriority("medium");
      setDueDate(null);
    }
  }, [visible, defaultTitle]);

  return (
    <KeyboardBottomSheet visible={visible} onClose={onClose}>
      <Text style={[styles.heading, { color: theme.text }]}>Group task</Text>
      <Text style={[styles.hint, { color: theme.textSecondary }]}>
        Added to every member&apos;s todos and posted in this chat.
      </Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Task title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="What should the team do?"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
        ]}
      />
      <Text style={[styles.label, { color: theme.textSecondary }]}>Description (optional)</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Details..."
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[
          styles.input,
          styles.inputMulti,
          { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
        ]}
      />
      <PriorityPicker value={priority} onChange={setPriority} />
      <DueDateTimePicker value={dueDate} onChange={setDueDate} />
      <Button
        title="Add to team todos"
        onPress={() => {
          if (!title.trim()) return;
          onConfirm({
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            dueDate: dueDate ? dueDate.toISOString() : null,
          });
        }}
        loading={loading}
        disabled={!title.trim()}
      />
      <Pressable onPress={onClose} style={styles.cancel}>
        <Text style={{ color: theme.textSecondary }}>Cancel</Text>
      </Pressable>
    </KeyboardBottomSheet>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.h2, marginBottom: spacing.xs },
  hint: { ...typography.caption, marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  inputMulti: { minHeight: 72, textAlignVertical: "top" },
  cancel: { marginTop: spacing.md, alignItems: "center", paddingBottom: spacing.sm },
});
