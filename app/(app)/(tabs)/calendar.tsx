import { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchHome } from "@/lib/fetchQueries";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { todosService } from "@/services/todos.service";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/auth-store";
import { AppHeaderActions } from "@/components/ui/AppHeaderActions";
import { MonthCalendar } from "@/components/ui/MonthCalendar";
import { formatDueDate } from "@/components/tasks/DueDateTimePicker";
import { priorityColor, priorityLabel } from "@/components/tasks/PriorityPicker";
import { spacing, typography, radius, ThemeColors } from "@/constants/theme";
import {
  collectCalendarTasks,
  taskCountsByDate,
  assignedCountsByDate,
  tasksOnDate,
  sameCalendarDay,
  CalendarTaskItem,
} from "@/lib/calendarTasks";

export default function CalendarScreen() {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());

  const { data: todos, refetch: refetchTodos, isRefetching: refetchingTodos } =
    useQuery({
      queryKey: ["todos"],
      queryFn: async () => {
        const res = await todosService.list();
        if (!res.success) throw new Error(res.error);
        return res.data!;
      },
      staleTime: 30_000,
    });

  const { data: home, refetch: refetchHome, isRefetching: refetchingHome } =
    useQuery({
      queryKey: ["dashboard", "home"],
      queryFn: fetchHome,
      staleTime: 60_000,
    });

  const refetch = useCallback(() => {
    void refetchTodos();
    void refetchHome();
  }, [refetchTodos, refetchHome]);

  useRefreshOnFocus(refetch);

  const allTasks = useMemo(
    () => collectCalendarTasks(todos ?? [], home?.assignedTasks ?? [], userId),
    [todos, home?.assignedTasks, userId]
  );

  const taskCounts = useMemo(() => taskCountsByDate(allTasks), [allTasks]);
  const assignedCounts = useMemo(
    () => assignedCountsByDate(allTasks),
    [allTasks]
  );
  const dayTasks = useMemo(
    () => tasksOnDate(allTasks, selected),
    [allTasks, selected]
  );

  const assignedCount = useMemo(
    () => allTasks.filter((t) => t.isAssigned).length,
    [allTasks]
  );

  const handleSelect = useCallback((day: Date) => {
    setSelected(day);
    setViewDate((current) => {
      if (
        day.getMonth() === current.getMonth() &&
        day.getFullYear() === current.getFullYear()
      ) {
        return current;
      }
      return new Date(day.getFullYear(), day.getMonth(), 1);
    });
  }, []);

  const goToday = useCallback(() => {
    const now = new Date();
    setSelected(now);
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }, []);

  const goPrevMonth = useCallback(() => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const goNextMonth = useCallback(() => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const selectedLabel = selected.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const isTodaySelected = sameCalendarDay(selected, today);
  const loading = !todos && !home;
  const refreshing = refetchingTodos || refetchingHome;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.text }]}>Calendar</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Remaining tasks by date
            </Text>
          </View>
          <AppHeaderActions />
        </View>

        <MonthCalendar
          year={viewDate.getFullYear()}
          month={viewDate.getMonth()}
          selected={selected}
          taskCounts={taskCounts}
          assignedCounts={assignedCounts}
          onSelect={handleSelect}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
          onGoToday={goToday}
        />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {isTodaySelected ? "Today" : selectedLabel}
            </Text>
            {dayTasks.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: `${theme.primary}16` }]}>
                <Text style={[styles.countBadgeText, { color: theme.primary }]}>
                  {dayTasks.length}
                </Text>
              </View>
            )}
          </View>
          {!isTodaySelected && (
            <Text style={[styles.sectionYear, { color: theme.textSecondary }]}>
              {selected.getFullYear()}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.dayCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={theme.primary}
              style={styles.loader}
            />
          ) : dayTasks.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}10` }]}>
                <Ionicons
                  name={isTodaySelected ? "checkmark-done-outline" : "calendar-clear-outline"}
                  size={26}
                  color={theme.primary}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {isTodaySelected ? "All clear for today" : "No tasks on this day"}
              </Text>
              <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
                {isTodaySelected
                  ? "Tasks without a due date show up here. Add due dates to schedule them on specific days."
                  : "Pick another date or jump to today to see undated remaining tasks."}
              </Text>
            </View>
          ) : (
            dayTasks.map((item, index) => (
              <CalendarTaskRow
                key={item.todoId ?? item.id}
                item={item}
                theme={theme}
                isLast={index === dayTasks.length - 1}
              />
            ))
          )}
        </View>

        {assignedCount > 0 && (
          <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            {assignedCount} assigned task{assignedCount === 1 ? "" : "s"} across your calendar
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function statusMeta(status: string, theme: ThemeColors) {
  switch (status) {
    case "completed":
      return { label: "Done", color: theme.success, icon: "checkmark-circle" as const };
    case "in_progress":
      return { label: "Active", color: theme.primary, icon: "play-circle" as const };
    case "rejected":
      return { label: "Rejected", color: theme.danger, icon: "close-circle" as const };
    case "pending":
      return { label: "Pending", color: theme.warning, icon: "time" as const };
    default:
      return {
        label: status.replace(/_/g, " "),
        color: theme.textSecondary,
        icon: "ellipse" as const,
      };
  }
}

function CalendarTaskRow({
  item,
  theme,
  isLast,
}: {
  item: CalendarTaskItem;
  theme: ThemeColors;
  isLast: boolean;
}) {
  const pColor = priorityColor(item.priority);
  const status = statusMeta(item.status, theme);
  const dueDate = item.dueDate ? new Date(item.dueDate) : null;
  const hasTime =
    dueDate && (dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0);
  const timeLabel =
    dueDate && hasTime
      ? dueDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      : null;

  return (
    <View
      style={[
        styles.taskRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ]}
    >
      <View style={[styles.priorityBar, { backgroundColor: pColor }]} />
      <View style={styles.taskContent}>
        <View style={styles.taskMain}>
          <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={[styles.priorityTag, { backgroundColor: `${pColor}14` }]}>
            <Text style={[styles.priorityTagText, { color: pColor }]}>
              {priorityLabel(item.priority)}
            </Text>
          </View>
        </View>

        <View style={styles.taskMeta}>
          {item.isAssigned && (
            <View style={styles.metaChip}>
              <Ionicons name="person" size={11} color={theme.accent} />
              <Text style={[styles.metaText, { color: theme.accent }]}>Assigned</Text>
            </View>
          )}
          {item.projectName ? (
            <View style={styles.metaChip}>
              <Ionicons name="folder-outline" size={11} color={theme.textSecondary} />
              <Text
                style={[styles.metaText, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {item.projectName}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <Ionicons
              name={item.dueDate ? "time-outline" : "infinite-outline"}
              size={11}
              color={theme.textSecondary}
            />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>
              {item.dueDate
                ? timeLabel ?? formatDueDate(item.dueDate).split(",")[0]
                : "No due date"}
            </Text>
          </View>
          <View style={[styles.statusTag, { backgroundColor: `${status.color}14` }]}>
            <Ionicons name={status.icon} size={10} color={status.color} />
            <Text style={[styles.statusTagText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 100 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerLeft: { flex: 1, minWidth: 0 },
  title: { ...typography.h1, fontSize: 28 },
  subtitle: { ...typography.caption, marginTop: 4 },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: { ...typography.h3, fontSize: 17 },
  sectionYear: { ...typography.small, marginTop: 2 },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  countBadgeText: { fontSize: 12, fontWeight: "700" },
  dayCard: {
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  taskRow: {
    flexDirection: "row",
    minHeight: 72,
  },
  priorityBar: {
    width: 3,
  },
  taskContent: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    gap: spacing.xs + 2,
  },
  taskMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  taskTitle: {
    ...typography.body,
    fontWeight: "600",
    flex: 1,
    lineHeight: 21,
  },
  priorityTag: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityTagText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  taskMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    maxWidth: "48%",
  },
  metaText: { ...typography.small, fontSize: 11 },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.h3, fontSize: 16, marginBottom: spacing.xs },
  emptyBody: {
    ...typography.caption,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  loader: { marginVertical: spacing.xl },
  footnote: {
    ...typography.small,
    textAlign: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
