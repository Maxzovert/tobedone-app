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

export default function RegisterScreen() {
  const router = useRouter();
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
    <LinearGradient colors={["#0f0f14", "#1a1a2e", "#4c1d95"]} style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>Create account</Text>
          <Text style={styles.subtitle}>Join your team on Tobedone</Text>

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
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Create Account" onPress={handleRegister} loading={loading} />
          </View>

          <TouchableOpacity style={styles.linkWrap}>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.link}>
                Already have an account? <Text style={styles.linkBold}>Sign in</Text>
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
  logo: { ...typography.h1, color: "#fff", marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: "rgba(255,255,255,0.7)", marginBottom: spacing.xl },
  form: { marginTop: spacing.lg },
  error: { color: "#f87171", marginBottom: spacing.sm },
  linkWrap: { marginTop: spacing.lg, alignItems: "center" },
  link: { color: "rgba(255,255,255,0.7)" },
  linkBold: { color: "#a78bfa", fontWeight: "600" },
});
