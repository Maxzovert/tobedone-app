import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function FAB({ onPress, icon = "add" }: Props) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.fab, { backgroundColor: theme.primary }]}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={28} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
