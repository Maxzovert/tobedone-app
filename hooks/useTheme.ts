import { useColorScheme } from "react-native";
import { colors } from "@/constants/theme";
import { useUIStore } from "@/stores/ui-store";

export function useTheme() {
  const systemScheme = useColorScheme();
  const { themeMode, isDark: storedDark, setIsDark } = useUIStore();

  const isDark =
    themeMode === "system"
      ? systemScheme === "dark"
      : themeMode === "dark";

  const theme = isDark ? colors.dark : colors.light;

  return { theme, isDark, themeMode, setIsDark };
}
