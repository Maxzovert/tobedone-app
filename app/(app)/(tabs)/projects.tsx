import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { projectsService } from "@/services/projects.service";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/stores/auth-store";
import { ProjectListItem } from "@/components/projects/ProjectListItem";
import { IconPicker, DEFAULT_PROJECT_ICON } from "@/components/projects/IconPicker";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing, typography, radius } from "@/constants/theme";
import { InviteCodeModal } from "@/components/projects/InviteCodeModal";
import { Project } from "@/types";

type ModalMode = "create" | "join" | null;

export default function ProjectsScreen() {
  const { theme } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  const [modal, setModal] = useState<ModalMode>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [icon, setIcon] = useState<string>(DEFAULT_PROJECT_ICON);
  const [error, setError] = useState("");
  const [createdProject, setCreatedProject] = useState<Project | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await projectsService.list();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });

  const closeModal = () => {
    setModal(null);
    setError("");
    setName("");
    setDescription("");
    setInviteCode("");
    setIcon(DEFAULT_PROJECT_ICON);
  };

  const createMutation = useMutation({
    mutationFn: () =>
      projectsService.create({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
        color: theme.primary,
      }),
    onSuccess: (res) => {
      if (!res.success) {
        setError(res.error || "Failed to create project");
        return;
      }
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
      closeModal();
      if (res.data) setCreatedProject(res.data);
    },
    onError: (e: Error) => setError(e.message),
  });

  const joinMutation = useMutation({
    mutationFn: () => projectsService.join(inviteCode.trim().toUpperCase()),
    onSuccess: (res) => {
      if (!res.success) {
        setError(res.error || "Invalid invite code");
        return;
      }
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "home"] });
      closeModal();
      Alert.alert("Joined", `You joined "${res.data?.name}".`);
    },
    onError: (e: Error) => setError(e.message),
  });

  const openCreate = () => {
    setError("");
    setModal("create");
  };

  const openJoin = () => {
    setError("");
    setModal("join");
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Projects</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {data?.length ?? 0} workspace{(data?.length ?? 0) === 1 ? "" : "s"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={openJoin}
            style={[styles.headerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name="enter-outline" size={20} color={theme.primary} />
            <Text style={[styles.headerBtnText, { color: theme.primary }]}>Join</Text>
          </Pressable>
          <Pressable
            onPress={openCreate}
            style={[styles.headerBtn, styles.headerBtnPrimary, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="add" size={22} color={theme.onPrimary} />
            <Text style={[styles.headerBtnText, { color: theme.onPrimary }]}>New</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={88} borderRadius={radius.lg} style={{ marginBottom: spacing.sm }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectListItem project={item} isOwner={item.ownerId === userId} />
          )}
          contentContainerStyle={styles.list}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: theme.primary + "12" }]}>
                <Ionicons name="folder-open-outline" size={36} color={theme.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No projects yet</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Create a group and share the invite code, or join with a code from your team lead.
              </Text>
              <View style={styles.emptyActions}>
                <Pressable
                  onPress={openCreate}
                  style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={{ color: theme.onPrimary, fontWeight: "600" }}>Create group</Text>
                </Pressable>
                <Pressable
                  onPress={openJoin}
                  style={[styles.emptyBtnOutline, { borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.primary, fontWeight: "600" }}>Join with code</Text>
                </Pressable>
              </View>
            </View>
          }
        />
      )}

      <Modal visible={!!modal} animationType="slide" transparent onRequestClose={closeModal}>
        <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={closeModal}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>
              {modal === "create" ? "Create group" : "Join group"}
            </Text>
            <Text style={[styles.sheetHint, { color: theme.textSecondary }]}>
              {modal === "create"
                ? "Pick an icon and name. You'll get an invite code to share."
                : "Enter the invite code from the project owner."}
            </Text>

            {modal === "create" ? (
              <>
                <IconPicker
                  value={icon}
                  onChange={setIcon}
                  accentColor={theme.primary}
                />
                <Input
                  label="Group name"
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Marketing team"
                />
                <Input
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional"
                  multiline
                />
                <Button
                  title="Create group"
                  onPress={() => {
                    if (!name.trim()) {
                      setError("Name is required");
                      return;
                    }
                    createMutation.mutate();
                  }}
                  loading={createMutation.isPending}
                />
              </>
            ) : (
              <>
                <Input
                  label="Invite code"
                  value={inviteCode}
                  onChangeText={(t) => setInviteCode(t.toUpperCase())}
                  placeholder="ABCD1234"
                  autoCapitalize="characters"
                />
                <Button
                  title="Join group"
                  onPress={() => {
                    if (inviteCode.trim().length < 4) {
                      setError("Enter a valid invite code");
                      return;
                    }
                    joinMutation.mutate();
                  }}
                  loading={joinMutation.isPending}
                />
              </>
            )}

            {error ? (
              <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
            ) : null}

            <Pressable onPress={closeModal} style={styles.cancel}>
              <Text style={{ color: theme.textSecondary }}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {createdProject && (
        <InviteCodeModal
          visible
          projectName={createdProject.name}
          inviteCode={createdProject.inviteCode}
          onClose={() => setCreatedProject(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { ...typography.caption, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  headerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  headerBtnPrimary: { borderWidth: 0 },
  headerBtnText: { fontSize: 14, fontWeight: "600" },
  loading: { paddingHorizontal: spacing.md },
  list: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  empty: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { ...typography.h3, marginBottom: spacing.xs },
  emptyText: { ...typography.caption, textAlign: "center", lineHeight: 20 },
  emptyActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  emptyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
  },
  emptyBtnOutline: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: "90%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetTitle: { ...typography.h2, marginBottom: spacing.xs },
  sheetHint: { ...typography.caption, marginBottom: spacing.md, lineHeight: 18 },
  error: { ...typography.caption, marginTop: spacing.sm, textAlign: "center" },
  cancel: { marginTop: spacing.md, alignItems: "center" },
});
