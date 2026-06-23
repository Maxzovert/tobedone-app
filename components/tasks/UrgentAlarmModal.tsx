import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/Button";
import { spacing, radius, typography } from "@/constants/theme";

export type UrgentTaskItem = {
  id: string;
  title: string;
};

type Props = {
  visible: boolean;
  tasks: UrgentTaskItem[];
  onDismiss: () => void;
  onSnooze: () => void;
};

export function UrgentAlarmModal({ visible, tasks, onDismiss, onSnooze }: Props) {
  const { theme } = useTheme();

  if (!visible || tasks.length === 0) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.danger }]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.danger + "18" }]}>
            <Ionicons name="alarm" size={36} color={theme.danger} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Urgent tasks overdue</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            {tasks.length} urgent task{tasks.length > 1 ? "s" : ""} not completed within 1 hour.
          </Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {tasks.map((t) => (
              <View
                key={t.id}
                style={[styles.taskRow, { borderColor: theme.border }]}
              >
                <Ionicons name="flame" size={16} color={theme.danger} />
                <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={2}>
                  {t.title}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable
              onPress={onSnooze}
              style={[styles.secondaryBtn, { borderColor: theme.border }]}
            >
              <Ionicons name="time-outline" size={18} color={theme.primary} />
              <Text style={[styles.secondaryText, { color: theme.primary }]}>
                Remind in 1 hour
              </Text>
            </Pressable>
            <Button title="Dismiss alarm" onPress={onDismiss} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(127,29,29,0.55)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 2,
    padding: spacing.lg,
    maxHeight: "80%",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.h3, fontWeight: "800", textAlign: "center" },
  sub: { ...typography.caption, textAlign: "center", marginTop: spacing.xs, marginBottom: spacing.md },
  list: { maxHeight: 180, marginBottom: spacing.md },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  taskTitle: { ...typography.body, flex: 1, fontWeight: "600" },
  actions: { gap: spacing.sm },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  secondaryText: { fontSize: 15, fontWeight: "600" },
});
