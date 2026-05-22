import { ReactNode, useEffect } from "react";
import { useColorScheme } from "react-native";
import { useUIStore } from "@/stores/ui-store";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const setIsDark = useUIStore((s) => s.setIsDark);
  const themeMode = useUIStore((s) => s.themeMode);

  useEffect(() => {
    if (themeMode === "system") {
      setIsDark(scheme === "dark");
    } else {
      setIsDark(themeMode === "dark");
    }
  }, [scheme, themeMode, setIsDark]);

  return <>{children}</>;
}
