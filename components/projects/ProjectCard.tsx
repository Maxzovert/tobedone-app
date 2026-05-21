import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Project } from "@/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography } from "@/constants/theme";

interface Props {
  project: Project;
}

export function ProjectCard({ project }: Props) {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/project/${project.id}`)}
      activeOpacity={0.85}
    >
      <GlassCard style={styles.card}>
        <View
          style={[styles.icon, { backgroundColor: project.color || theme.primary }]}
        >
          <Text style={styles.iconText}>
            {project.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {project.name}
        </Text>
        {project.description && (
          <Text
            style={[styles.desc, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {project.description}
          </Text>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  iconText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  name: { ...typography.h3 },
  desc: { ...typography.caption, marginTop: 4 },
});
