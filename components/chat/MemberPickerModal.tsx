import { View, Text, StyleSheet, Pressable, Modal, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProjectMember } from "@/types";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui/Avatar";
import { spacing, radius, typography } from "@/constants/theme";

interface Props {
  visible: boolean;
  title: string;
  members: ProjectMember[];
  excludeUserId?: string;
  onClose: () => void;
  onSelect: (member: ProjectMember) => void;
}

export function MemberPickerModal({
  visible,
  title,
  members,
  excludeUserId,
  onClose,
  onSelect,
}: Props) {
  const { theme } = useTheme();
  const list = members.filter((m) => m.user.id !== excludeUserId);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.bubble,
                  {
                    backgroundColor: theme.surface,
                    shadowColor: theme.cardShadow,
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <Avatar name={item.user.name} uri={item.user.avatar} size={36} />
                <View style={styles.info}>
                  <Text style={[styles.name, { color: theme.text }]}>{item.user.name}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                    {item.user.designation || item.user.email}
                  </Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.textSecondary }]}>
                No other members in this project.
              </Text>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "55%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  title: { ...typography.h3 },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  info: { flex: 1 },
  name: { ...typography.body, fontWeight: "600" },
  empty: { textAlign: "center", padding: spacing.xl },
});
