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
import { spacing, typography } from "@/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    const err = await login(email.trim(), password);
    setLoading(false);
    if (err) setError(err);
    else router.replace("/(app)/(tabs)/home");
  };

  return (
    <LinearGradient colors={["#0f0f14", "#1a1a2e", "#312e81"]} style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>Tobedone</Text>
          <Text style={styles.subtitle}>Team collaboration, reimagined</Text>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Sign In" onPress={handleLogin} loading={loading} />
          </View>

          <TouchableOpacity style={styles.linkWrap}>
            <Link href="/(auth)/register" asChild>
              <Text style={styles.link}>
                Don&apos;t have an account? <Text style={styles.linkBold}>Sign up</Text>
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
  logo: {
    ...typography.h1,
    color: "#fff",
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: "rgba(255,255,255,0.7)",
    marginBottom: spacing.xl,
  },
  form: { marginTop: spacing.lg },
  error: { color: "#f87171", marginBottom: spacing.sm },
  linkWrap: { marginTop: spacing.lg, alignItems: "center" },
  link: { color: "rgba(255,255,255,0.7)" },
  linkBold: { color: "#818cf8", fontWeight: "600" },
});
