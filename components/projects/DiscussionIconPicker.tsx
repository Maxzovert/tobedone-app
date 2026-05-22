import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import {
  DISCUSSION_ICONS,
  DiscussionIconName,
} from "@/constants/discussionIcons";
import { spacing, radius, typography } from "@/constants/theme";

interface Props {
  value: DiscussionIconName;
  onChange: (icon: DiscussionIconName) => void;
}

export function DiscussionIconPicker({ value, onChange }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Group icon</Text>
      <View style={styles.grid}>
        {DISCUSSION_ICONS.map((item) => {
          const selected = value === item.name;
          return (
            <Pressable
              key={item.name}
              onPress={() => onChange(item.name)}
              style={[
                styles.item,
                {
                  backgroundColor: selected ? theme.primary + "18" : theme.background,
                  borderColor: selected ? theme.primary : theme.border,
                },
              ]}
            >
              <Ionicons
                name={item.name}
                size={20}
                color={selected ? theme.primary : theme.textSecondary}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  item: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
