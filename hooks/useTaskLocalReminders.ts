import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useQuery } from "@tanstack/react-query";
import { todosService } from "@/services/todos.service";
import { Todo } from "@/types";
import { ensureAndroidChannel, ensureUrgentChannel } from "@/lib/pushNotifications";

const URGENT_MS = 60 * 60 * 1000;

async function cancelTaskNotifications(taskId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter((n) => (n.content.data as { taskId?: string })?.taskId === taskId)
    .map((n) => n.identifier);
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

async function scheduleForTodo(todo: Todo) {
  if (!todo.task || todo.completed) return;
  if (todo.task.status === "completed" || todo.task.status === "rejected") return;

  const taskId = todo.task.id;
  await cancelTaskNotifications(taskId);

  const priority = todo.task.priority;
  const due = todo.task.dueDate ? new Date(todo.task.dueDate) : null;

  if (priority === "urgent") {
    const fireAt = new Date(new Date(todo.task.createdAt).getTime() + URGENT_MS);
    if (fireAt.getTime() <= Date.now()) return;
    await Notifications.scheduleNotificationAsync({
      identifier: `urgent-${taskId}`,
      content: {
        title: "Urgent task due",
        body: `"${todo.title}" needs attention within 1 hour.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { taskId, type: "task_urgent_reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: "urgent",
      },
    });
    return;
  }

  if (due && due.getTime() > Date.now()) {
    await Notifications.scheduleNotificationAsync({
      identifier: `due-${taskId}`,
      content: {
        title: "Task due soon",
        body: `"${todo.title}" is due now.`,
        sound: true,
        data: { taskId, type: "task_due_reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: due,
        channelId: "default",
      },
    });
  }

  const nudgeAt = new Date(Date.now() + 60 * 60 * 1000);
  await Notifications.scheduleNotificationAsync({
    identifier: `nudge-${taskId}`,
    content: {
      title:
        priority === "high"
          ? "High priority task"
          : priority === "low"
            ? "Low priority reminder"
            : "Task reminder",
      body: `Still open: "${todo.title}"`,
      sound: true,
      data: { taskId, type: "task_priority_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nudgeAt,
      channelId: "default",
    },
  });
}

export function useTaskLocalReminders(enabled: boolean) {
  const { data: todos } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await todosService.list();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!enabled || Platform.OS === "web" || !todos) return;

    (async () => {
      await ensureAndroidChannel();
      await ensureUrgentChannel();

      for (const todo of todos) {
        if (!todo.task || todo.completed) {
          if (todo.taskId) await cancelTaskNotifications(todo.taskId);
          continue;
        }
        await scheduleForTodo(todo);
      }
    })().catch((err) => console.warn("Local reminders failed:", err));
  }, [enabled, todos]);
}
