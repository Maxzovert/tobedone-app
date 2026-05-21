import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { projectsService } from "@/services/projects.service";
import { useTheme } from "@/hooks/useTheme";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { spacing, typography, radius } from "@/constants/theme";

type Tab = "tasks" | "members" | "discussions";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const [tab, setTab] = useState<Tab>("discussions");

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const res = await projectsService.get(id!);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
  });

  const discussionGroupId = `discussion-${id}`;

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
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: theme.text }]}>
            {data?.project.name}
          </Text>
          <Text style={[styles.invite, { color: theme.textSecondary }]}>
            Invite: {data?.project.inviteCode}
          </Text>
        </View>
      </View>

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

      <ScrollView contentContainerStyle={styles.content}>
        {tab === "discussions" && (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(app)/chat/[groupId]",
                params: { groupId: discussionGroupId, title: "Discussions" },
              })
            }
          >
            <GlassCard>
              <View style={styles.chatPreview}>
                <Ionicons name="chatbubbles" size={32} color={theme.primary} />
                <View>
                  <Text style={[styles.chatTitle, { color: theme.text }]}>
                    Team Discussions
                  </Text>
                  <Text style={{ color: theme.textSecondary }}>
                    Open real-time chat
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </View>
            </GlassCard>
          </TouchableOpacity>
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

        {tab === "tasks" && (
          <>
            {data?.taskGroups
              .filter((g) => !g.id.startsWith("discussion-"))
              .map((group) => (
                <GlassCard key={group.id} style={{ marginBottom: spacing.sm }}>
                  <Text style={[styles.groupName, { color: theme.text }]}>
                    {group.name}
                  </Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                    Task group · ID: {group.id.slice(0, 8)}...
                  </Text>
                </GlassCard>
              ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  headerInfo: { flex: 1 },
  title: { ...typography.h2 },
  invite: { ...typography.caption },
  tabs: { flexDirection: "row", paddingHorizontal: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: "center" },
  content: { padding: spacing.md },
  chatPreview: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  chatTitle: { ...typography.h3 },
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
  groupName: { ...typography.h3 },
});
