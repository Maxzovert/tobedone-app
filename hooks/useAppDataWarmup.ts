import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { dashboardService } from "@/services/dashboard.service";
import { projectsService } from "@/services/projects.service";
import { todosService } from "@/services/todos.service";
import {
  queryCacheKeys,
  readQueryCache,
  writeQueryCache,
} from "@/lib/queryCacheStorage";
import { HomeData, Project, Todo } from "@/types";

async function fetchHome(): Promise<HomeData> {
  const res = await dashboardService.home();
  if (!res.success || !res.data) throw new Error(res.error || "Failed to load home");
  void writeQueryCache(queryCacheKeys.home, res.data);
  return res.data;
}

async function fetchProjects(): Promise<Project[]> {
  const res = await projectsService.list();
  if (!res.success || !res.data) throw new Error(res.error || "Failed to load projects");
  void writeQueryCache(queryCacheKeys.projects, res.data);
  return res.data;
}

async function fetchTodos(): Promise<Todo[]> {
  const res = await todosService.list();
  if (!res.success || !res.data) throw new Error(res.error || "Failed to load todos");
  void writeQueryCache(queryCacheKeys.todos, res.data);
  return res.data;
}

/**
 * Restores cached lists instantly, then refreshes in the background.
 */
export function useAppDataWarmup() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);
  const qc = useQueryClient();

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    let cancelled = false;

    (async () => {
      const [home, projects, todos] = await Promise.all([
        readQueryCache<HomeData>(queryCacheKeys.home),
        readQueryCache<Project[]>(queryCacheKeys.projects),
        readQueryCache<Todo[]>(queryCacheKeys.todos),
      ]);

      if (cancelled) return;

      if (home) qc.setQueryData(["dashboard", "home"], home);
      if (projects) qc.setQueryData(["projects"], projects);
      if (todos) qc.setQueryData(["todos"], todos);

      void qc.prefetchQuery({
        queryKey: ["dashboard", "home"],
        queryFn: fetchHome,
        staleTime: 60_000,
      });
      void qc.prefetchQuery({
        queryKey: ["projects"],
        queryFn: fetchProjects,
        staleTime: 60_000,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, qc]);
}

export { fetchHome, fetchProjects, fetchTodos };
