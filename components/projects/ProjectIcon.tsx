import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getProjectIconDisplay,
  ProjectIconName,
} from "@/constants/projectIcons";

interface Props {
  icon: string | null | undefined;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function ProjectIcon({ icon, size = 24, color, style }: Props) {
  const display = getProjectIconDisplay(icon);

  if (display.type === "emoji") {
    return (
      <View style={[styles.wrap, style]}>
        <Text style={{ fontSize: size * 0.9, lineHeight: size }}>{display.emoji}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <Ionicons name={display.name as ProjectIconName} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
});
