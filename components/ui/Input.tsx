import { TextInput, View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { radius, spacing, typography } from "@/constants/theme";

interface Props {
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
}: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            color: theme.text,
            borderColor: theme.border,
          },
          multiline && { minHeight: 80, textAlignVertical: "top" },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.xs },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
});
