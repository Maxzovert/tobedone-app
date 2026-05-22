import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/constants/theme";

export interface FABMenuItem {
  id: string;
  label: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: string;
  onPress: () => void;
}

interface Props {
  items: FABMenuItem[];
  visible?: boolean;
}

const BUBBLE_SIZE = 48;
const MAIN_FAB = 56;
const H_MARGIN = 16;

export function ExpandableFAB({ items, visible = true }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const open = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const labelMaxWidth = screenWidth - H_MARGIN * 2 - BUBBLE_SIZE - spacing.sm - 8;
  const bottomOffset = Math.max(insets.bottom, 12) + 12;

  const animate = (toOpen: boolean) => {
    setMenuOpen(toOpen);
    Animated.parallel([
      Animated.spring(open, {
        toValue: toOpen ? 1 : 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: toOpen ? 1 : 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggle = () => animate(!menuOpen);
  const close = () => {
    if (menuOpen) animate(false);
  };

  useEffect(() => {
    if (!visible) close();
  }, [visible]);

  const backdropOpacity = open.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuOpacity = open.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const menuTranslateY = open.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  if (!visible) return null;

  return (
    <>
      <Animated.View
        pointerEvents={menuOpen ? "auto" : "none"}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <View
        pointerEvents="box-none"
        style={[
          styles.wrap,
          {
            bottom: bottomOffset,
            right: H_MARGIN,
            left: H_MARGIN,
            maxHeight: screenHeight - insets.top - bottomOffset - MAIN_FAB - 24,
          },
        ]}
      >
        <Animated.View
          pointerEvents={menuOpen ? "auto" : "none"}
          style={[
            styles.menuColumn,
            {
              opacity: menuOpacity,
              transform: [{ translateY: menuTranslateY }],
            },
          ]}
        >
          {items.map((item) => {
            const accent = item.accent || theme.primary;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  close();
                  setTimeout(() => item.onPress(), 180);
                }}
                style={({ pressed }) => [
                  styles.bubbleRow,
                  pressed && { opacity: 0.88 },
                ]}
              >
                <View
                  style={[
                    styles.labelBubble,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      shadowColor: theme.cardShadow,
                      maxWidth: labelMaxWidth,
                    },
                  ]}
                >
                  <Text
                    style={[styles.labelText, { color: theme.text }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.label}
                  </Text>
                </View>
                <View
                  style={[
                    styles.iconBubble,
                    { backgroundColor: accent, shadowColor: accent },
                  ]}
                >
                  <Ionicons name={item.icon} size={22} color={theme.onPrimary} />
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        <Pressable
          onPress={toggle}
          style={[
            styles.mainFab,
            { backgroundColor: theme.primary, shadowColor: theme.primary },
          ]}
        >
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="add" size={28} color={theme.onPrimary} />
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.38)",
  },
  wrap: {
    position: "absolute",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  menuColumn: {
    alignItems: "flex-end",
    gap: 12,
    marginBottom: spacing.md,
    width: "100%",
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    maxWidth: "100%",
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
    flexShrink: 1,
  },
  labelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  iconBubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mainFab: {
    width: MAIN_FAB,
    height: MAIN_FAB,
    borderRadius: MAIN_FAB / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
