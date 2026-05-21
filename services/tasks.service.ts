import { api } from "@/lib/api";
import { Task } from "@/types";

export const tasksService = {
  create: (data: Partial<Task> & { taskGroupId: string; title: string }) =>
    api.post<Task>("/tasks", data),
  update: (id: string, data: Partial<Task>) =>
    api.patch<Task>(`/tasks/${id}`, data),
  delete: (id: string) => api.delete<{ deleted: boolean }>(`/tasks/${id}`),
  respond: (id: string, action: "accept" | "reject") =>
    api.post<Task>(`/tasks/${id}/respond`, { action }),
};
