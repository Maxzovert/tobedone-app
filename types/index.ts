export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  designation: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  role: string;
  user: Pick<User, "id" | "name" | "email" | "avatar" | "designation">;
}

export type GroupType = "general" | "admin";

export interface TaskGroup {
  id: string;
  projectId: string;
  name: string;
  icon?: string | null;
  kind?: string | null;
  groupType?: GroupType | null;
}

export type TaskScope = "assigned" | "project";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  taskGroupId: string;
  dueDate: string | null;
  createdBy: string;
  responseNote?: string | null;
  scope?: TaskScope;
  createdAt: string;
}

/** Task metadata shown on linked personal todos */
export interface TodoTaskMeta extends Task {
  projectId?: string | null;
  projectName?: string | null;
  projectColor?: string | null;
  sourceGroupId?: string | null;
  sourceGroupName?: string | null;
  sourceGroupType?: GroupType | string | null;
  creatorName?: string | null;
  assigneeName?: string | null;
  memberCount?: number | null;
  completedCount?: number | null;
}

export interface ProjectTask extends Task {
  scope: "project";
  creatorName: string | null;
  memberCount: number;
  completedCount: number;
  myCompleted: boolean;
  myTodoId: string | null;
}

export interface Todo {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  taskId?: string | null;
  task?: TodoTaskMeta | null;
  createdAt: string;
}

export interface MessageSender {
  id: string;
  name: string;
  avatar: string | null;
  email: string;
}

export interface Reaction {
  id: string;
  messageId: string;
  emoji: string;
  userId: string;
  userName?: string;
}

export interface LinkedTaskPreview {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  assignedTo: string | null;
  taskGroupId: string;
  assigneeName: string | null;
}

export interface Message {
  id: string;
  groupId: string;
  content: string;
  attachments: string[];
  mentionedUserIds: string[];
  linkedTaskId?: string | null;
  linkedTask?: LinkedTaskPreview | null;
  readBy: string[];
  createdAt: string;
  sender: MessageSender;
  reactions?: Reaction[];
}

export type ChatSendPayload = {
  content: string;
  mentionedUserIds: string[];
  linkedTaskId?: string;
  assignTask?: {
    title: string;
    assignedTo: string;
    taskGroupId: string;
    priority?: string;
    dueDate?: string | null;
  };
};

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  type: string;
  data?: Record<string, string> | null;
  read: boolean;
  createdAt: string;
}

export interface HomeData {
  projects: Project[];
  pendingTodos: Todo[];
  assignedTasks: Task[];
  teamActivity: {
    id: string;
    content: string;
    groupId: string;
    createdAt: string;
    senderName: string;
  }[];
  stats: {
    projects: number;
    pendingTasks: number;
    completedTasks: number;
    todosCompleted: number;
    todosTotal: number;
    productivity: number;
  };
}

export interface ProjectDetail {
  project: Project;
  members: ProjectMember[];
  /** Discussion groups only (admin + normal). */
  taskGroups: TaskGroup[];
  taskBucketId: string;
  memberRole: string;
  isOwner?: boolean;
}
