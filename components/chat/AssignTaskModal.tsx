import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { ProjectMember } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { KeyboardBottomSheet } from "@/components/ui/KeyboardBottomSheet";
import { PriorityPicker, TaskPriority } from "@/components/tasks/PriorityPicker";
import { DueDateTimePicker } from "@/components/tasks/DueDateTimePicker";
import { spacing, radius, typography } from "@/constants/theme";

export type ChatTaskFormData = {
  title: string;
  priority: TaskPriority;
  dueDate: string | null;
};

interface Props {
  visible: boolean;
  member: ProjectMember | null;
  defaultTitle?: string;
  onClose: () => void;
  onConfirm: (data: ChatTaskFormData) => void;
}

export function AssignTaskModal({
  visible,
  member,
  defaultTitle = "",
  onClose,
  onConfirm,
}: Props) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(defaultTitle);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);

  useEffect(() => {
    if (visible) {
      setTitle(defaultTitle);
      setPriority("medium");
      setDueDate(null);
    }
  }, [visible, defaultTitle]);

  if (!member) return null;

  return (
    <KeyboardBottomSheet visible={visible} onClose={onClose}>
      <Text style={[styles.heading, { color: theme.text }]}>Assign task</Text>
      <View style={[styles.assignee, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <Avatar name={member.user.name} uri={member.user.avatar} size={36} />
        <Text style={{ color: theme.text, fontWeight: "600" }}>{member.user.name}</Text>
      </View>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Task title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="What should they do?"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
        ]}
      />
      <PriorityPicker value={priority} onChange={setPriority} />
      <DueDateTimePicker value={dueDate} onChange={setDueDate} />
      <Button
        title="Assign & send"
        onPress={() => {
          if (!title.trim()) return;
          onConfirm({
            title: title.trim(),
            priority,
            dueDate: dueDate ? dueDate.toISOString() : null,
          });
          onClose();
        }}
      />
      <Pressable onPress={onClose} style={styles.cancel}>
        <Text style={{ color: theme.textSecondary }}>Cancel</Text>
      </Pressable>
    </KeyboardBottomSheet>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.h2, marginBottom: spacing.md },
  assignee: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  label: { ...typography.caption, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  cancel: { marginTop: spacing.md, alignItems: "center", paddingBottom: spacing.sm },
});
