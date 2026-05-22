import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="project/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="project/settings" options={{ presentation: "card" }} />
      <Stack.Screen name="chat/[groupId]" options={{ presentation: "card" }} />
      <Stack.Screen name="profile" options={{ presentation: "modal" }} />
      <Stack.Screen name="settings" options={{ presentation: "modal" }} />
    </Stack>
  );
}
