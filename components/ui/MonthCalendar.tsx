import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, radius } from "@/constants/theme";
import {
  WEEKDAY_LABELS,
  MONTH_LABELS,
  dateKey,
  getMonthGrid,
  sameCalendarDay,
} from "@/lib/calendarTasks";

type Props = {
  year: number;
  month: number;
  selected: Date;
  taskCounts: Map<string, number>;
  assignedCounts: Map<string, number>;
  onSelect: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToday: () => void;
};

export function MonthCalendar({
  year,
  month,
  selected,
  taskCounts,
  assignedCounts,
  onSelect,
  onPrevMonth,
  onNextMonth,
  onGoToday,
}: Props) {
  const { theme } = useTheme();
  const today = new Date();
  const cells = getMonthGrid(year, month);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  const viewingToday =
    today.getFullYear() === year && today.getMonth() === month;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.cardShadow,
        },
      ]}
    >
      <View style={styles.toolbar}>
        <Pressable
          onPress={onPrevMonth}
          hitSlop={8}
          style={({ pressed }) => [
            styles.navBtn,
            { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={theme.text} />
        </Pressable>

        <View style={styles.monthCenter}>
          <Text style={[styles.monthTitle, { color: theme.text }]}>
            {MONTH_LABELS[month]} {year}
          </Text>
        </View>

        <Pressable
          onPress={onNextMonth}
          hitSlop={8}
          style={({ pressed }) => [
            styles.navBtn,
            { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.text} />
        </Pressable>
      </View>

      {!viewingToday && (
        <Pressable
          onPress={onGoToday}
          style={({ pressed }) => [
            styles.todayBtn,
            {
              backgroundColor: `${theme.primary}10`,
              borderColor: `${theme.primary}28`,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="locate-outline" size={13} color={theme.primary} />
          <Text style={[styles.todayBtnText, { color: theme.primary }]}>Today</Text>
        </Pressable>
      )}

      <View style={[styles.weekRow, { borderBottomColor: theme.border }]}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text
            key={label}
            style={[
              styles.weekday,
              {
                color: i === 0 || i === 6 ? theme.textSecondary : theme.textSecondary,
                opacity: i === 0 || i === 6 ? 0.75 : 0.9,
              },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {rows.map((week, rowIndex) => (
          <View key={`week-${rowIndex}`} style={styles.week}>
            {week.map((day, colIndex) => {
              if (!day) {
                return (
                  <View key={`empty-${rowIndex}-${colIndex}`} style={styles.dayCell} />
                );
              }

              const key = dateKey(day);
              const count = taskCounts.get(key) ?? 0;
              const assigned = assignedCounts.get(key) ?? 0;
              const isSelected = sameCalendarDay(day, selected);
              const isToday = sameCalendarDay(day, today);
              const isPast = key < dateKey(today) && !isToday;
              const isWeekend = colIndex === 0 || colIndex === 6;

              return (
                <Pressable
                  key={key}
                  onPress={() => onSelect(day)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    isWeekend && !isSelected && { backgroundColor: `${theme.primary}04` },
                    isSelected && {
                      backgroundColor: theme.primary,
                      ...Platform.select({
                        ios: {
                          shadowColor: theme.primary,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.28,
                          shadowRadius: 4,
                        },
                        android: { elevation: 2 },
                        default: {},
                      }),
                    },
                    !isSelected &&
                      isToday && {
                        borderColor: theme.primary,
                        borderWidth: 1.5,
                      },
                    !isSelected && !isToday && pressed && {
                      backgroundColor: `${theme.primary}0c`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      {
                        color: isSelected
                          ? theme.onPrimary
                          : isToday
                            ? theme.primary
                            : isPast
                              ? theme.textSecondary
                              : theme.text,
                        fontWeight: isToday || isSelected ? "700" : "500",
                        opacity: isSelected || isToday ? 1 : isPast ? 0.55 : 1,
                      },
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                  {count > 0 && (
                    <View style={styles.markerRow}>
                      {Array.from({ length: Math.min(count, 3) }).map((_, i) => {
                        const isAssignedDot = i < Math.min(assigned, 3);
                        return (
                          <View
                            key={i}
                            style={[
                              styles.markerDot,
                              {
                                backgroundColor: isSelected
                                  ? theme.onPrimary
                                  : isAssignedDot
                                    ? theme.accent
                                    : theme.primary,
                                opacity: isSelected && !isAssignedDot ? 0.75 : 1,
                              },
                            ]}
                          />
                        );
                      })}
                      {count > 3 && (
                        <Text
                          style={[
                            styles.markerMore,
                            { color: isSelected ? theme.onPrimary : theme.textSecondary },
                          ]}
                        >
                          +
                        </Text>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={[styles.legend, { borderTopColor: theme.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Tasks</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>Assigned</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  monthCenter: { alignItems: "center", flex: 1, paddingHorizontal: spacing.xs },
  monthTitle: {
    ...typography.h3,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  todayBtnText: { fontSize: 12, fontWeight: "600" },
  weekRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  grid: { gap: 3 },
  week: { flexDirection: "row", gap: 3 },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm + 2,
    paddingTop: 2,
  },
  dayNum: {
    fontSize: 14,
  },
  markerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    position: "absolute",
    bottom: 5,
  },
  markerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  markerMore: {
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 10,
    marginLeft: -1,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    marginTop: spacing.sm + 2,
    paddingTop: spacing.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    ...typography.small,
    fontSize: 11,
  },
});
