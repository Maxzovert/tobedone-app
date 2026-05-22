import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/auth-store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { gradients, spacing, typography } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { TobedoneLogo } from "@/components/brand/TobedoneLogo";

export default function RegisterScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError("");
    setLoading(true);
    const err = await register(name.trim(), email.trim(), password);
    setLoading(false);
    if (err) setError(err);
    else router.replace("/(app)/(tabs)/home");
  };

  return (
    <LinearGradient
      colors={
        isDark ? [...gradients.auth.dark] : [...gradients.auth.light]
      }
      style={styles.flex}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandRow}>
            <TobedoneLogo width={64} height={77} color={theme.primary} />
            <View>
              <Text style={[styles.logo, { color: theme.text }]}>Create account</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Join your team on Tobedone
              </Text>
            </View>
          </View>

          <View style={styles.form}>
            <Input label="Name" value={name} onChangeText={setName} placeholder="Your name" />
            <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@company.com" />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min 6 characters"
              secureTextEntry
            />
            {error ? (
              <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
            ) : null}
            <Button title="Create Account" onPress={handleRegister} loading={loading} />
          </View>

          <TouchableOpacity style={styles.linkWrap}>
            <Link href="/(auth)/login" asChild>
              <Text style={[styles.link, { color: theme.textSecondary }]}>
                Already have an account?{" "}
                <Text style={[styles.linkBold, { color: theme.primary }]}>
                  Sign in
                </Text>
              </Text>
            </Link>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  logo: { ...typography.h1, marginBottom: spacing.xs },
  subtitle: { ...typography.body },
  form: { marginTop: spacing.lg },
  error: { marginBottom: spacing.sm },
  linkWrap: { marginTop: spacing.lg, alignItems: "center" },
  link: { ...typography.body },
  linkBold: { fontWeight: "600" },
});
