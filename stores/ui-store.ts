import { create } from "zustand";

type ThemeMode = "light" | "dark" | "system";

interface UIState {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setIsDark: (dark: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  themeMode: "system",
  isDark: true,
  setThemeMode: (mode) => set({ themeMode: mode }),
  setIsDark: (isDark) => set({ isDark }),
}));
