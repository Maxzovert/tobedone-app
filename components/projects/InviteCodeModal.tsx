import { View, Text, StyleSheet, Modal, Pressable, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, typography, radius } from "@/constants/theme";

interface Props {
  visible: boolean;
  projectName: string;
  inviteCode: string;
  onClose: () => void;
}

export function InviteCodeModal({
  visible,
  projectName,
  inviteCode,
  onClose,
}: Props) {
  const { theme } = useTheme();

  const share = () => {
    Share.share({
      message: `Join "${projectName}" on Tobedone with invite code: ${inviteCode}`,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.iconWrap, { backgroundColor: theme.primary + "14" }]}>
            <Ionicons name="key" size={28} color={theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>Invite code</Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Share this code so others can join {projectName}
          </Text>

          <View style={[styles.codeBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.code, { color: theme.text }]}>{inviteCode}</Text>
          </View>

          <Pressable
            onPress={share}
            style={[styles.shareBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="share-outline" size={18} color={theme.onPrimary} />
            <Text style={[styles.shareText, { color: theme.onPrimary }]}>Share code</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.h2, marginBottom: spacing.xs },
  hint: { ...typography.caption, textAlign: "center", lineHeight: 20, marginBottom: spacing.md },
  codeBox: {
    width: "100%",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  code: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 3,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  shareText: { fontSize: 16, fontWeight: "600" },
  cancelBtn: { paddingVertical: spacing.sm },
  cancelText: { fontSize: 15, fontWeight: "500" },
});
