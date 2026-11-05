export const COLORS = {
  background: '#121212',
  surface: '#1A1A1A',
  surfaceMuted: '#212121',
  surfaceElevated: '#282828',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.45)',
  accent: '#818CF8',
  accentMuted: '#6366F1',
  accentSubtle: 'rgba(129,140,248,0.15)',
  /** Text and icons on an accent fill (desktop `--on-accent`). */
  onAccent: '#0D0D12',
  /** Near-black under the aurora on the sign-in screens (desktop `--ink`). */
  ink: '#0D0D12',
  /** White-alpha fills, desktop `--fill-1` / `--fill-2`: inputs, quiet buttons. */
  fill1: 'rgba(255,255,255,0.05)',
  fill2: 'rgba(255,255,255,0.07)',
  border: 'rgba(255,255,255,0.12)',
  divider: 'rgba(255,255,255,0.08)',
  danger: '#F87171',
  /** Fill and edge of a destructive button. */
  dangerSoft: 'rgba(248,113,113,0.16)',
  dangerRim: 'rgba(248,113,113,0.35)',
  warning: '#FBBF24',
} as const;

export type AppColor = keyof typeof COLORS;
