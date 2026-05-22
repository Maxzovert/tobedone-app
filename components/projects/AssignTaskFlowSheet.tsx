import { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProjectMember, TaskGroup } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TaskAssignKindModal, AssignTaskKind } from "@/components/projects/TaskAssignKindModal";
import { KeyboardBottomSheet } from "@/components/ui/KeyboardBottomSheet";
import { spacing, radius, typography } from "@/constants/theme";

type Step = "kind" | "form";

export type GroupTaskPayload = {
  groupId: string;
  title: string;
  description?: string;
};

export type IndividualTaskPayload = {
  groupId: string;
  member: ProjectMember;
  title: string;
};

interface Props {
  visible: boolean;
  discussionGroups: TaskGroup[];
  members: ProjectMember[];
  currentUserId: string;
  isOwner: boolean;
  onClose: () => void;
  onSubmitGroup: (data: GroupTaskPayload) => void;
  onSubmitIndividual: (data: IndividualTaskPayload) => void;
  loading?: boolean;
  error?: string;
}

export function AssignTaskFlowSheet({
  visible,
  discussionGroups,
  members,
  currentUserId,
  isOwner,
  onClose,
  onSubmitGroup,
  onSubmitIndividual,
  loading,
  error,
}: Props) {
  const { theme } = useTheme();
  const [step, setStep] = useState<Step>("kind");
  const [kind, setKind] = useState<AssignTaskKind | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);

  const postableGroups = useMemo(
    () => discussionGroups.filter((g) => isOwner || g.groupType !== "admin"),
    [discussionGroups, isOwner]
  );

  const memberList = members.filter((m) => m.user.id !== currentUserId);

  const reset = () => {
    setStep("kind");
    setKind(null);
    setTitle("");
    setDescription("");
    setSelectedGroupId(null);
    setSelectedMember(null);
  };

  useEffect(() => {
    if (!visible) reset();
  }, [visible]);

  useEffect(() => {
    if (kind && postableGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(postableGroups[0].id);
    }
  }, [kind, postableGroups, selectedGroupId]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickKind = (k: AssignTaskKind) => {
    setKind(k);
    setStep("form");
    if (postableGroups[0]) setSelectedGroupId(postableGroups[0].id);
  };

  const handleBack = () => {
    setStep("kind");
    setKind(null);
    setTitle("");
    setDescription("");
    setSelectedMember(null);
  };

  const handleSubmit = () => {
    if (!selectedGroupId || !title.trim()) return;
    if (kind === "group") {
      onSubmitGroup({
        groupId: selectedGroupId,
        title: title.trim(),
        description: description.trim() || undefined,
      });
    } else if (kind === "individual" && selectedMember) {
      onSubmitIndividual({
        groupId: selectedGroupId,
        member: selectedMember,
        title: title.trim(),
      });
    }
  };

  const showKindModal = visible && step === "kind";

  return (
    <>
      <TaskAssignKindModal
        visible={showKindModal}
        onClose={handleClose}
        onSelect={handlePickKind}
      />

      <KeyboardBottomSheet
        visible={visible && step === "form" && !!kind}
        onClose={handleClose}
      >
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
            <View style={styles.headerRow}>
              <Pressable onPress={handleBack} hitSlop={8}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
              </Pressable>
              <Text style={[styles.heading, { color: theme.text }]}>
                {kind === "group" ? "Group task" : "Individual task"}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              {kind === "group"
                ? "Everyone gets this on their todos. Choose which group to announce it in."
                : "One assignee. The task appears in chat and on their todos."}
            </Text>

            {postableGroups.length === 0 ? (
              <Text style={[styles.warn, { color: theme.warning }]}>
                {isOwner
                  ? "Create a discussion group first."
                  : "No normal groups available. Ask the owner to add a group or use an existing chat."}
              </Text>
            ) : (
              <>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Post in group</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                  {postableGroups.map((g) => {
                    const active = selectedGroupId === g.id;
                    const isAdmin = g.groupType === "admin";
                    return (
                      <Pressable
                        key={g.id}
                        onPress={() => setSelectedGroupId(g.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active
                              ? (isAdmin ? theme.accent : theme.primary) + "18"
                              : theme.background,
                            borderColor: active
                              ? isAdmin
                                ? theme.accent
                                : theme.primary
                              : theme.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name={isAdmin ? "shield-checkmark" : "people"}
                          size={14}
                          color={
                            active
                              ? isAdmin
                                ? theme.accent
                                : theme.primary
                              : theme.textSecondary
                          }
                        />
                        <Text style={{ color: theme.text, fontWeight: active ? "600" : "400" }}>
                          {g.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {!isOwner && discussionGroups.some((g) => g.groupType === "admin") && (
                  <Text style={[styles.adminNote, { color: theme.textSecondary }]}>
                    Admin groups are owner-only to post. Pick a normal group.
                  </Text>
                )}

                {kind === "individual" && (
                  <>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Assign to</Text>
                    <View style={styles.members}>
                      {memberList.map((m) => {
                        const active = selectedMember?.id === m.id;
                        return (
                          <Pressable
                            key={m.id}
                            onPress={() => setSelectedMember(m)}
                            style={[
                              styles.memberBubble,
                              {
                                backgroundColor: active ? theme.primary + "14" : theme.background,
                                borderColor: active ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            <Avatar name={m.user.name} uri={m.user.avatar} size={32} />
                            <Text style={{ color: theme.text, fontWeight: active ? "600" : "400" }}>
                              {m.user.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                )}

                <Input label="Task title" value={title} onChangeText={setTitle} placeholder="What needs to be done?" />
                {kind === "group" && (
                  <Input
                    label="Description (optional)"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Details for the team..."
                    multiline
                  />
                )}
                {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
                <Button
                  title={kind === "group" ? "Add to team todos" : "Assign & notify"}
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={
                    !selectedGroupId ||
                    !title.trim() ||
                    (kind === "individual" && !selectedMember)
                  }
                />
              </>
            )}
            <Pressable onPress={handleClose} style={styles.cancel}>
              <Text style={{ color: theme.textSecondary }}>Cancel</Text>
            </Pressable>
      </KeyboardBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  heading: { ...typography.h2, flex: 1, textAlign: "center" },
  hint: { ...typography.caption, marginBottom: spacing.md, textAlign: "center" },
  warn: { ...typography.body, marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.xs, marginTop: spacing.sm },
  adminNote: { fontSize: 11, marginBottom: spacing.sm },
  chips: { marginBottom: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  members: { gap: spacing.sm, marginBottom: spacing.sm },
  memberBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  errorText: { ...typography.caption, textAlign: "center", marginBottom: spacing.sm },
  cancel: { marginTop: spacing.md, alignItems: "center" },
});
