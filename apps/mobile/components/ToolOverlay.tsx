import { useEffect } from 'react';
import { BackHandler } from 'react-native';

import { GlassAmbientBackground } from '@/components/glass/GlassAmbientBackground';
import { Presence, useHeld } from '@/components/motion/Presence';
import { YoutubeLoginScreen } from '@/components/screens/YoutubeLoginScreen';
import { YtdlpLabScreen } from '@/components/screens/YtdlpLabScreen';
import { COLORS } from '@/constants/colors';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useOverlayStore } from '@/store/useOverlayStore';

/**
 * The pages Settings pushes: the yt-dlp lab and the YouTube sign-in. They
 * are layers here, above Settings, and not navigator routes: a route is
 * drawn under every overlay, so it opened behind the profile.
 */
export function ToolOverlay() {
  const tool = useOverlayStore((s) => s.tool);
  const closeTool = useOverlayStore((s) => s.closeTool);
  const shown = useHeld(tool);
  const glassMode = useGlassMode();

  useEffect(() => {
    if (!tool) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeTool();
      return true;
    });

    return () => sub.remove();
  }, [tool, closeTool]);

  return (
    <Presence
      visible={!!tool}
      from="right"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1003,
        backgroundColor: COLORS.background,
      }}
    >
      {glassMode ? <GlassAmbientBackground /> : null}
      {shown === 'ytdlp-lab' ? <YtdlpLabScreen onClose={closeTool} /> : null}
      {shown === 'youtube-login' ? (
        <YoutubeLoginScreen onClose={closeTool} />
      ) : null}
    </Presence>
  );
}
