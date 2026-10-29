import { create } from 'zustand';
import { type EngineStatus, engine, listen, type Tool } from '@/lib/engine';
import { t } from '@/i18n';
import { toast } from './toast';

type EngineState = {
  status: EngineStatus | null;
  error: string | null;
  /** Tool being installed and its download progress (0..1). */
  installing: { tool: Tool; progress: number } | null;
  updating: boolean;
  refresh: () => Promise<void>;
  install: (tool: Tool) => Promise<void>;
  updateYtdlp: () => Promise<void>;
};

const TOOL_NAMES: Record<Tool, string> = { ytdlp: 'yt-dlp', ffmpeg: 'ffmpeg', deno: 'Deno' };

export const useEngine = create<EngineState>((set, get) => {
  void listen<{ tool: Tool; progress: number }>('engine://install-progress', (p) =>
    set({ installing: p }),
  );
  return {
    status: null,
    error: null,
    installing: null,
    updating: false,
    refresh: async () => {
      try {
        set({ status: await engine.status(), error: null });
      } catch (e) {
        set({ error: String(e) });
      }
    },
    install: async (tool) => {
      set({ installing: { tool, progress: 0 } });
      try {
        await engine.install(tool);
        toast(t('engine.installed', { tool: TOOL_NAMES[tool] }));
      } catch (e) {
        toast(
          t('engine.installFailed', {
            tool: TOOL_NAMES[tool],
            error: String(e),
          }),
          'error',
        );
      } finally {
        set({ installing: null });
        await get().refresh();
      }
    },
    updateYtdlp: async () => {
      set({ updating: true });
      try {
        const v = await engine.updateYtdlp();
        toast(t('engine.updated', { version: v }));
      } catch (e) {
        toast(t('engine.updateFailed', { error: String(e) }), 'error');
      } finally {
        set({ updating: false });
        await get().refresh();
      }
    },
  };
});
