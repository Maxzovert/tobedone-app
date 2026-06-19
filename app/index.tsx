import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { AppBootSplash } from "@/components/ui/AppBootSplash";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return <AppBootSplash />;

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
