import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import {
  PROJECT_ICONS,
  DEFAULT_PROJECT_ICON,
  encodeEmojiIcon,
  getProjectIconDisplay,
} from "@/constants/projectIcons";
import { ProjectIcon } from "@/components/projects/ProjectIcon";
import { EmojiPickerModal } from "@/components/projects/EmojiPickerModal";
import { spacing, radius, typography } from "@/constants/theme";

interface Props {
  value: string;
  onChange: (icon: string) => void;
  accentColor: string;
}

export function IconPicker({ value, onChange, accentColor }: Props) {
  const { theme } = useTheme();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const display = getProjectIconDisplay(value);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Project icon</Text>
      <View style={styles.grid}>
        <Pressable
          onPress={() => setEmojiOpen(true)}
          style={[
            styles.item,
            styles.emojiBtn,
            {
              backgroundColor:
                display.type === "emoji" ? accentColor + "18" : theme.background,
              borderColor: display.type === "emoji" ? accentColor : theme.border,
            },
          ]}
        >
          {display.type === "emoji" ? (
            <Text style={styles.emojiPreview}>{display.emoji}</Text>
          ) : (
            <Ionicons name="happy-outline" size={22} color={theme.textSecondary} />
          )}
          <Text style={[styles.emojiLabel, { color: theme.textSecondary }]}>Emoji</Text>
        </Pressable>
        {PROJECT_ICONS.map((item) => {
          const selected = value === item.name;
          return (
            <Pressable
              key={item.name}
              onPress={() => onChange(item.name)}
              style={[
                styles.item,
                {
                  backgroundColor: selected ? accentColor + "18" : theme.background,
                  borderColor: selected ? accentColor : theme.border,
                },
              ]}
            >
              <Ionicons
                name={item.name}
                size={22}
                color={selected ? accentColor : theme.textSecondary}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.preview, { backgroundColor: accentColor + "12" }]}>
        <ProjectIcon icon={value} size={28} color={accentColor} />
        <Text style={[styles.previewText, { color: theme.textSecondary }]}>Preview</Text>
      </View>
      <EmojiPickerModal
        visible={emojiOpen}
        onClose={() => setEmojiOpen(false)}
        onSelect={(emoji) => onChange(encodeEmojiIcon(emoji))}
      />
    </View>
  );
}

export { DEFAULT_PROJECT_ICON };

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.sm },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  item: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtn: { width: 56, height: 56 },
  emojiPreview: { fontSize: 26 },
  emojiLabel: { fontSize: 9, marginTop: 2 },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  previewText: { ...typography.caption },
});
