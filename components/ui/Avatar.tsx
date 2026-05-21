import { View, Text, Image, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  name: string;
  uri?: string | null;
  size?: number;
}

export function Avatar({ name, uri, size = 40 }: Props) {
  const { theme } = useTheme();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.primary,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: {},
  fallback: { alignItems: "center", justifyContent: "center" },
  text: { color: "#fff", fontWeight: "700" },
});
