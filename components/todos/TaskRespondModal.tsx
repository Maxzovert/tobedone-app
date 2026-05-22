import { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, radius } from "@/constants/theme";

type Props = {
  visible: boolean;
  title: string;
  action: "accept" | "reject";
  onClose: () => void;
  onSubmit: (note: string) => void;
  loading?: boolean;
};

export function TaskRespondModal({
  visible,
  title,
  action,
  onClose,
  onSubmit,
  loading,
}: Props) {
  const { theme } = useTheme();
  const [note, setNote] = useState("");

  const isAccept = action === "accept";
  const accent = isAccept ? theme.success : theme.danger;

  const handleClose = () => {
    setNote("");
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(note.trim());
    setNote("");
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.center}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.heading, { color: theme.text }]}>
              {isAccept ? "Accept task" : "Decline task"}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={2}>
              {title}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
              ]}
              multiline
              maxLength={2000}
            />
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
                <Text style={{ color: theme.textSecondary, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: accent + "18" }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Ionicons name={isAccept ? "checkmark" : "close"} size={18} color={accent} />
                <Text style={[styles.submitText, { color: accent }]}>
                  {isAccept ? "Accept" : "Decline"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  center: { width: "100%" },
  sheet: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  heading: { ...typography.h3, fontWeight: "700", marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 88,
    textAlignVertical: "top",
    ...typography.body,
    marginBottom: spacing.md,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  submitText: { fontSize: 15, fontWeight: "600" },
});
