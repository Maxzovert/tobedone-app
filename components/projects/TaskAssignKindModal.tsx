import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius, typography } from "@/constants/theme";

export type AssignTaskKind = "group" | "individual";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (kind: AssignTaskKind) => void;
};

export function TaskAssignKindModal({ visible, onClose, onSelect }: Props) {
  const { theme } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: theme.text }]}>Assign task</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Choose who this task is for
          </Text>

          <Pressable
            onPress={() => onSelect("group")}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: theme.background, borderColor: theme.border },
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.accent + "18" }]}>
              <Ionicons name="people" size={22} color={theme.accent} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Group task</Text>
              <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                Added to every member&apos;s todos. Post in an admin or normal group.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => onSelect("individual")}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: theme.background, borderColor: theme.border },
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.primary + "18" }]}>
              <Ionicons name="person" size={22} color={theme.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Individual task</Text>
              <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                Assign to one person. They accept or decline from their todos.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </Pressable>

          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={{ color: theme.textSecondary }}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", padding: spacing.lg },
  sheet: {
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  title: { ...typography.h2, textAlign: "center" },
  subtitle: { ...typography.caption, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.lg },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: "700" },
  optionDesc: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  cancel: { marginTop: spacing.md, alignItems: "center" },
});
