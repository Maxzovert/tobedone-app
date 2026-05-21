import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth-store";
import { profileService } from "@/services/profile.service";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { spacing, typography } from "@/constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [name, setName] = useState(user?.name || "");
  const [designation, setDesignation] = useState(user?.designation || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await profileService.update({
      name,
      designation: designation || null,
    });
    setSaving(false);
    if (res.success && res.data) setUser(res.data);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        <TouchableOpacity onPress={() => router.push("/(app)/settings")}>
          <Ionicons name="settings-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          <Avatar name={user?.name || "?"} uri={user?.avatar} size={80} />
          <Text style={[styles.email, { color: theme.textSecondary }]}>
            {user?.email}
          </Text>
        </View>

        <Input label="Name" value={name} onChangeText={setName} />
        <Input
          label="Designation"
          value={designation}
          onChangeText={setDesignation}
          placeholder="e.g. Product Designer"
        />

        <Button title="Save Changes" onPress={handleSave} loading={saving} />

        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Text style={{ color: theme.danger }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  title: { ...typography.h2 },
  content: { padding: spacing.md },
  avatarWrap: { alignItems: "center", marginBottom: spacing.lg },
  email: { ...typography.caption, marginTop: spacing.sm },
  logout: { marginTop: spacing.xl, alignItems: "center" },
});
