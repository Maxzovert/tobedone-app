import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Pressable,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { projectsService } from "@/services/projects.service";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { spacing, typography, radius } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { ProjectIcon } from "@/components/projects/ProjectIcon";
import { InviteCodeModal } from "@/components/projects/InviteCodeModal";
import { DiscussionGroupRow } from "@/components/projects/DiscussionGroupRow";
import { DiscussionIconPicker } from "@/components/projects/DiscussionIconPicker";
import { ExpandableFAB } from "@/components/ui/ExpandableFAB";
import { AssignTaskFlowSheet } from "@/components/projects/AssignTaskFlowSheet";
import { ProjectTasksTab } from "@/components/projects/ProjectTasksTab";
import { FAB } from "@/components/ui/FAB";
import { messagesService } from "@/services/messages.service";
import {
  DEFAULT_DISCUSSION_ICON,
  DiscussionIconName,
} from "@/constants/discussionIcons";
import { GroupType, ProjectDetail } from "@/types";

type Tab = "discussions" | "tasks" | "members";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("discussions");
  const [codeVisible, setCodeVisible] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [assignTaskOpen, setAssignTaskOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupIcon, setGroupIcon] = useState<DiscussionIconName>(DEFAULT_DISCUSSION_ICON);
  const [groupError, setGroupError] = useState("");
  const [assignError, setAssignError] = useState("");
  const [discussionGroupType, setDiscussionGroupType] = useState<GroupType>("general");

  const closeCreateSheet = () => {
    setCreateGroupOpen(false);
    setGroupName("");
    setGroupIcon(DEFAULT_DISCUSSION_ICON);
    setDiscussionGroupType("general");
    setGroupError("");
  };

  const { data, isLoading, refetch: refetchProject } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await projectsService.get(id!);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
    staleTime: 0,
  });

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      refetchProject();
      if (tab === "tasks") {
        qc.invalidateQueries({ queryKey: ["project", id, "tasks"] });
      }
    }, [id, tab, refetchProject, qc])
  );

  const createDiscussionMutation = useMutation({
    mutationFn: () =>
      projectsService.createDiscussionGroup(id!, {
        name: groupName.trim(),
        icon: groupIcon,
        groupType: discussionGroupType,
      }),
    onSuccess: (res) => {
      if (!res.success) {
        setGroupError(res.error || "Failed to create group");
        return;
      }
      qc.invalidateQueries({ queryKey: ["project", id] });
      closeCreateSheet();
    },
    onError: (e: Error) => setGroupError(e.message),
  });

  const assignGroupTaskMutation = useMutation({
    mutationFn: async (payload: {
      groupId: string;
      title: string;
      description?: string;
    }) => {
      const taskRes = await projectsService.createProjectTask(id!, {
        title: payload.title,
        description: payload.description,
      });
      if (!taskRes.success || !taskRes.data) throw new Error(taskRes.error || "Failed to create task");
      return messagesService.send({
        groupId: payload.groupId,
        content: `📋 Team task: ${payload.title}`,
        mentionedUserIds: [],
        linkedTaskId: taskRes.data.id,
      });
    },
    onSuccess: (res) => {
      if (!res.success) {
        setAssignError(res.error || "Failed to post team task");
        return;
      }
      setAssignError("");
      setAssignTaskOpen(false);
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["project", id, "tasks"] });
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
    },
    onError: (e: Error) => setAssignError(e.message),
  });

  const assignIndividualTaskMutation = useMutation({
    mutationFn: async (payload: {
      groupId: string;
      member: { user: { id: string; name: string } };
      title: string;
    }) => {
      const detail = qc.getQueryData<ProjectDetail>(["project", id]);
      const bucketId = detail?.taskBucketId;
      if (!bucketId) throw new Error("Task storage not ready");
      const mention = `@${payload.member.user.name} `;
      return messagesService.send({
        groupId: payload.groupId,
        content: `${mention}📋 ${payload.title}`,
        mentionedUserIds: [payload.member.user.id],
        assignTask: {
          title: payload.title,
          assignedTo: payload.member.user.id,
          taskGroupId: bucketId,
        },
      });
    },
    onSuccess: (res) => {
      if (!res.success) {
        setAssignError(res.error || "Failed to assign task");
        return;
      }
      setAssignError("");
      setAssignTaskOpen(false);
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
    },
    onError: (e: Error) => setAssignError(e.message),
  });

  const assignTaskLoading =
    assignGroupTaskMutation.isPending || assignIndividualTaskMutation.isPending;

  const project = data?.project;
  const isOwner = data?.isOwner ?? project?.ownerId === userId;
  const accent = project?.color || theme.primary;

  const discussionGroups = data?.taskGroups ?? [];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Skeleton height={40} style={{ margin: spacing.md }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.projectIcon, { backgroundColor: accent + "18" }]}>
          <ProjectIcon icon={project?.icon} size={28} color={accent} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {project?.name}
          </Text>
          {project?.description ? (
            <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={1}>
              {project.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerActions}>
          {isOwner && project && (
            <Pressable
              onPress={() => setCodeVisible(true)}
              style={[styles.inviteChip, { backgroundColor: theme.primary + "14", borderColor: theme.primary + "33" }]}
              hitSlop={8}
            >
              <Ionicons name="key-outline" size={16} color={theme.primary} />
              <Text style={[styles.inviteChipText, { color: theme.primary }]}>Invite</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() =>
              router.push({ pathname: "/(app)/project/settings", params: { id: id! } })
            }
            hitSlop={8}
            style={[styles.settingsBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name="settings-outline" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>

      {project && (
        <InviteCodeModal
          visible={codeVisible}
          projectName={project.name}
          inviteCode={project.inviteCode}
          onClose={() => setCodeVisible(false)}
        />
      )}

      <View style={styles.tabs}>
        {(["discussions", "tasks", "members"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[
              styles.tab,
              tab === t && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={{
                color: tab === t ? theme.primary : theme.textSecondary,
                fontWeight: tab === t ? "600" : "400",
                textTransform: "capitalize",
              }}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.body}>
        {tab === "tasks" && id ? (
          <ProjectTasksTab projectId={id} active />
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {tab === "discussions" && (
              <>
                {discussionGroups.length === 0 ? (
                  <View style={[styles.empty, { borderColor: theme.border }]}>
                    <Ionicons name="chatbubbles-outline" size={32} color={theme.textSecondary} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      No groups yet. Tap + to create a group or assign a task.
                    </Text>
                  </View>
                ) : (
                  discussionGroups.map((group) => (
                    <DiscussionGroupRow key={group.id} group={group} />
                  ))
                )}
              </>
            )}

            {tab === "members" && (
              <FlatList
                data={data?.members}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={[styles.memberRow, { borderColor: theme.border }]}>
                    <Avatar name={item.user.name} uri={item.user.avatar} />
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, { color: theme.text }]}>
                        {item.user.name}
                      </Text>
                      <Text style={{ color: theme.textSecondary }}>
                        {item.user.designation || item.user.email}
                      </Text>
                    </View>
                    <Text style={[styles.role, { color: theme.primary }]}>
                      {item.role}
                    </Text>
                  </View>
                )}
              />
            )}
          </ScrollView>
        )}
      </View>

      {tab === "tasks" && (
        <FAB
          onPress={() => {
            setAssignError("");
            setAssignTaskOpen(true);
          }}
        />
      )}

      <ExpandableFAB
        visible={tab === "discussions"}
        items={[
          ...(isOwner
            ? [
                {
                  id: "create_group",
                  label: "Create group",
                  icon: "chatbubbles",
                  accent: theme.primary,
                  onPress: () => {
                    setGroupError("");
                    setDiscussionGroupType("general");
                    setCreateGroupOpen(true);
                  },
                },
              ]
            : []),
          {
            id: "assign_task",
            label: "Assign task",
            icon: "checkbox-outline",
            accent: theme.accent,
            onPress: () => {
              setAssignError("");
              setAssignTaskOpen(true);
            },
          },
        ]}
      />

      <AssignTaskFlowSheet
        visible={assignTaskOpen}
        discussionGroups={discussionGroups}
        members={data?.members ?? []}
        currentUserId={userId ?? ""}
        isOwner={isOwner}
        onClose={() => setAssignTaskOpen(false)}
        onSubmitGroup={(payload) => assignGroupTaskMutation.mutate(payload)}
        onSubmitIndividual={(payload) => assignIndividualTaskMutation.mutate(payload)}
        loading={assignTaskLoading}
        error={assignError}
      />

      <Modal
        visible={createGroupOpen}
        transparent
        animationType="slide"
        onRequestClose={closeCreateSheet}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          onPress={closeCreateSheet}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Create group</Text>

            <DiscussionIconPicker value={groupIcon} onChange={setGroupIcon} />
            <Text style={[styles.typeLabel, { color: theme.textSecondary }]}>Group type</Text>
            <View style={styles.typeRow}>
              {(["general", "admin"] as GroupType[]).map((type) => {
                const selected = discussionGroupType === type;
                const adminLocked = type === "admin" && !isOwner;
                return (
                  <Pressable
                    key={type}
                    disabled={adminLocked}
                    onPress={() => setDiscussionGroupType(type)}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: selected ? theme.primary + "14" : theme.background,
                        borderColor: selected ? theme.primary : theme.border,
                        opacity: adminLocked ? 0.45 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={type === "admin" ? "shield-checkmark" : "people"}
                      size={18}
                      color={selected ? theme.primary : theme.textSecondary}
                    />
                    <View style={styles.typeText}>
                      <Text style={{ color: theme.text, fontWeight: "600" }}>
                        {type === "admin" ? "Admin" : "Normal"}
                      </Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 11 }}>
                        {type === "admin"
                          ? "You assign tasks & send messages; members read only"
                          : "Everyone can chat and assign tasks"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Input
              label="Group name"
              value={groupName}
              onChangeText={setGroupName}
              placeholder="e.g. Team chat or Assignments"
            />
            {groupError ? (
              <Text style={[styles.groupError, { color: theme.danger }]}>{groupError}</Text>
            ) : null}
            <Button
              title="Create group"
              onPress={() => {
                if (!groupName.trim()) {
                  setGroupError("Name is required");
                  return;
                }
                createDiscussionMutation.mutate();
              }}
              loading={createDiscussionMutation.isPending}
            />
            <Pressable onPress={closeCreateSheet} style={styles.cancel}>
              <Text style={{ color: theme.textSecondary }}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1, minWidth: 0 },
  title: { ...typography.h2 },
  desc: { ...typography.caption, marginTop: 2 },
  inviteChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  inviteChipText: { fontSize: 12, fontWeight: "600" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: { ...typography.caption, marginBottom: spacing.xs },
  typeRow: { gap: spacing.sm, marginBottom: spacing.md },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  typeText: { flex: 1 },
  tabs: { flexDirection: "row", paddingHorizontal: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: "center" },
  body: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 100 },
  empty: {
    alignItems: "center",
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: spacing.sm,
  },
  emptyText: { ...typography.caption, textAlign: "center" },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  memberInfo: { flex: 1 },
  memberName: { ...typography.body, fontWeight: "600" },
  role: { ...typography.caption, textTransform: "capitalize" },
  groupBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  groupIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  groupName: { ...typography.body, fontWeight: "600", flex: 1 },
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetTitle: { ...typography.h2, marginBottom: spacing.md },
  groupError: { ...typography.caption, marginBottom: spacing.sm, textAlign: "center" },
  cancel: { marginTop: spacing.md, alignItems: "center" },
});
