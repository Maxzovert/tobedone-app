import { api } from "@/lib/api";
import { Project, ProjectDetail, ProjectTask, TaskGroup, GroupType } from "@/types";

export const projectsService = {
  list: () => api.get<Project[]>("/projects"),
  get: (id: string) => api.get<ProjectDetail>(`/projects/${id}`),
  create: (data: { name: string; description?: string; color?: string; icon?: string }) =>
    api.post<Project>("/projects", data),
  join: (inviteCode: string) =>
    api.post<Project>("/projects/join", { inviteCode }),
  update: (
    id: string,
    data: { name?: string; description?: string; icon?: string; color?: string }
  ) => api.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete<{ deleted: boolean }>(`/projects/${id}`),
  deleteGroup: (projectId: string, groupId: string) =>
    api.delete<{ deleted: boolean }>(`/projects/${projectId}/groups/${groupId}`),
  createDiscussionGroup: (
    projectId: string,
    data: { name: string; icon?: string; groupType?: GroupType }
  ) => api.post<TaskGroup>(`/projects/${projectId}/discussion-groups`, data),
  createTaskGroup: (projectId: string, data: { name: string; icon?: string }) =>
    api.post<TaskGroup>(`/projects/${projectId}/task-groups`, data),
  listProjectTasks: (projectId: string) =>
    api.get<ProjectTask[]>(`/projects/${projectId}/tasks`),
  createProjectTask: (
    projectId: string,
    data: { title: string; description?: string; priority?: string }
  ) => api.post<ProjectTask>(`/projects/${projectId}/tasks`, data),
};
