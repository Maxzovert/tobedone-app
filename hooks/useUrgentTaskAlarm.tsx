import { useEffect, useRef, useState, useCallback } from "react";
import { AppState, Platform } from "react-native";
import { Audio } from "expo-av";
import { useQuery } from "@tanstack/react-query";
import { todosService } from "@/services/todos.service";
import { Todo } from "@/types";
import { UrgentAlarmModal, UrgentTaskItem } from "@/components/tasks/UrgentAlarmModal";
import {
  dismissAlarmCycle,
  getSnoozeUntil,
  isDismissedThisCycle,
  snoozeTaskOneHour,
} from "@/lib/taskReminderStorage";

const URGENT_MS = 60 * 60 * 1000;
const ALARM_PLAYS = 10;
const POLL_MS = 30_000;

function isUrgentOverdue(todo: Todo): boolean {
  if (!todo.task || todo.completed) return false;
  if (todo.task.priority !== "urgent") return false;
  if (todo.task.status === "completed" || todo.task.status === "rejected") return false;
  const assignedAt = new Date(todo.task.createdAt).getTime();
  return Date.now() - assignedAt >= URGENT_MS;
}

export function UrgentAlarmHost({ enabled }: { enabled: boolean }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const playingRef = useRef(false);
  const modalVisibleRef = useRef(false);
  const [alarmTasks, setAlarmTasks] = useState<UrgentTaskItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    modalVisibleRef.current = modalVisible;
  }, [modalVisible]);

  const { data: todos } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await todosService.list();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled,
    refetchInterval: enabled ? POLL_MS : false,
    staleTime: 15_000,
  });

  const stopSound = useCallback(async () => {
    playingRef.current = false;
    try {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
    } catch {
      /* ignore */
    }
    soundRef.current = null;
  }, []);

  const playAlarmLoop = useCallback(async () => {
    if (playingRef.current || Platform.OS === "web") return;
    playingRef.current = true;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      for (let i = 0; i < ALARM_PLAYS && playingRef.current; i++) {
        const { sound } = await Audio.Sound.createAsync(
          require("@/assets/alarm.mp3"),
          { shouldPlay: true, volume: 1 }
        );
        soundRef.current = sound;
        await new Promise<void>((resolve) => {
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) resolve();
          });
        });
        await sound.unloadAsync();
        soundRef.current = null;
      }
    } catch (err) {
      console.warn("Alarm playback failed:", err);
    } finally {
      playingRef.current = false;
    }
  }, []);

  const evaluate = useCallback(async () => {
    if (!enabled || !todos?.length) {
      if (modalVisibleRef.current) {
        setModalVisible(false);
        setAlarmTasks([]);
        await stopSound();
      }
      return;
    }

    const overdue: UrgentTaskItem[] = [];
    for (const todo of todos) {
      if (!isUrgentOverdue(todo) || !todo.task) continue;
      const snooze = await getSnoozeUntil(todo.task.id);
      if (snooze && snooze.getTime() > Date.now()) continue;
      if (isDismissedThisCycle(todo.task.id)) continue;
      overdue.push({ id: todo.task.id, title: todo.title });
    }

    if (overdue.length === 0) {
      if (modalVisibleRef.current) {
        setModalVisible(false);
        setAlarmTasks([]);
        await stopSound();
      }
      return;
    }

    setAlarmTasks(overdue);
    setModalVisible(true);
    void playAlarmLoop();
  }, [enabled, todos, playAlarmLoop, stopSound]);

  useEffect(() => {
    if (!enabled) return;
    void evaluate();
    const id = setInterval(() => void evaluate(), POLL_MS);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void evaluate();
    });
    return () => {
      clearInterval(id);
      sub.remove();
      void stopSound();
    };
  }, [enabled, evaluate, stopSound]);

  const handleDismiss = async () => {
    dismissAlarmCycle(alarmTasks.map((t) => t.id));
    await stopSound();
    setModalVisible(false);
  };

  const handleSnooze = async () => {
    for (const t of alarmTasks) {
      await snoozeTaskOneHour(t.id);
    }
    await stopSound();
    setModalVisible(false);
    setAlarmTasks([]);
  };

  return (
    <UrgentAlarmModal
      visible={modalVisible}
      tasks={alarmTasks}
      onDismiss={() => void handleDismiss()}
      onSnooze={() => void handleSnooze()}
    />
  );
}
