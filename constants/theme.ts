export const colors = {
  light: {
    background: "#f8f9fc",
    surface: "#ffffff",
    surfaceGlass: "rgba(255,255,255,0.72)",
    text: "#0f0f14",
    textSecondary: "#6b7280",
    border: "rgba(15,15,20,0.08)",
    primary: "#6366f1",
    primaryDark: "#4f46e5",
    accent: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    tabBar: "#ffffff",
    cardShadow: "rgba(99,102,241,0.12)",
  },
  dark: {
    background: "#0f0f14",
    surface: "#1a1a24",
    surfaceGlass: "rgba(26,26,36,0.72)",
    text: "#f4f4f8",
    textSecondary: "#9ca3af",
    border: "rgba(255,255,255,0.08)",
    primary: "#818cf8",
    primaryDark: "#6366f1",
    accent: "#a78bfa",
    success: "#34d399",
    warning: "#fbbf24",
    danger: "#f87171",
    tabBar: "#1a1a24",
    cardShadow: "rgba(129,140,248,0.15)",
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
