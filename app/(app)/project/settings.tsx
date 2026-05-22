import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { projectsService } from "@/services/projects.service";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconPicker } from "@/components/projects/IconPicker";
import { spacing, typography, radius } from "@/constants/theme";
import { DEFAULT_PROJECT_ICON } from "@/constants/projectIcons";
import { isDiscussionGroup } from "@/constants/discussionIcons";
import { discussionIconOrDefault } from "@/constants/discussionIcons";
import { TaskGroup } from "@/types";
import { useAuthStore } from "@/stores/auth-store";

export default function ProjectSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(DEFAULT_PROJECT_ICON);
  const [saveError, setSaveError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await projectsService.get(id!);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
  });

  const userId = useAuthStore((s) => s.user?.id);
  const project = data?.project;
  const isOwner = data?.isOwner ?? project?.ownerId === userId;
  const accent = project?.color || theme.primary;

  useEffect(() => {
    if (project) {
      setName(project.name);
      setIcon(project.icon || DEFAULT_PROJECT_ICON);
    }
  }, [project?.id, project?.name, project?.icon]);

  const updateMutation = useMutation({
    mutationFn: () =>
      projectsService.update(id!, {
        name: name.trim(),
        icon,
        color: project?.color || undefined,
      }),
    onSuccess: (res) => {
      if (!res.success) {
        setSaveError(res.error || "Failed to save");
        return;
      }
      qc.invalidateQueries({ queryKey: ["project", id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      setSaveError("");
      router.back();
    },
    onError: (e: Error) => setSaveError(e.message),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectsService.delete(id!),
    onSuccess: (res) => {
      if (!res.success) {
        Alert.alert("Error", res.error || "Could not delete project");
        return;
      }
      qc.invalidateQueries({ queryKey: ["projects"] });
      router.replace("/(app)/(tabs)/projects");
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => projectsService.deleteGroup(id!, groupId),
    onSuccess: (res) => {
      if (!res.success) {
        Alert.alert("Error", res.error || "Could not delete group");
        return;
      }
      qc.invalidateQueries({ queryKey: ["project", id] });
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const confirmDeleteGroup = (group: TaskGroup) => {
    Alert.alert(
      "Delete group",
      `Remove "${group.name}"? Messages in this group will be lost.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteGroupMutation.mutate(group.id),
        },
      ]
    );
  };

  const confirmDeleteProject = () => {
    Alert.alert(
      "Delete project",
      `Delete "${project?.name}" for everyone? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteProjectMutation.mutate(),
        },
      ]
    );
  };

  if (isLoading || !project) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textSecondary, padding: spacing.md }}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (!isOwner) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Project settings</Text>
        </View>
        <Text style={[styles.denied, { color: theme.textSecondary }]}>
          Only the project owner can change settings.
        </Text>
      </SafeAreaView>
    );
  }

  const groups = (data?.taskGroups ?? []).filter((g) => isDiscussionGroup(g));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Project settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.section, { color: theme.textSecondary }]}>Project</Text>
        <IconPicker value={icon} onChange={setIcon} accentColor={accent} />
        <Input label="Project name" value={name} onChangeText={setName} placeholder="Project name" />
        {saveError ? (
          <Text style={[styles.error, { color: theme.danger }]}>{saveError}</Text>
        ) : null}
        <Button
          title="Save changes"
          onPress={() => {
            if (!name.trim()) {
              setSaveError("Name is required");
              return;
            }
            updateMutation.mutate();
          }}
          loading={updateMutation.isPending}
        />

        <Text style={[styles.section, { color: theme.textSecondary, marginTop: spacing.lg }]}>
          Groups
        </Text>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Remove discussion or task groups you no longer need.
        </Text>
        {groups.length === 0 ? (
          <Text style={[styles.hint, { color: theme.textSecondary }]}>No groups yet.</Text>
        ) : (
          groups.map((group) => {
            const discussion = isDiscussionGroup(group);
            const iconName = discussion
              ? discussionIconOrDefault(group.icon)
              : "folder";
            return (
              <View
                key={group.id}
                style={[styles.groupRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={[styles.groupIcon, { backgroundColor: accent + "14" }]}>
                  <Ionicons name={iconName} size={20} color={accent} />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupName, { color: theme.text }]} numberOfLines={1}>
                    {group.name}
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {discussion ? "Discussion" : "Tasks"}
                    {group.groupType === "admin" ? " · Admin" : " · Normal"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => confirmDeleteGroup(group)}
                  hitSlop={8}
                  disabled={deleteGroupMutation.isPending}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.danger} />
                </Pressable>
              </View>
            );
          })
        )}

        <View style={[styles.dangerZone, { borderColor: theme.danger + "44" }]}>
          <Text style={[styles.section, { color: theme.danger }]}>Danger zone</Text>
          <Button
            title="Delete project"
            onPress={confirmDeleteProject}
            loading={deleteProjectMutation.isPending}
            style={{ backgroundColor: theme.danger, borderColor: theme.danger }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  title: { ...typography.h2 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  section: { ...typography.caption, marginBottom: spacing.sm, textTransform: "uppercase" },
  hint: { ...typography.caption, marginBottom: spacing.md },
  error: { ...typography.caption, marginBottom: spacing.sm, textAlign: "center" },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  groupInfo: { flex: 1, minWidth: 0 },
  groupName: { ...typography.body, fontWeight: "600" },
  dangerZone: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  denied: { ...typography.body, padding: spacing.md, textAlign: "center" },
});
