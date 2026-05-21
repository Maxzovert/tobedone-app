import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { projectsService } from "@/services/projects.service";
import { useTheme } from "@/hooks/useTheme";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { FAB } from "@/components/ui/FAB";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing, typography } from "@/constants/theme";

export default function ProjectsScreen() {
  const { theme } = useTheme();
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | "join" | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await projectsService.list();
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => projectsService.create({ name, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setModal(null);
      setName("");
      setDescription("");
    },
  });

  const joinMutation = useMutation({
    mutationFn: () => projectsService.join(inviteCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setModal(null);
      setInviteCode("");
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Projects</Text>

      {isLoading ? (
        <Skeleton height={80} style={{ margin: spacing.md }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProjectCard project={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              Create or join a project to get started
            </Text>
          }
        />
      )}

      <FAB onPress={() => setModal("create")} />

      <Modal visible={!!modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {modal === "create" ? "New Project" : "Join Project"}
            </Text>

            {modal === "create" ? (
              <>
                <Input label="Name" value={name} onChangeText={setName} placeholder="Project name" />
                <Input
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Optional"
                  multiline
                />
                <Button
                  title="Create"
                  onPress={() => createMutation.mutate()}
                  loading={createMutation.isPending}
                />
              </>
            ) : (
              <>
                <Input
                  label="Invite Code"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="ABCD1234"
                />
                <Button
                  title="Join"
                  onPress={() => joinMutation.mutate()}
                  loading={joinMutation.isPending}
                />
              </>
            )}

            <TouchableOpacity
              onPress={() => setModal(modal === "create" ? "join" : "create")}
              style={{ marginTop: spacing.sm }}
            >
              <Text style={{ color: theme.primary, textAlign: "center" }}>
                {modal === "create" ? "Have an invite code?" : "Create new instead"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModal(null)} style={{ marginTop: spacing.md }}>
              <Text style={{ color: theme.textSecondary, textAlign: "center" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { ...typography.h1, padding: spacing.md },
  list: { padding: spacing.md, paddingBottom: 100 },
  empty: { textAlign: "center", marginTop: spacing.xl },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    padding: spacing.lg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: { ...typography.h2, marginBottom: spacing.md },
});
