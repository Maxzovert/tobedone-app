import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import {
  queryCacheKeys,
  readQueryCache,
} from "@/lib/queryCacheStorage";
import { fetchHome, fetchProjects, fetchTodos } from "@/lib/fetchQueries";
import { fetchNotifications } from "@/hooks/useNotificationsQuery";
import { HomeData, Project, Todo } from "@/types";

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
      void qc.prefetchQuery({
        queryKey: ["notifications"],
        queryFn: fetchNotifications,
        staleTime: 60_000,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, qc]);
}

export { fetchHome, fetchProjects, fetchTodos } from "@/lib/fetchQueries";
