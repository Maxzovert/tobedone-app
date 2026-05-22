import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Project } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, radius } from "@/constants/theme";
import { ProjectIcon } from "@/components/projects/ProjectIcon";

interface Props {
  project: Project;
  isOwner: boolean;
}

export function ProjectListItem({ project, isOwner }: Props) {
  const router = useRouter();
  const { theme } = useTheme();
  const accent = project.color || theme.primary;

  return (
    <Pressable
      onPress={() => router.push(`/(app)/project/${project.id}`)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          shadowColor: theme.cardShadow,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent }]}>
        <ProjectIcon icon={project.icon} size={24} color={theme.onPrimary} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {project.name}
          </Text>
          {isOwner && (
            <View style={[styles.ownerBadge, { backgroundColor: theme.primary + "14" }]}>
              <Text style={[styles.ownerText, { color: theme.primary }]}>Owner</Text>
            </View>
          )}
        </View>

        {project.description ? (
          <Text style={[styles.desc, { color: theme.textSecondary }]} numberOfLines={2}>
            {project.description}
          </Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
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
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, minWidth: 0 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  name: { ...typography.h3, fontSize: 17, flexShrink: 1 },
  ownerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  ownerText: { fontSize: 11, fontWeight: "700" },
  desc: { ...typography.caption, marginTop: 4, lineHeight: 18 },
});
