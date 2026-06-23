import { ReactNode, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius } from "@/constants/theme";

const ACTION_WIDTH = 96;

type Props = {
  children: ReactNode;
  onDelete: () => void;
  enabled?: boolean;
  dangerColor?: string;
};

export function SwipeToDeleteRow({
  children,
  onDelete,
  enabled = true,
  dangerColor = "#ef4444",
}: Props) {
  const swipeRef = useRef<Swipeable>(null);

  const handleDelete = useCallback(() => {
    swipeRef.current?.close();
    onDelete();
  }, [onDelete]);

  if (!enabled) {
    return <View style={styles.wrap}>{children}</View>;
  }

  if (Platform.OS === "web") {
    return (
      <View style={styles.webWrap}>
        <View style={styles.webContent}>{children}</View>
        <Pressable
          onPress={onDelete}
          style={[styles.webDelete, { backgroundColor: dangerColor }]}
          accessibilityRole="button"
          accessibilityLabel="Delete"
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </Pressable>
      </View>
    );
  }

  const renderRightActions = () => (
    <View style={[styles.actionWrap, { width: ACTION_WIDTH }]}>
      <Pressable
        style={[styles.deleteBtn, { backgroundColor: dangerColor }]}
        onPress={handleDelete}
      >
        <Ionicons name="trash-outline" size={22} color="#fff" />
        <Text style={styles.deleteLabel}>Delete</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.wrap}>
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={1}
        rightThreshold={ACTION_WIDTH / 2}
        containerStyle={styles.swipeContainer}
      >
        {children}
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  swipeContainer: {
    overflow: "hidden",
    borderRadius: radius.lg,
  },
  actionWrap: {
    marginLeft: spacing.xs,
    justifyContent: "center",
  },
  deleteBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.lg,
    gap: 4,
    minHeight: 72,
  },
  deleteLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  webWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.xs,
  },
  webContent: {
    flex: 1,
    minWidth: 0,
  },
  webDelete: {
    width: 48,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
