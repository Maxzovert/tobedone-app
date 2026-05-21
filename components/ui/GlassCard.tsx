import { ReactNode } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing } from "@/constants/theme";

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: Props) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surfaceGlass,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
});
