import { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth.service";
import { spacing, radius, typography } from "@/constants/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  initialEmail?: string;
};

export function ForgotPasswordModal({ visible, onClose, initialEmail = "" }: Props) {
  const { theme } = useTheme();
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ password: string; email: string } | null>(null);

  const reset = () => {
    setError("");
    setResult(null);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    const res = await authService.forgotPassword(email.trim().toLowerCase());
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error || "Could not retrieve password");
      return;
    }
    setResult({ password: res.data.password, email: res.data.email });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Forgot password</Text>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </Pressable>
          </View>

          {result ? (
            <>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                Your password for {result.email}:
              </Text>
              <View style={[styles.passwordBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.password, { color: theme.text }]} selectable>
                  {result.password}
                </Text>
              </View>
              <Button title="Done" onPress={handleClose} />
            </>
          ) : (
            <>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                Enter your email and we&apos;ll show your password on this device.
              </Text>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {error ? (
                <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
              ) : null}
              <Button
                title={loading ? "Looking up…" : "Show my password"}
                onPress={handleSubmit}
                loading={loading}
                disabled={!email.trim() || loading}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { ...typography.h3, fontWeight: "700" },
  body: { ...typography.body, lineHeight: 22 },
  passwordBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },
  password: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
  },
  error: { marginBottom: spacing.sm },
});
