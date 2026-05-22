export const colors = {
  light: {
    background: "#f4f6fa",
    surface: "#ffffff",
    surfaceGlass: "#ffffff",
    text: "#111827",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    primary: "#4f46e5",
    primaryDark: "#4338ca",
    accent: "#7c3aed",
    success: "#059669",
    warning: "#d97706",
    danger: "#dc2626",
    tabBar: "#ffffff",
    cardShadow: "#0f172a",
    skeleton: "#e2e8f0",
    onPrimary: "#ffffff",
    overlay: "rgba(15, 23, 42, 0.45)",
  },
  dark: {
    background: "#0f0f14",
    surface: "#1a1a24",
    surfaceGlass: "rgba(26, 26, 36, 0.72)",
    text: "#f4f4f8",
    textSecondary: "#9ca3af",
    border: "rgba(255, 255, 255, 0.08)",
    primary: "#818cf8",
    primaryDark: "#6366f1",
    accent: "#a78bfa",
    success: "#34d399",
    warning: "#fbbf24",
    danger: "#f87171",
    tabBar: "#1a1a24",
    cardShadow: "rgba(129, 140, 248, 0.15)",
    skeleton: "rgba(255, 255, 255, 0.08)",
    onPrimary: "#ffffff",
    overlay: "rgba(0, 0, 0, 0.55)",
  },
};

export type ThemeColors = (typeof colors)["light"];

export const gradients = {
  auth: {
    light: ["#f4f6fa", "#eef2ff", "#e0e7ff"] as const,
    dark: ["#0f0f14", "#1a1a2e", "#312e81"] as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const },
  h2: { fontSize: 22, fontWeight: "600" as const },
  h3: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
  small: { fontSize: 11, fontWeight: "500" as const },
};
