import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/constants/theme";

export type AttachAction = "mention" | "assign_task";

const BUBBLE_SIZE = 48;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (action: AttachAction) => void;
}

export function ChatAttachMenu({ visible, onClose, onSelect }: Props) {
  const { theme } = useTheme();

  const items: {
    id: AttachAction;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    accent: string;
  }[] = [
    { id: "mention", label: "Mention", icon: "at", accent: theme.primary },
    { id: "assign_task", label: "Assign task", icon: "checkbox-outline", accent: theme.accent },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <View style={styles.menuAnchor} pointerEvents="box-none">
          <View style={styles.menuColumn}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.bubbleRow,
                  pressed && { opacity: 0.88 },
                ]}
              >
                <View
                  style={[
                    styles.iconBubble,
                    { backgroundColor: item.accent, shadowColor: item.accent },
                  ]}
                >
                  <Ionicons name={item.icon} size={22} color={theme.onPrimary} />
                </View>
                <View
                  style={[
                    styles.labelBubble,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      shadowColor: theme.cardShadow,
                    },
                  ]}
                >
                  <Text style={[styles.labelText, { color: theme.text }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  menuAnchor: {
    paddingLeft: spacing.sm,
    paddingBottom: spacing.xl + 52,
  },
  menuColumn: {
    alignItems: "flex-start",
    gap: 12,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  labelBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
