import { Task, Todo } from "@/types";

export type CalendarTaskItem = {
  id: string;
  todoId?: string;
  title: string;
  /** Date used to place the task on the calendar grid */
  calendarDate: string;
  dueDate: string | null;
  priority: string;
  status: string;
  completed: boolean;
  projectName?: string | null;
  isAssigned?: boolean;
};

export function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local calendar day for an ISO timestamp (avoids UTC day-shift). */
export function calendarDateKey(iso: string): string {
  const d = new Date(iso);
  if (!Number.isNaN(d.getTime())) return dateKey(d);
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return dateKey(new Date());
}

export function sameCalendarDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

export function isRemainingTodo(todo: Todo): boolean {
  if (todo.completed) return false;
  const status = todo.task?.status;
  if (status === "completed" || status === "rejected") return false;
  return true;
}

function isRemainingTask(task: Task): boolean {
  return task.status !== "completed" && task.status !== "rejected";
}

/**
 * Tasks with a due date use that day; remaining tasks without a due date appear on today.
 */
export function resolveCalendarDate(
  dueDate: string | null | undefined,
  fallbackIso: string
): string {
  if (dueDate) return dueDate;
  return fallbackIso;
}

export function collectCalendarTasks(
  todos: Todo[],
  assignedTasks: Task[] = [],
  userId?: string
): CalendarTaskItem[] {
  const map = new Map<string, CalendarTaskItem>();
  const todayIso = new Date().toISOString();

  for (const todo of todos) {
    if (!isRemainingTodo(todo)) continue;

    const task = todo.task;
    const fallback = task?.createdAt ?? todo.createdAt ?? todayIso;
    const calendarDate = task?.dueDate
      ? resolveCalendarDate(task.dueDate, fallback)
      : todayIso;

    map.set(todo.id, {
      id: task?.id ?? todo.id,
      todoId: todo.id,
      title: todo.title,
      calendarDate,
      dueDate: task?.dueDate ?? null,
      priority: task?.priority ?? "medium",
      status: task?.status ?? "in_progress",
      completed: false,
      projectName: task?.projectName ?? null,
      isAssigned: !!(
        userId &&
        task?.assignedTo === userId &&
        task.scope === "assigned"
      ),
    });
  }

  for (const task of assignedTasks) {
    if (!isRemainingTask(task)) continue;

    const linked = [...map.values()].find((e) => e.id === task.id);
    if (linked) {
      if (linked.todoId) {
        map.set(linked.todoId, { ...linked, isAssigned: true });
      }
      continue;
    }

    const fallback = task.createdAt ?? todayIso;
    const calendarDate = task.dueDate
      ? resolveCalendarDate(task.dueDate, fallback)
      : todayIso;

    map.set(`task-${task.id}`, {
      id: task.id,
      title: task.title,
      calendarDate,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      completed: false,
      isAssigned: true,
    });
  }

  return Array.from(map.values());
}

export function tasksOnDate(
  items: CalendarTaskItem[],
  day: Date
): CalendarTaskItem[] {
  const key = dateKey(day);
  return items
    .filter((t) => calendarDateKey(t.calendarDate) === key)
    .sort(
      (a, b) =>
        new Date(a.calendarDate).getTime() - new Date(b.calendarDate).getTime()
    );
}

export function datesWithTasks(items: CalendarTaskItem[]): Set<string> {
  return new Set(items.map((t) => calendarDateKey(t.calendarDate)));
}

export function taskCountsByDate(
  items: CalendarTaskItem[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = calendarDateKey(item.calendarDate);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Count of remaining tasks with an assigned due date in this month. */
export function assignedCountsByDate(
  items: CalendarTaskItem[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.isAssigned) continue;
    const key = calendarDateKey(item.calendarDate);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function tasksInMonth(
  items: CalendarTaskItem[],
  year: number,
  month: number
): CalendarTaskItem[] {
  return items.filter((t) => {
    const d = new Date(t.calendarDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function getMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
