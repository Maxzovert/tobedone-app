import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUIStore } from "@/stores/ui-store";
import { useTheme } from "@/hooks/useTheme";
import { GlassCard } from "@/components/ui/GlassCard";
import { spacing, typography } from "@/constants/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { themeMode, setThemeMode } = useUIStore();

  const modes = [
    { id: "system" as const, label: "System" },
    { id: "light" as const, label: "Light" },
    { id: "dark" as const, label: "Dark" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.section, { color: theme.textSecondary }]}>
          Appearance
        </Text>
        <GlassCard>
          {modes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={styles.option}
              onPress={() => {
                setThemeMode(mode.id);
                if (mode.id !== "system") {
                  useUIStore.getState().setIsDark(mode.id === "dark");
                }
              }}
            >
              <Text style={{ color: theme.text }}>{mode.label}</Text>
              {themeMode === mode.id && (
                <Ionicons name="checkmark" size={20} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </GlassCard>
      </View>
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
  content: { padding: spacing.md },
  section: { ...typography.caption, marginBottom: spacing.sm },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
});
