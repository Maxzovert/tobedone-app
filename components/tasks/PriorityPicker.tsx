import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius, typography } from "@/constants/theme";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

const OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "#64748b" },
  { value: "medium", label: "Medium", color: "#6366f1" },
  { value: "high", label: "High", color: "#f59e0b" },
  { value: "urgent", label: "Urgent", color: "#ef4444" },
];

type Props = {
  value: TaskPriority;
  onChange: (v: TaskPriority) => void;
};

export function priorityColor(priority: string) {
  return OPTIONS.find((o) => o.value === priority)?.color ?? "#6366f1";
}

export function priorityLabel(priority: string) {
  return OPTIONS.find((o) => o.value === priority)?.label ?? priority;
}

export function PriorityPicker({ value, onChange }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Priority</Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[
                styles.chip,
                {
                  borderColor: active ? opt.color : theme.border,
                  backgroundColor: active ? opt.color + "18" : theme.surface,
                },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: opt.color }]} />
              <Text
                style={[
                  styles.chipText,
                  { color: active ? opt.color : theme.textSecondary },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.xs },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 12, fontWeight: "600" },
});
