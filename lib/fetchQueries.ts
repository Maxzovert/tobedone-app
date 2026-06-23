import { dashboardService } from "@/services/dashboard.service";
import { projectsService } from "@/services/projects.service";
import { todosService } from "@/services/todos.service";
import {
  queryCacheKeys,
  writeQueryCache,
} from "@/lib/queryCacheStorage";
import { HomeData, Project, Todo } from "@/types";

export async function fetchHome(): Promise<HomeData> {
  const res = await dashboardService.home();
  if (!res.success || !res.data) throw new Error(res.error || "Failed to load home");
  void writeQueryCache(queryCacheKeys.home, res.data);
  return res.data;
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await projectsService.list();
  if (!res.success || !res.data) throw new Error(res.error || "Failed to load projects");
  void writeQueryCache(queryCacheKeys.projects, res.data);
  return res.data;
}

export async function fetchTodos(): Promise<Todo[]> {
  const res = await todosService.list();
  if (!res.success || !res.data) throw new Error(res.error || "Failed to load todos");
  void writeQueryCache(queryCacheKeys.todos, res.data);
  return res.data;
}
