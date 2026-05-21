import { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { spacing, radius } from "@/constants/theme";
import { getSocket } from "@/lib/socket";

interface Props {
  groupId: string;
  onSend: (content: string) => void;
}

export function ChatInput({ groupId, onSend }: Props) {
  const { theme } = useTheme();
  const [text, setText] = useState("");
  const typingRef = useRef(false);

  const handleChange = (value: string) => {
    setText(value);
    const socket = getSocket();
    if (!socket) return;

    if (value.length > 0 && !typingRef.current) {
      typingRef.current = true;
      socket.emit("typing:start", { groupId });
    } else if (value.length === 0 && typingRef.current) {
      typingRef.current = false;
      socket.emit("typing:stop", { groupId });
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    const socket = getSocket();
    if (socket) socket.emit("typing:stop", { groupId });
    typingRef.current = false;
    onSend(text.trim());
    setText("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={handleChange}
          placeholder="Message..."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.send, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
