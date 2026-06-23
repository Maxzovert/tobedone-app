import { useState, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/constants/theme";
import { getSocket } from "@/lib/socket";
import { ProjectMember, ChatSendPayload } from "@/types";
import { ChatAttachMenu, AttachAction } from "@/components/chat/ChatAttachMenu";
import { MemberPickerModal } from "@/components/chat/MemberPickerModal";
import { AssignTaskModal } from "@/components/chat/AssignTaskModal";
import { TaskAssignKindModal } from "@/components/projects/TaskAssignKindModal";
import { GroupTaskTitleModal } from "@/components/chat/GroupTaskTitleModal";
import { projectsService } from "@/services/projects.service";

interface Props {
  groupId: string;
  projectId: string | null;
  members: ProjectMember[];
  taskGroupId: string | null;
  currentUserId: string;
  onSend: (payload: ChatSendPayload) => void;
}

function mentionToken(name: string) {
  return `@${name} `;
}

export function ChatInput({
  groupId,
  projectId,
  members,
  taskGroupId,
  currentUserId,
  onSend,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<AttachAction | null>(null);
  const [assignKindOpen, setAssignKindOpen] = useState(false);
  const [groupTaskOpen, setGroupTaskOpen] = useState(false);
  const [groupTaskLoading, setGroupTaskLoading] = useState(false);
  const [assignMember, setAssignMember] = useState<ProjectMember | null>(null);
  const typingRef = useRef(false);

  const handleChange = (value: string) => {
    setText(value);
    const socket = getSocket();
    if (!socket) return;

    if (value.length > 0 && !typingRef.current) {
      typingRef.current = true;
      socket.emit("typing:start", { groupId });
    } else if (value.length === 0 && typingRef.current) {
      typingRef.current = false;
      socket.emit("typing:stop", { groupId });
    }
  };

  const addMention = (member: ProjectMember) => {
    const token = mentionToken(member.user.name);
    setText((prev) => (prev.includes(token.trim()) ? prev : prev + token));
    setMentionedIds((prev) =>
      prev.includes(member.user.id) ? prev : [...prev, member.user.id]
    );
  };

  const handleAttachSelect = (action: AttachAction) => {
    if (members.filter((m) => m.user.id !== currentUserId).length === 0) {
      Alert.alert("No members", "Add more people to this project to mention or assign tasks.");
      return;
    }
    if (action === "assign_task") {
      if (!taskGroupId) {
        Alert.alert("Unavailable", "Task assignment is not ready yet. Try again in a moment.");
        return;
      }
      setAssignKindOpen(true);
      return;
    }
    setPickerMode(action);
  };

  const handleAssignKind = (kind: "group" | "individual") => {
    setAssignKindOpen(false);
    if (kind === "group") {
      if (!projectId) {
        Alert.alert("Unavailable", "Open this chat from the project to add a team task.");
        return;
      }
      setGroupTaskOpen(true);
    } else {
      setPickerMode("assign_task");
    }
  };

  const handleGroupTaskConfirm = async (taskTitle: string, description?: string) => {
    if (!projectId) return;
    setGroupTaskLoading(true);
    const taskRes = await projectsService.createProjectTask(projectId, {
      title: taskTitle,
      description,
    });
    setGroupTaskLoading(false);
    if (!taskRes.success || !taskRes.data) {
      Alert.alert("Error", taskRes.error || "Could not create team task");
      return;
    }
    setGroupTaskOpen(false);
    const content = text.trim()
      ? `${text.trim()}\n📋 Team task: ${taskTitle}`
      : `📋 Team task: ${taskTitle}`;
    onSend({
      content,
      mentionedUserIds: [...mentionedIds],
      linkedTaskId: taskRes.data.id,
    });
    setText("");
    setMentionedIds([]);
    const socket = getSocket();
    if (socket) socket.emit("typing:stop", { groupId });
    typingRef.current = false;
  };

  const handleMemberSelect = (member: ProjectMember) => {
    if (pickerMode === "mention") {
      addMention(member);
      setPickerMode(null);
      return;
    }
    if (pickerMode === "assign_task") {
      setAssignMember(member);
      setPickerMode(null);
    }
  };

  const handleAssignConfirm = (taskTitle: string) => {
    if (!assignMember || !taskGroupId) return;
    const token = mentionToken(assignMember.user.name);
    const content = text.trim()
      ? `${text.trim()}\n📋 ${taskTitle}`
      : `${token}📋 ${taskTitle}`;
    const mentionedUserIds = [...new Set([...mentionedIds, assignMember.user.id])];

    onSend({
      content,
      mentionedUserIds,
      assignTask: {
        title: taskTitle,
        assignedTo: assignMember.user.id,
        taskGroupId,
      },
    });

    setText("");
    setMentionedIds([]);
    setAssignMember(null);
    const socket = getSocket();
    if (socket) socket.emit("typing:stop", { groupId });
    typingRef.current = false;
  };

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    const socket = getSocket();
    if (socket) socket.emit("typing:stop", { groupId });
    typingRef.current = false;

    onSend({
      content,
      mentionedUserIds: mentionedIds,
    });

    setText("");
    setMentionedIds([]);
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom + 8 : 24}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          style={[styles.attach, { borderColor: theme.border }]}
          hitSlop={6}
        >
          <Ionicons name="add" size={24} color={theme.primary} />
        </TouchableOpacity>

        <TextInput
          value={text}
          onChangeText={handleChange}
          placeholder="Message..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.send, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="send" size={20} color={theme.onPrimary} />
        </TouchableOpacity>
      </View>

      <ChatAttachMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelect={handleAttachSelect}
      />
      <MemberPickerModal
        visible={pickerMode !== null}
        title={pickerMode === "assign_task" ? "Assign task to" : "Mention someone"}
        members={members}
        excludeUserId={currentUserId}
        onClose={() => setPickerMode(null)}
        onSelect={handleMemberSelect}
      />
      <TaskAssignKindModal
        visible={assignKindOpen}
        onClose={() => setAssignKindOpen(false)}
        onSelect={handleAssignKind}
      />
      <GroupTaskTitleModal
        visible={groupTaskOpen}
        defaultTitle={text.trim()}
        loading={groupTaskLoading}
        onClose={() => setGroupTaskOpen(false)}
        onConfirm={handleGroupTaskConfirm}
      />
      <AssignTaskModal
        visible={!!assignMember}
        member={assignMember}
        defaultTitle={text.trim()}
        onClose={() => setAssignMember(null)}
        onConfirm={handleAssignConfirm}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  attach: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
