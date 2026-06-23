import { useEffect } from "react";
import { Platform, View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { useAuthStore } from "@/stores/auth-store";
import { useSocketListeners } from "@/hooks/useSocket";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useKeepBackendAwake } from "@/hooks/useKeepBackendAwake";
import { useAppDataWarmup } from "@/hooks/useAppDataWarmup";
import { UrgentAlarmHost } from "@/hooks/useUrgentTaskAlarm";
import { useTaskLocalReminders } from "@/hooks/useTaskLocalReminders";
import { useTheme } from "@/hooks/useTheme";
import { AppBootSplash } from "@/components/ui/AppBootSplash";

SplashScreen.preventAutoHideAsync();

function RootNav() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isDark } = useTheme();

  useSocketListeners(isAuthenticated && !isLoading);
  usePushNotifications(isAuthenticated);
  useTaskLocalReminders(isAuthenticated && !isLoading);
  useKeepBackendAwake();
  useAppDataWarmup();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <>
        <StatusBar style={isDark ? "light" : "dark"} />
        <AppBootSplash />
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <UrgentAlarmHost enabled={isAuthenticated && !isLoading} />
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="(app)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const content = (
    <SafeAreaProvider>
      <QueryProvider>
        <ThemeProvider>
          <RootNav />
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );

  if (Platform.OS === "web") {
    return (
      <GestureHandlerRootView style={styles.webRoot}>
        <View style={styles.webFrame}>{content}</View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>{content}</GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#e8ecf4",
  },
  webFrame: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#f4f6fa",
    ...Platform.select({
      web: {
        boxShadow: "0 0 32px rgba(15, 23, 42, 0.12)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
    }),
  },
});
