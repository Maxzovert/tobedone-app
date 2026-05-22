import { api } from "@/lib/api";
import { Todo } from "@/types";

export const todosService = {
  list: () => api.get<Todo[]>("/todos"),
  create: (title: string) => api.post<Todo>("/todos", { title }),
  update: (
    id: string,
    data: Partial<Pick<Todo, "title" | "completed">> & {
      taskStatus?: "in_progress" | "completed";
    }
  ) => api.patch<Todo>(`/todos/${id}`, data),
  delete: (id: string) => api.delete<{ deleted: boolean }>(`/todos/${id}`),
};
