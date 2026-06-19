import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { TobedoneLogo } from "@/components/brand/TobedoneLogo";
import { spacing } from "@/constants/theme";

/** Shown while auth restores from device storage (fast). */
export function AppBootSplash() {
  const { theme } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <TobedoneLogo width={64} height={76} color={theme.primary} />
      <ActivityIndicator
        size="small"
        color={theme.primary}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginTop: spacing.lg,
  },
});
