import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography } from "@/constants/theme";

type Props = {
  message?: string;
};

export function PullToRefreshHint({
  message = "Pull down to refresh · scroll to see everything",
}: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      <Ionicons name="arrow-down-circle-outline" size={14} color={theme.textSecondary} />
      <Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  text: { ...typography.small, fontSize: 12 },
});
