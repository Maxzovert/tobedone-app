import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/auth-store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthKeyboardLayout } from "@/components/auth/AuthKeyboardLayout";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { gradients, spacing, typography } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import { getApiUrl } from "@/lib/getApiUrl";
import { TobedoneLogo } from "@/components/brand/TobedoneLogo";

export default function LoginScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const err = await login(email.trim(), password);
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
      <AuthKeyboardLayout contentContainerStyle={styles.container}>
        <View style={styles.brandRow}>
          <TobedoneLogo width={72} height={86} color={theme.primary} />
          <Text style={[styles.logo, { color: theme.text }]}>Tobedone</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Team collaboration, reimagined
        </Text>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <Pressable onPress={() => setForgotOpen(true)} style={styles.forgotWrap}>
            <Text style={[styles.forgot, { color: theme.primary }]}>Forgot password?</Text>
          </Pressable>
          {error ? (
            <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
          ) : null}
          <Button title="Sign In" onPress={handleLogin} loading={loading} />
        </View>

        {__DEV__ ? (
          <Text style={[styles.devHint, { color: theme.textSecondary }]}>
            API: {getApiUrl()}
          </Text>
        ) : null}

        <Pressable
          onPress={() => router.push("/(auth)/register")}
          style={styles.linkWrap}
        >
          <Text style={[styles.link, { color: theme.textSecondary }]}>
            Don&apos;t have an account?{" "}
            <Text style={[styles.linkBold, { color: theme.primary }]}>Sign up</Text>
          </Text>
        </Pressable>
      </AuthKeyboardLayout>

      <ForgotPasswordModal
        visible={forgotOpen}
        initialEmail={email}
        onClose={() => setForgotOpen(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  logo: {
    ...typography.h1,
    fontSize: 32,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
  form: { marginTop: spacing.lg },
  forgotWrap: { alignSelf: "flex-end", marginTop: -spacing.xs, marginBottom: spacing.sm },
  forgot: { fontSize: 14, fontWeight: "600" },
  error: { marginBottom: spacing.sm },
  devHint: { ...typography.small, textAlign: "center", marginTop: spacing.md },
  linkWrap: { marginTop: spacing.lg, alignItems: "center", marginBottom: spacing.md },
  link: { ...typography.body },
  linkBold: { fontWeight: "600" },
});
