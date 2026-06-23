import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius, typography } from "@/constants/theme";

type Props = {
  value: Date | null;
  onChange: (d: Date | null) => void;
};

export function formatDueDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DueDateTimePicker({ value, onChange }: Props) {
  const { theme } = useTheme();
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const current = value ?? new Date(Date.now() + 60 * 60 * 1000);

  const onDateChange = (_e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDate(false);
    if (!selected) return;
    const next = new Date(current);
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    onChange(next);
    if (Platform.OS === "android") setShowTime(true);
  };

  const onTimeChange = (_e: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowTime(false);
    if (!selected) return;
    const base = value ?? new Date();
    const next = new Date(base);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    onChange(next);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Due date & time</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            if (!value) onChange(new Date(Date.now() + 60 * 60 * 1000));
            setShowDate(true);
          }}
          style={[styles.btn, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.primary} />
          <Text style={[styles.btnText, { color: theme.text }]}>
            {value ? formatDueDate(value.toISOString()) : "Set due date"}
          </Text>
        </Pressable>
        {value ? (
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            style={[styles.clearBtn, { borderColor: theme.border }]}
          >
            <Ionicons name="close" size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {showDate && (
        <DateTimePicker
          value={current}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
      {showTime && (
        <DateTimePicker
          value={current}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 48,
  },
  btnText: { ...typography.body, flex: 1 },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
