import { api } from "@/lib/api";
import { Project, ProjectDetail } from "@/types";

export const projectsService = {
  list: () => api.get<Project[]>("/projects"),
  get: (id: string) => api.get<ProjectDetail>(`/projects/${id}`),
  create: (data: { name: string; description?: string; color?: string; icon?: string }) =>
    api.post<Project>("/projects", data),
  join: (inviteCode: string) =>
    api.post<Project>("/projects/join", { inviteCode }),
};
