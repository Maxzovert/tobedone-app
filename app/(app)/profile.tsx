import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    const res = await profileService.update({
      name,
      designation: designation || null,
    });
    setSaving(false);
    if (res.success && res.data) setUser(res.data);
  };

  const handlePickAvatar = async () => {
    setAvatarError("");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow photo library access to choose a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setAvatarLoading(true);
    const res = await profileService.uploadAvatarFromUri(
      asset.uri,
      asset.mimeType ?? "image/jpeg"
    );
    setAvatarLoading(false);

    if (!res.success) {
      setAvatarError(res.error || "Could not update profile photo");
      return;
    }
    if (res.data) setUser(res.data);
  };

  const handleRemoveAvatar = () => {
    Alert.alert("Remove photo", "Use your initials instead of a photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setAvatarLoading(true);
          const res = await profileService.update({ avatar: null });
          setAvatarLoading(false);
          if (res.success && res.data) setUser(res.data);
        },
      },
    ]);
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
          <Pressable
            onPress={handlePickAvatar}
            disabled={avatarLoading}
            style={({ pressed }) => [styles.avatarPressable, { opacity: pressed ? 0.9 : 1 }]}
          >
            <Avatar name={user?.name || "?"} uri={user?.avatar} size={96} />
            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: theme.primary, borderColor: theme.surface },
              ]}
            >
              {avatarLoading ? (
                <ActivityIndicator size="small" color={theme.onPrimary} />
              ) : (
                <Ionicons name="camera" size={18} color={theme.onPrimary} />
              )}
            </View>
          </Pressable>
          <Text style={[styles.avatarHint, { color: theme.textSecondary }]}>
            Tap to change photo
          </Text>
          {user?.avatar ? (
            <Pressable onPress={handleRemoveAvatar} disabled={avatarLoading}>
              <Text style={[styles.removePhoto, { color: theme.danger }]}>Remove photo</Text>
            </Pressable>
          ) : null}
          {avatarError ? (
            <Text style={[styles.avatarError, { color: theme.danger }]}>{avatarError}</Text>
          ) : null}
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email}</Text>
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
  avatarPressable: { position: "relative" },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHint: { ...typography.caption, marginTop: spacing.sm },
  removePhoto: { fontSize: 13, fontWeight: "600", marginTop: spacing.xs },
  avatarError: { ...typography.caption, marginTop: spacing.xs, textAlign: "center" },
  email: { ...typography.caption, marginTop: spacing.xs },
  logout: { marginTop: spacing.xl, alignItems: "center" },
});
