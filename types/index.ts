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

export interface TaskGroup {
  id: string;
  projectId: string;
  name: string;
}

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
  createdAt: string;
}

export interface Todo {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
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

export interface Message {
  id: string;
  groupId: string;
  content: string;
  attachments: string[];
  mentionedUserIds: string[];
  readBy: string[];
  createdAt: string;
  sender: MessageSender;
  reactions?: Reaction[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  type: string;
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
  taskGroups: TaskGroup[];
  memberRole: string;
}
