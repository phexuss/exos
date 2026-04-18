export const COLORS = {
  background: "#121212",
  surface: "#1A1A1A",
  surfaceMuted: "#212121",
  surfaceElevated: "#282828",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.7)",
  textMuted: "rgba(255,255,255,0.45)",
  accent: "#818CF8",
  accentMuted: "#6366F1",
  accentSubtle: "rgba(129,140,248,0.15)",
  border: "rgba(255,255,255,0.12)",
  divider: "rgba(255,255,255,0.08)",
  danger: "#F87171",
  warning: "#FBBF24",
} as const;

export type AppColor = keyof typeof COLORS;
