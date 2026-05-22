import { useState, useEffect } from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, radius } from "@/constants/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string }) => void;
  loading?: boolean;
  error?: string;
};

export function CreateProjectTaskSheet({
  visible,
  onClose,
  onSubmit,
  loading,
  error,
}: Props) {
  const { theme } = useTheme();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!visible) {
      setTitle("");
      setDescription("");
    }
  }, [visible]);

  const handleClose = () => {
    setTitle("");
    setDescription("");
    onClose();
  };

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit({
      title: trimmed,
      description: description.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        onPress={handleClose}
      >
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.title, { color: theme.text }]}>New project task</Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Added to every member&apos;s todos. Each person marks their own done.
          </Text>
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="What should the team do?"
          />
          <Input
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Details..."
            multiline
          />
          {error ? (
            <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
          ) : null}
          <Button title="Add to team todos" onPress={handleSubmit} loading={loading} />
          <Pressable onPress={handleClose} style={styles.cancel}>
            <Text style={{ color: theme.textSecondary }}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.h2, marginBottom: spacing.xs },
  hint: { ...typography.caption, marginBottom: spacing.md },
  error: { ...typography.caption, textAlign: "center", marginBottom: spacing.sm },
  cancel: { marginTop: spacing.md, alignItems: "center" },
});
