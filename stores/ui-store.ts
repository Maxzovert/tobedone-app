import { create } from "zustand";

type ThemeMode = "light" | "dark" | "system";

interface UIState {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setIsDark: (dark: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  themeMode: "light",
  isDark: false,
  setThemeMode: (mode) => set({ themeMode: mode }),
  setIsDark: (isDark) => set({ isDark }),
}));
