import { ReactNode } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing } from "@/constants/theme";

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: Props) {
  const { theme, isDark } = useTheme();
  return (
    <View
      style={[
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        {
          backgroundColor: isDark ? theme.surfaceGlass : theme.surface,
          borderColor: theme.border,
          shadowColor: theme.cardShadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardLight: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
});
