import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ALL_EMOJIS, EMOJI_CATEGORIES } from "@/constants/emojiCategories";
import { spacing, radius, typography } from "@/constants/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

const NUM_COLUMNS = 8;

export function EmojiPickerModal({ visible, onClose, onSelect }: Props) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - spacing.md * 2) / NUM_COLUMNS);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState(EMOJI_CATEGORIES[0].id);

  const emojis = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return ALL_EMOJIS;
    const cat = EMOJI_CATEGORIES.find((c) => c.id === categoryId);
    return cat?.emojis ?? ALL_EMOJIS;
  }, [query, categoryId]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setQuery("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.sheetHeader}>
            <Text style={[styles.title, { color: theme.text }]}>Pick emoji</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search (shows all emojis)"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.search,
              {
                color: theme.text,
                backgroundColor: theme.background,
                borderColor: theme.border,
              },
            ]}
          />

          {!query.trim() && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabs}
            >
              {EMOJI_CATEGORIES.map((cat) => {
                const active = cat.id === categoryId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    style={[
                      styles.tab,
                      {
                        backgroundColor: active ? theme.primary + "18" : theme.background,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? theme.primary : theme.textSecondary,
                        fontWeight: active ? "600" : "400",
                        fontSize: 12,
                      }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <FlatList
            data={emojis}
            keyExtractor={(item, index) => `${item}-${index}`}
            numColumns={NUM_COLUMNS}
            style={styles.grid}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={[styles.emojiCell, { width: cellSize, height: cellSize }]}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.emoji}>{item}</Text>
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "72%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  title: { ...typography.h3 },
  search: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: 15,
  },
  tabs: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    marginRight: spacing.xs,
  },
  grid: { paddingHorizontal: spacing.sm },
  emojiCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 26 },
});
