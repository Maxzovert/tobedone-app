import { useState } from "react";
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, typography } from "@/constants/theme";

interface Props extends Pick<TextInputProps, "autoCapitalize" | "autoCorrect" | "keyboardType"> {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  autoCapitalize,
  autoCorrect,
  keyboardType,
}: Props) {
  const { theme } = useTheme();
  const [passwordHidden, setPasswordHidden] = useState(true);
  const isPassword = !!secureTextEntry;
  const hidden = isPassword ? passwordHidden : false;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={hidden}
          multiline={multiline}
          autoCapitalize={autoCapitalize ?? (isPassword ? "none" : "sentences")}
          autoCorrect={autoCorrect ?? !isPassword}
          keyboardType={keyboardType}
          style={[
            styles.input,
            { color: theme.text },
            multiline && styles.multiline,
            isPassword && styles.inputWithIcon,
          ]}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setPasswordHidden((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={22}
              color={theme.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.xs },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 48,
  },
  input: {
    ...typography.body,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  inputWithIcon: {
    paddingRight: spacing.xs,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  eyeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
});
