import { useSettingsStore } from '@/store/useSettingsStore';

export function useGlassMode(): boolean {
  return useSettingsStore((s) => s.glassMode);
}
