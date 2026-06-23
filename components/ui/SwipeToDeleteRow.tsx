import { ReactNode, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from "react-native";
import { Swipeable, RectButton } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { spacing, radius } from "@/constants/theme";

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

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-88, 0],
      outputRange: [0, 88],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={[styles.actions, { transform: [{ translateX }] }]}>
        <RectButton
          style={[styles.deleteBtn, { backgroundColor: dangerColor }]}
          onPress={() => {
            swipeRef.current?.close();
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text style={styles.deleteLabel}>Delete</Text>
        </RectButton>
      </Animated.View>
    );
  };

  return (
    <View style={styles.wrap}>
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
        rightThreshold={36}
        enableTrackpadTwoFingerGesture
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
  actions: {
    width: 88,
    flexDirection: "row",
  },
  deleteBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.lg,
    gap: 4,
    marginLeft: spacing.xs,
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
